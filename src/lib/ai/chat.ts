import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getLlmProvider } from "./index";
import { toolMap, toolDefinitions, type ToolContext } from "./tools";
import type { AiMessage, ToolResult } from "./provider";

/**
 * Assistant orchestration. Runs a tool-use loop against the LLM provider.
 * Simulated conversations short-circuit to simulatedRespond(), which executes
 * real backend tools (real DB data) — never fabricated answers.
 */
export async function runAssistantChat(params: {
  homeId: string;
  conversationId?: string;
  message: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const supabase = await createClient();
  const ctx: ToolContext = { userId: user.id, homeId: params.homeId };

  // Resolve / create conversation
  let conversationId = params.conversationId;
  if (!conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ home_id: params.homeId, user_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    conversationId = data.id;
  } else {
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("home_id", params.homeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!convo) throw new Error("conversation_not_found");
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: params.message
  });

  const provider = getLlmProvider();
  let reply: string;
  let toolCalls: unknown = null;

  if (provider.isSimulated) {
    reply = await simulatedRespond(params.message, ctx, supabase, conversationId);
  } else {
    const result = await realLlmChat({
      provider,
      ctx,
      conversationId,
      userMessage: params.message,
      supabase
    });
    reply = result.reply;
    toolCalls = result.toolCalls;
  }

  const { error: insertErr } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: reply,
    tool_calls: toolCalls as never
  });
  if (insertErr) throw insertErr;

  return { reply, conversationId };
}

async function realLlmChat(args: {
  provider: ReturnType<typeof getLlmProvider>;
  ctx: ToolContext;
  conversationId: string;
  userMessage: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const { provider, ctx, conversationId, userMessage, supabase } = args;
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(30);

  const messages: AiMessage[] = [
    {
      role: "system",
      content:
        "You are HomeAtlas AI, a spatial-memory assistant. Answer using the " +
        "provided tools which query the user's real home data. Never invent a " +
        "physical location. If data is missing or uncertain, say so. " +
        "Only answer about the selected home."
    },
    ...(history?.map((h) => ({ role: h.role as AiMessage["role"], content: h.content })) ?? []),
    { role: "user" as const, content: userMessage }
  ];

  const toolResults: ToolResult[] = [];
  let reply = "";
  let toolCalls: unknown = null;

  for (let i = 0; i < 6; i++) {
    const res = await provider.chat({
      messages,
      tools: toolDefinitions()
    });
    if (res.toolCalls?.length) {
      toolCalls = res.toolCalls;
      let appended = "";
      for (const call of res.toolCalls) {
        const tool = toolMap.get(call.name);
        if (!tool) {
          appended += `Tool ${call.name} not found.`;
          continue;
        }
        try {
          const parsed = tool.parameters.safeParse(call.arguments);
          const output = parsed.success
            ? await tool.execute(parsed.data, ctx)
            : { error: "Invalid arguments", issues: parsed.error.issues };
          toolResults.push({ toolCallId: call.id, name: call.name, output });
          appended += JSON.stringify(output);
        } catch (e) {
          toolResults.push({ toolCallId: call.id, name: call.name, output: { error: String(e) } });
          appended += JSON.stringify({ error: String(e) });
        }
      }
      messages.push({ role: "assistant" as const, content: "" });
      messages.push({ role: "user" as const, content: appended });
      continue;
    }
    reply = res.content;
    break;
  }

  return { reply, toolCalls };
}

const INTENTS: { test: RegExp; tool: string; arg: (m: RegExpMatchArray) => Record<string, unknown> }[] = [
  {
    test: /(?:where|find|locate).*(?:camera|battery|charger)/,
    tool: "searchObjects",
    arg: () => ({ query: "camera battery charger" })
  },
  {
    test: /where is my|find my|locate/,
    tool: "searchObjects",
    arg: (m) => ({ query: (m[0] ?? "").replace(/where is my|find my|locate/g, "").trim() })
  },
  {
    test: /show all (electronics|furniture|appliances|books|accessories|collectibles|storage)/,
    tool: "searchObjects",
    arg: (m) => {
      const cat = m[1];
      const map: Record<string, string> = {
        electronics: "electronics",
        furniture: "furniture",
        appliances: "appliance",
        books: "book",
        accessories: "accessory",
        collectibles: "collectible",
        storage: "storage_container"
      };
      return { category: map[cat ?? ""] ?? cat };
    }
  },
  {
    test: /(?:in|inside) (?:the )?(storage room|study|bedroom|kitchen|living room|bathroom|garage)/,
    tool: "searchObjects",
    arg: (m) => ({ query: m[1] ?? "" })
  },
  {
    test: /without (warranty|receipt)|no (warranty|receipt)/,
    tool: "getDocuments",
    arg: () => ({})
  },
  {
    test: /last scan|recent scan|what did i last scan/,
    tool: "compareScans",
    arg: () => ({})
  },
  {
    test: /moving inventory|insurance inventory|prepare.*report/,
    tool: "searchObjects",
    arg: () => ({ limit: 30 })
  },
  {
    test: /collectible/,
    tool: "searchObjects",
    arg: () => ({ category: "collectible" })
  }
];

async function simulatedRespond(
  message: string,
  ctx: ToolContext,
  supabase: Awaited<ReturnType<typeof createClient>>,
  _conversationId: string
): Promise<string> {
  const lower = message.toLowerCase();
  const hit = INTENTS.find((i) => i.test.test(lower));
  const tool = hit ? toolMap.get(hit.tool) : toolMap.get("searchObjects");
  if (!tool) return "I can help you find things. Try asking “where is my camera battery?”.";

  const args = hit ? hit.arg(lower.match(hit.test) ?? []) : { query: lower };
  let parsed = tool.parameters.safeParse(args);
  if (!parsed.success) parsed = tool.parameters.safeParse({ query: lower });

  try {
    const output = await tool.execute(parsed.data ?? {}, ctx);
    return formatToolAnswer(tool.name, output);
  } catch {
    return "I couldn't look that up right now. Please try again.";
  }
}

function formatToolAnswer(toolName: string, output: any): string {
  if (toolName === "searchObjects") {
    const objects = output?.objects ?? [];
    if (objects.length === 0) {
      return "I couldn't find any matching objects in this home. Try a different search.";
    }
    const lines = objects.slice(0, 5).map((o: any) => {
      const room = o.room?.name ?? "an unknown room";
      const container = o.location?.container_object_id ? "inside a container" : "";
      const when = o.location?.observed_at ? ` (last seen ${o.location.observed_at})` : "";
      return `- ${o.name} — ${room}${container ? " " + container : ""}${when}`;
    });
    return `I found ${objects.length} matching object(s):\n${lines.join("\n")}`;
  }
  if (toolName === "getDocuments") {
    const docs = output?.documents ?? [];
    if (docs.length === 0) return "No receipts or warranties are attached to any objects yet.";
    return `I found ${docs.length} document(s):\n${docs
      .slice(0, 5)
      .map((d: any) => `- ${d.filename} (${d.kind}) for ${d.object?.name ?? "unknown"}`)
      .join("\n")}`;
  }
  return JSON.stringify(output);
}

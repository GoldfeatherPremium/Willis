"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Where is my camera battery?",
  "Show all electronics",
  "Which objects are in my storage room?",
  "Find items without warranty records",
  "Prepare a moving inventory",
  "Show my collectible items"
];

export function AssistantChat({ homeId, simulated }: { homeId: string; simulated: boolean }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId, message: content })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Assistant unavailable.");
      setMessages((prev) => [...prev, { role: "assistant", content: json.data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <Card className="flex h-[560px] flex-col">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-display text-sm font-semibold text-primary">HomeAtlas AI</h2>
            {simulated && (
              <Badge tone="warm">Simulated (dev) assistant — answers from your real data</Badge>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="pt-6 text-center">
                <p className="font-display text-base font-semibold text-primary">Just ask. Your home remembers.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-secondary">
                  Ask about any belonging, room, or document. The assistant only
                  answers from your actual data.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                    (m.role === "user"
                      ? "bg-accent text-bg"
                      : "border border-border bg-bg-secondary text-primary")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-bg-secondary px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" style={{ animationDelay: "120ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
            {error && <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">{error}</div>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-end gap-2">
              <Textarea
                rows={1}
                placeholder="Ask about your home…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="max-h-32 resize-none"
              />
              <Button onClick={() => send()} loading={loading} disabled={!input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold text-primary">Try asking</h3>
          <div className="mt-3 flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-xl border border-border bg-bg-secondary/60 px-3.5 py-2.5 text-left text-sm text-secondary transition-colors hover:border-accent/30 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs leading-relaxed text-secondary">
            HomeAtlas AI answers from your real scans, observations, and
            documents. It never invents a physical location — if something
            hasn't been observed, it will tell you.
          </p>
        </Card>
      </div>
    </div>
  );
}

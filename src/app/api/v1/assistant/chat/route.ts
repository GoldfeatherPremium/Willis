import { z } from "zod";
import {
  withErrorHandling,
  ok,
  requireApiUser,
  requireApiHomeAccess
} from "@/lib/api-helpers";
import { runAssistantChat } from "@/lib/ai/chat";

const chatSchema = z.object({
  homeId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().optional()
});

export const POST = withErrorHandling(async (request) => {
  await requireApiUser();
  const body = chatSchema.parse(await request.json());
  await requireApiHomeAccess(body.homeId);

  const { reply, conversationId } = await runAssistantChat({
    homeId: body.homeId,
    conversationId: body.conversationId,
    message: body.message
  });

  return ok({ reply, conversationId });
});

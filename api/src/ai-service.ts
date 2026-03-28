import OpenAI from "openai";
import { z } from "zod";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import type { GenerateRequest, TipTapDoc } from "./types.js";

const tipTapNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.any()).optional(),
    content: z.array(tipTapNodeSchema).optional(),
    text: z.string().optional(),
  }),
);

const tipTapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(tipTapNodeSchema),
});

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateDoc(input: GenerateRequest): Promise<TipTapDoc> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: { type: "json_object" },
  });
  
  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No content returned from OpenAI");
  }

  const parsed = tipTapDocSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("Invalid JSON returned from OpenAI");
  }
  return parsed.data;
}

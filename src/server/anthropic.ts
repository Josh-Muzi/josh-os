/**
 * Anthropic API helper for JoshOS games.
 * - Key lives ONLY in server env (.env.local / Vercel env). Never client.
 * - generateJson: one call + Zod validation + one corrective retry.
 * - Kill switch: set AI_GAMES_DISABLED=1 to force every game into its
 *   offline fallback content without a deploy.
 */
import type { z } from "zod";

// Versioned model string (preferred over the "claude-haiku-4-5" alias
// for production stability). ~$1/$5 per MTok in/out as of 2026-08.
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const TIMEOUT_MS = 8000;

export function aiAvailable(): boolean {
  return (
    !!process.env.ANTHROPIC_API_KEY && process.env.AI_GAMES_DISABLED !== "1"
  );
}

async function callHaiku(
  system: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": ANTHROPIC_VERSION,
    };
    // Identity-linked API keys must declare the workspace they act in.
    // Workspace-scoped keys don't need this; harmless when unset.
    if (process.env.ANTHROPIC_WORKSPACE_ID) {
      headers["anthropic-workspace-id"] = process.env.ANTHROPIC_WORKSPACE_ID;
    }
    const response = await fetch(API_URL, {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: maxTokens,
        temperature: 1,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!response.ok) {
      // Surface the API's own explanation — status alone hides the cause.
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      throw new Error(`Anthropic API ${response.status}: ${detail}`);
    }
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("");
    if (!text) throw new Error("Empty model response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text: string): string {
  // Strip markdown fences if the model added them despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  // Trim any stray prose around the outermost object.
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return candidate;
  return candidate.slice(start, end + 1);
}

/**
 * Ask Haiku for JSON matching `schema`. One corrective retry on
 * invalid output, then throws. Callers catch and use their fallback.
 */
export async function generateJson<T>(
  system: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  maxTokens = 300,
): Promise<T> {
  if (!aiAvailable()) throw new Error("AI disabled or key missing");

  const first = await callHaiku(system, userPrompt, maxTokens);
  const parsed = schema.safeParse(safeJson(extractJson(first)));
  if (parsed.success) return parsed.data;

  const retryPrompt = `${userPrompt}\n\nYour previous reply was invalid: ${parsed.error.message.slice(0, 300)}\nReply again with ONLY the corrected JSON object.`;
  const second = await callHaiku(system, retryPrompt, maxTokens);
  const reparsed = schema.safeParse(safeJson(extractJson(second)));
  if (reparsed.success) return reparsed.data;
  throw new Error("Model output failed validation twice");
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

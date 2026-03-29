import { APIUserAbortError } from "openai";

export function isAIAbortError(error: unknown) {
  return error instanceof APIUserAbortError || (error instanceof Error && error.name === "AbortError");
}

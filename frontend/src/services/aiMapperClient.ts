/**
 * Client-side interface for SAMANVAYSETU AI Schema Mapper.
 *
 * NOTE: All Gemini calls and API keys are strictly server-side.
 * This client communicates with /api/v1/ai/suggest-mapping and gracefully
 * handles errors, ensuring that deterministic mapping remains uninterrupted.
 */

import type { AiMappingResponse, AiMappingSuggestion } from "./aiSchemaMapperService";

export type { AiMappingResponse, AiMappingSuggestion };

export async function requestAiSchemaSuggestions(
  schemaPayload: Record<string, unknown> | string
): Promise<AiMappingResponse> {
  const fallbackTimestamp = new Date().toISOString();

  try {
    const res = await fetch("/api/v1/ai/suggest-mapping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        typeof schemaPayload === "string" ? { rawSchema: schemaPayload } : { schema: schemaPayload }
      ),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return {
        success: false,
        suggestions: [],
        error: errJson?.error || "AI suggestions unavailable.",
        details: errJson?.details || "Deterministic mapping remains available through mapping-registry-v1.",
        aiAvailable: errJson?.aiAvailable ?? false,
        source: "gemini_ai_suggestion",
        timestamp: fallbackTimestamp,
      };
    }

    const data = (await res.json()) as AiMappingResponse;
    return data;
  } catch (err: unknown) {
    return {
      success: false,
      suggestions: [],
      error: "AI suggestions unavailable.",
      details: "Deterministic mapping remains available through mapping-registry-v1.",
      aiAvailable: false,
      source: "gemini_ai_suggestion",
      timestamp: fallbackTimestamp,
    };
  }
}

export async function fetchAiMapperStatus(): Promise<{
  aiAvailable: boolean;
  model: string;
  deterministicAuthoritative: boolean;
}> {
  try {
    const res = await fetch("/api/v1/ai/status");
    if (res.ok) {
      return (await res.json()) as {
        aiAvailable: boolean;
        model: string;
        deterministicAuthoritative: boolean;
      };
    }
  } catch {
    // Network or server error
  }

  return {
    aiAvailable: false,
    model: "gemini-flash-latest",
    deterministicAuthoritative: true,
  };
}

/**
 * Server-side AI Schema Mapper Service for SAMANVAYSETU.
 *
 * ARCHITECTURAL MANDATES:
 * - AI is ONLY an advisory suggestion layer (Review Only).
 * - Deterministic mapping registry (mapping-registry-v1) is authoritative.
 * - The Gemini API key remains strictly server-side and is never sent to the browser or logged.
 * - AI suggestions must conform to known canonical models. The AI cannot invent canonical fields.
 * - If Gemini is unavailable, the system safely falls back with a clear message:
 *   "AI suggestions unavailable. Deterministic mapping remains available through mapping-registry-v1."
 */

import { GoogleGenAI, Type } from "@google/genai";

export const KNOWN_CANONICAL_MODELS: Record<string, string[]> = {
  CitizenProfile: ["citizen_id", "name", "date_of_birth"],
  EducationRecord: [
    "citizen_id",
    "student_id",
    "student_name",
    "date_of_birth",
    "course",
    "institution",
    "enrollment_status",
  ],
  IncomeRecord: [
    "citizen_id",
    "applicant_name",
    "annual_family_income",
    "certificate_number",
    "financial_year",
  ],
};

export interface AiMappingSuggestion {
  source_field: string;
  suggested_model: "CitizenProfile" | "EducationRecord" | "IncomeRecord" | "NO_CONFIDENT_MATCH";
  suggested_field: string;
  confidence: number;
  reason: string;
}

export interface AiMappingResponse {
  success: boolean;
  suggestions: AiMappingSuggestion[];
  modelUsed?: string;
  source: "gemini_ai_suggestion";
  error?: string;
  details?: string;
  aiAvailable: boolean;
  timestamp: string;
}

/**
 * Validates and sanitizes suggestions from the AI model.
 * Enforces that no invented canonical fields are accepted.
 */
export function validateAndSanitizeSuggestions(rawList: unknown): AiMappingSuggestion[] {
  if (!Array.isArray(rawList)) {
    return [];
  }

  const validSuggestions: AiMappingSuggestion[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;

    const sourceField = String(raw.source_field || "").trim();
    if (!sourceField) continue;

    let model = String(raw.suggested_model || "").trim();
    let field = String(raw.suggested_field || "").trim();
    let confidence = typeof raw.confidence === "number" ? raw.confidence : parseFloat(String(raw.confidence || "0"));
    if (isNaN(confidence)) confidence = 0.5;
    confidence = Math.max(0.0, Math.min(1.0, Math.round(confidence * 100) / 100));

    const reason = String(raw.reason || "Semantic mapping inferred from field name.").trim();

    // Check if model is known
    if (model !== "CitizenProfile" && model !== "EducationRecord" && model !== "IncomeRecord") {
      model = "NO_CONFIDENT_MATCH";
      field = "NO_CONFIDENT_MATCH";
    } else {
      // Model is known; check if field is known in that model
      const allowedFields = KNOWN_CANONICAL_MODELS[model] || [];
      if (!allowedFields.includes(field)) {
        // AI invented a field or matched incorrectly
        model = "NO_CONFIDENT_MATCH";
        field = "NO_CONFIDENT_MATCH";
      }
    }

    validSuggestions.push({
      source_field: sourceField,
      suggested_model: model as AiMappingSuggestion["suggested_model"],
      suggested_field: field,
      confidence,
      reason,
    });
  }

  return validSuggestions;
}

/**
 * Retrieves the configured API key without logging or exposing it.
 */
export function getGeminiApiKey(): string | null {
  const key = process.env.AI_SCHEMA_MAPPER_API_KEY || process.env.GEMINI_API_KEY;
  if (key && key.trim()) {
    return key.trim();
  }
  return null;
}

/**
 * Checks if the server-side AI mapper is configured.
 */
export function isAiMapperConfigured(): boolean {
  return getGeminiApiKey() !== null;
}

/**
 * Resolves candidate models in prioritized order.
 */
export function getCandidateModels(): string[] {
  const configured = process.env.AI_SCHEMA_MAPPER_MODEL?.trim();
  const list: string[] = [];
  if (configured && configured !== "gemini-2.5-flash") {
    list.push(configured);
  }
  list.push("gemini-flash-latest");
  list.push("gemini-3.8-flash");
  list.push("gemini-3.1-flash-lite");
  return Array.from(new Set(list));
}

/**
 * Executes AI schema mapping request against Gemini models.
 * Automatically handles missing keys, timeouts, model rotation, and validation.
 */
export async function suggestSchemaMappings(
  rawInput: Record<string, unknown> | string
): Promise<AiMappingResponse> {
  const timestamp = new Date().toISOString();
  const apiKey = getGeminiApiKey();

  // 1. Check API Key presence
  if (!apiKey) {
    return {
      success: false,
      suggestions: [],
      error: "AI suggestions unavailable.",
      details: "Deterministic mapping remains available through mapping-registry-v1.",
      aiAvailable: false,
      source: "gemini_ai_suggestion",
      timestamp,
    };
  }

  // 2. Parse input into clean key-value / schema representation
  let parsedPayload: Record<string, unknown> = {};
  if (typeof rawInput === "string") {
    try {
      parsedPayload = JSON.parse(rawInput);
    } catch {
      return {
        success: false,
        suggestions: [],
        error: "Malformed JSON schema input.",
        details: "Please provide valid JSON format for schema mapping.",
        aiAvailable: true,
        source: "gemini_ai_suggestion",
        timestamp,
      };
    }
  } else if (rawInput && typeof rawInput === "object") {
    parsedPayload = rawInput;
  }

  const fieldsToInspect = Object.keys(parsedPayload);
  if (fieldsToInspect.length === 0) {
    return {
      success: false,
      suggestions: [],
      error: "No source fields found in input payload.",
      details: "Provide at least one departmental field to analyze.",
      aiAvailable: true,
      source: "gemini_ai_suggestion",
      timestamp,
    };
  }

  // 3. Initialize GenAI client
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const prompt = `You are the AI Semantic Schema Mapping Assistant for SAMANVAYSETU, India's national interoperability gateway for citizen services.

Your responsibility is to inspect incoming departmental data fields (which may use legacy, state-specific, or non-standard naming conventions) and suggest semantic mappings to SAMANVAYSETU's standard canonical models.

==================================================
ARCHITECTURAL CONSTRAINTS:
==================================================
1. You are ONLY an advisory suggestion layer (REVIEW ONLY).
2. The deterministic mapping registry (mapping-registry-v1) is authoritative.
3. You MUST NOT invent any canonical models or fields.
4. If a source field has no confident correspondence, return suggested_model: "NO_CONFIDENT_MATCH" and suggested_field: "NO_CONFIDENT_MATCH".

==================================================
KNOWN CANONICAL MODELS AND FIELDS:
==================================================
1. CitizenProfile:
   - citizen_id (citizen identifier e.g. CIT-XXXX or national ID)
   - name (full legal name of citizen / beneficiary)
   - date_of_birth (birth date ISO-8601)

2. EducationRecord:
   - citizen_id (reference to citizen)
   - student_id (institutional student roll/registration number)
   - student_name (name of student in academic records)
   - date_of_birth (birth date in academic records)
   - course (degree program e.g. B.Tech, B.Sc, Diploma)
   - institution (college, university, or polytechnic name)
   - enrollment_status (e.g. ACTIVE, COMPLETED, SUSPENDED)

3. IncomeRecord:
   - citizen_id (reference to citizen)
   - applicant_name (name on income certificate)
   - annual_family_income (total yearly household earnings in INR)
   - certificate_number (revenue authority certificate number)
   - financial_year (assessment or financial year e.g. 2024-2025)

==================================================
INPUT DATA TO ANALYZE:
==================================================
${JSON.stringify(parsedPayload, null, 2)}

Provide a suggested mapping for every top-level field in the input.`;

  const candidateModels = getCandidateModels();
  let lastError: unknown = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source_field: { type: Type.STRING },
                    suggested_model: { type: Type.STRING },
                    suggested_field: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                  },
                  required: ["source_field", "suggested_model", "suggested_field", "confidence", "reason"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      });

      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error("Empty response returned by Gemini model.");
      }

      const parsedResponse = JSON.parse(responseText);
      const validatedSuggestions = validateAndSanitizeSuggestions(parsedResponse.suggestions);

      return {
        success: true,
        suggestions: validatedSuggestions,
        modelUsed: model,
        source: "gemini_ai_suggestion",
        aiAvailable: true,
        timestamp,
      };
    } catch (err: unknown) {
      lastError = err;
      // If 503 or transient error, try next candidate model
      continue;
    }
  }

  // If all models failed or threw:
  const errMessage = lastError instanceof Error ? lastError.message : "Service error";
  return {
    success: false,
    suggestions: [],
    error: "AI suggestions unavailable.",
    details: `Deterministic mapping remains available through mapping-registry-v1. (${errMessage})`,
    aiAvailable: true,
    source: "gemini_ai_suggestion",
    timestamp,
  };
}

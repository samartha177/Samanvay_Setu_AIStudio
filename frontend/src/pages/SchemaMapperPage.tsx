import { useState } from "react";

import { PageHeader } from "../components/PageHeader";
import {
  DEFAULT_EDUCATION_PAYLOAD,
  DEFAULT_IDENTITY_PAYLOAD,
  DEFAULT_INCOME_PAYLOAD,
  DEFAULT_EDUCATION_PAYLOAD_DIYA,
  DEFAULT_IDENTITY_PAYLOAD_DIYA,
  DEFAULT_INCOME_PAYLOAD_DIYA,
  EDUCATION_MAPPING_RULES,
  getAiMapperStatus,
  IDENTITY_MAPPING_RULES,
  INCOME_MAPPING_RULES,
  MAPPING_REGISTRY_VERSION,
  normalizeEducationWithRegistry,
  normalizeIdentityWithRegistry,
  normalizeIncomeWithRegistry,
} from "../services/mappingRegistry";
import {
  requestAiSchemaSuggestions,
  type AiMappingResponse,
  type AiMappingSuggestion,
} from "../services/aiMapperClient";

export function SchemaMapperPage() {
  const [activePreset, setActivePreset] = useState<"aarav" | "diya" | "missing_field" | "unknown_field">("aarav");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("identity-aadhaar_name");

  // AI Mapping Playground State
  const [playgroundJson, setPlaygroundJson] = useState<string>(
    JSON.stringify(
      {
        beneficiary_full_name: "Aarav Sharma",
        yearly_household_earnings: 240000,
        college_program: "B.Tech Computer Engineering",
      },
      null,
      2
    )
  );
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AiMappingResponse | null>(null);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [activeReviewSuggestion, setActiveReviewSuggestion] = useState<AiMappingSuggestion | null>(null);
  const [queuedReviewFields, setQueuedReviewFields] = useState<Record<string, { queuedAt: string; status: string }>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive source payloads according to active preset / anomaly
  const getPayloads = () => {
    if (activePreset === "diya") {
      return {
        identity: { ...DEFAULT_IDENTITY_PAYLOAD_DIYA },
        education: { ...DEFAULT_EDUCATION_PAYLOAD_DIYA },
        income: { ...DEFAULT_INCOME_PAYLOAD_DIYA },
      };
    }
    if (activePreset === "missing_field") {
      const idPayload = { ...DEFAULT_IDENTITY_PAYLOAD };
      delete (idPayload as any).aadhaar_name; // Simulate missing mandatory field
      return {
        identity: idPayload,
        education: { ...DEFAULT_EDUCATION_PAYLOAD },
        income: { ...DEFAULT_INCOME_PAYLOAD },
      };
    }
    if (activePreset === "unknown_field") {
      return {
        identity: {
          ...DEFAULT_IDENTITY_PAYLOAD,
          biometric_device_hash: "SHA256:7f9b8c3d1e4a",
        },
        education: {
          ...DEFAULT_EDUCATION_PAYLOAD,
          legacy_quota_category: "GENERAL_MERIT",
        },
        income: {
          ...DEFAULT_INCOME_PAYLOAD,
          agricultural_subsidy_code: "AGRI-SUB-994",
        },
      };
    }
    // Default Aarav Sharma
    return {
      identity: { ...DEFAULT_IDENTITY_PAYLOAD },
      education: { ...DEFAULT_EDUCATION_PAYLOAD },
      income: { ...DEFAULT_INCOME_PAYLOAD },
    };
  };

  const currentPayloads = getPayloads();

  // Run normalization through versioned registry
  const identityResult = normalizeIdentityWithRegistry(currentPayloads.identity, {
    aiAssisted: showAiSuggestions,
  });
  const educationResult = normalizeEducationWithRegistry(currentPayloads.education, "CIT-1001", {
    aiAssisted: showAiSuggestions,
  });
  const incomeResult = normalizeIncomeWithRegistry(currentPayloads.income, "CIT-1001", {
    aiAssisted: showAiSuggestions,
  });

  const allIssues = [...identityResult.issues, ...educationResult.issues, ...incomeResult.issues];
  const allTraces = [...identityResult.traces, ...educationResult.traces, ...incomeResult.traces];

  const aiStatus = getAiMapperStatus();

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        eyebrow="Administration"
        title="Schema interoperability & mapping registry"
        description="Adapt disparate departmental data structures at the integration boundary without replacing existing source systems."
      />

      {/* Interoperability Architecture Banner */}
      <div className="rounded-2xl border border-teal/30 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
              Interoperability Architecture
            </span>
            <h2 className="mt-1 text-base font-bold text-ink">
              3 Department Schemas → SAMANVAYSETU Mapping Registry → Canonical Government Data Model
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              &ldquo;Departmental systems do not need to be replaced. SAMANVAYSETU adapts their existing data at the integration boundary.&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-teal/40 bg-teal/10 px-3 py-1.5 font-mono text-xs font-bold text-teal">
              {MAPPING_REGISTRY_VERSION}
            </span>
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Authoritative Registry
            </span>
          </div>
        </div>

        {/* AI-Assisted Mapping Status & Optional Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-900">{aiStatus.label}:</span>
            <span className="text-slate-600">{aiStatus.reason}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showAiSuggestions}
                onChange={(e) => setShowAiSuggestions(e.target.checked)}
                className="rounded border-slate-300 text-teal focus:ring-teal"
              />
              <span>Overlay AI Semantic Suggestions (Review Only)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification for Actions */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-teal/40 bg-navy text-white px-4 py-3 shadow-2xl animate-fade-in text-xs">
          <span className="h-2 w-2 rounded-full bg-teal animate-ping" />
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Compact Explanatory Panel: HOW SAMANVAYSETU USES AI */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
              ARCHITECTURAL GOVERNANCE & SEPARATION OF CONCERNS
            </span>
            <h3 className="text-sm font-bold text-ink">HOW SAMANVAYSETU USES AI</h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            Advisory vs. Authoritative Isolation
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-indigo-900">AI LAYER</span>
              <span className="rounded bg-indigo-200/80 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                REVIEW ONLY
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-indigo-950">Semantic suggestion</p>
            <p className="mt-1 text-[11px] text-indigo-800 leading-relaxed">
              Interprets unseen, non-standard departmental field names. Strictly advisory. Never decides eligibility or auto-mutates registry.
            </p>
          </div>

          <div className="rounded-xl border border-teal/30 bg-teal/5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-teal">MAPPING REGISTRY</span>
              <span className="rounded bg-teal/10 px-1.5 py-0.5 text-[10px] font-bold text-teal">
                AUTHORITATIVE
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-navy">Authoritative field mapping</p>
            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
              Version-controlled canonical transformation rules ({MAPPING_REGISTRY_VERSION}). Only approved rules normalize runtime data.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-emerald-800">POLICY ENGINE</span>
              <span className="rounded bg-emerald-200/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                DETERMINISTIC
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-emerald-950">Deterministic eligibility decision</p>
            <p className="mt-1 text-[11px] text-emerald-800 leading-relaxed">
              Pure boolean policy evaluation against canonical contracts. No hallucinations, full auditability, zero ambiguity.
            </p>
          </div>
        </div>
      </div>


      {/* Preset & Controlled Error Handling Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Test Scenario:</span>
          <button
            type="button"
            onClick={() => setActivePreset("aarav")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
              activePreset === "aarav"
                ? "border-teal bg-teal/10 text-teal"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Preset A: Aarav Sharma (Eligible)
          </button>
          <button
            type="button"
            onClick={() => setActivePreset("diya")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
              activePreset === "diya"
                ? "border-teal bg-teal/10 text-teal"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Preset B: Diya Verma (Ineligible)
          </button>
        </div>

        {/* Controlled Anomaly Demonstrations */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-700">Controlled Anomaly Demos:</span>
          <button
            type="button"
            onClick={() => setActivePreset("missing_field")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
              activePreset === "missing_field"
                ? "border-rose-500 bg-rose-50 text-rose-800"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            ! Missing Source Field (aadhaar_name)
          </button>
          <button
            type="button"
            onClick={() => setActivePreset("unknown_field")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${
              activePreset === "unknown_field"
                ? "border-amber-500 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            ? Unknown Source Fields
          </button>
        </div>
      </div>

      {/* Error / Warning Alert when Anomaly is detected */}
      {allIssues.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-xs shadow-panel">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-amber-800">⚠️</span>
            <h4 className="font-bold text-amber-900">
              Schema Mapping Validation Alert: The system will NOT silently discard or corrupt data.
            </h4>
          </div>
          <p className="mt-1 text-slate-700">
            SAMANVAYSETU enforces transparent validation at the integration boundary:
          </p>
          <div className="mt-3 space-y-2">
            {allIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-xl border p-2.5 ${
                  issue.severity === "error"
                    ? "border-rose-200 bg-rose-50/80 text-rose-900"
                    : "border-amber-200 bg-amber-50/80 text-amber-900"
                }`}
              >
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  [{issue.department}]
                </span>
                <span>
                  <strong>Field &ldquo;{issue.fieldName}&rdquo;:</strong> {issue.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3-COLUMN CORE ARCHITECTURE: SOURCE SCHEMA → MAPPING REGISTRY → CANONICAL MODEL */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
              CORE INTEROPERABILITY PIPELINE
            </span>
            <h3 className="text-lg font-bold text-ink mt-0.5">
              SOURCE SCHEMA → MAPPING REGISTRY → CANONICAL MODEL
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any mapping rule in Column B to trace the active transformation from raw departmental fields to the canonical model.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Selected Trace:</span>
            <span className="rounded-lg bg-teal/10 px-2.5 py-1 font-mono text-xs font-bold text-teal border border-teal/20">
              {selectedRuleId}
            </span>
          </div>
        </div>

        {/* The 3 Columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* COLUMN 1: SOURCE SCHEMA */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  1
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  SOURCE SCHEMA
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500">RAW ENVELOPES</span>
            </div>

            {/* Department 1: Identity */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Identity Department</h5>
                  <span className="text-[10px] text-slate-500">Format: snake_case (Demographic Schema)</span>
                </div>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[9px] text-slate-700">
                  JSON
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">RAW FIELDS:</span>
                <div className="space-y-1">
                  {Object.keys(currentPayloads.identity).map((field) => {
                    const isSelected = selectedRuleId === `identity-${field}`;
                    return (
                      <div
                        key={field}
                        className={`flex items-center justify-between rounded px-2 py-1 font-mono text-xs transition ${
                          isSelected
                            ? "bg-teal text-white font-bold shadow-xs ring-1 ring-teal"
                            : "bg-white text-slate-700 border border-slate-200/80"
                        }`}
                      >
                        <span>{field}</span>
                        <span className="text-[10px] opacity-80">
                          {String((currentPayloads.identity as any)[field])}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Department 2: Education */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Education Department</h5>
                  <span className="text-[10px] text-slate-500">Format: camelCase (University SIS)</span>
                </div>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[9px] text-slate-700">
                  JSON
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">RAW FIELDS:</span>
                <div className="space-y-1">
                  {Object.keys(currentPayloads.education).map((field) => {
                    const isSelected = selectedRuleId === `education-${field}`;
                    return (
                      <div
                        key={field}
                        className={`flex items-center justify-between rounded px-2 py-1 font-mono text-xs transition ${
                          isSelected
                            ? "bg-teal text-white font-bold shadow-xs ring-1 ring-teal"
                            : "bg-white text-slate-700 border border-slate-200/80"
                        }`}
                      >
                        <span>{field}</span>
                        <span className="text-[10px] opacity-80 truncate max-w-[140px]">
                          {String((currentPayloads.education as any)[field])}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Department 3: Income */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Income Department</h5>
                  <span className="text-[10px] text-slate-500">Format: finance_envelope (Revenue Dept)</span>
                </div>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[9px] text-slate-700">
                  JSON
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">RAW FIELDS:</span>
                <div className="space-y-1">
                  {Object.keys(currentPayloads.income).map((field) => {
                    const isSelected = selectedRuleId === `income-${field}`;
                    return (
                      <div
                        key={field}
                        className={`flex items-center justify-between rounded px-2 py-1 font-mono text-xs transition ${
                          isSelected
                            ? "bg-teal text-white font-bold shadow-xs ring-1 ring-teal"
                            : "bg-white text-slate-700 border border-slate-200/80"
                        }`}
                      >
                        <span>{field}</span>
                        <span className="text-[10px] opacity-80">
                          {String((currentPayloads.income as any)[field])}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: MAPPING REGISTRY */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
                  2
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal">
                  MAPPING REGISTRY ({MAPPING_REGISTRY_VERSION})
                </h4>
              </div>
              <span className="text-[10px] font-bold text-teal uppercase">AUTHORITATIVE</span>
            </div>

            {/* Identity Mappings */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy">Identity Transformation Rules</span>
                <span className="text-[10px] text-slate-400 font-mono">3 rules</span>
              </div>
              <div className="space-y-2">
                {IDENTITY_MAPPING_RULES.map((rule) => {
                  const ruleId = `identity-${rule.sourceField}`;
                  const isSelected = selectedRuleId === ruleId;
                  return (
                    <div
                      key={rule.sourceField}
                      onClick={() => setSelectedRuleId(ruleId)}
                      className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                        isSelected
                          ? "border-teal bg-white ring-2 ring-teal shadow-panel"
                          : "border-slate-200 bg-white hover:border-teal/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{rule.sourceField}</span>
                        <span className="text-teal font-bold">→</span>
                        <span className="font-semibold text-navy">
                          {rule.canonicalModel}.{rule.canonicalField}
                        </span>
                      </div>

                      {/* Deterministic Authority Label */}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">
                            AUTHORITATIVE MAPPING
                          </span>
                          <span className="font-mono text-slate-500">mapping-registry-v1</span>
                          <span className="font-bold text-emerald-600">✓ Deterministic</span>
                        </div>
                        {isSelected && (
                          <span className="font-mono font-bold text-teal animate-pulse">
                            ACTIVE CONNECTOR →
                          </span>
                        )}
                      </div>

                      {/* AI Semantic Suggestion (Visually Distinct & Review Only) */}
                      {showAiSuggestions && (
                        <div className="mt-2 rounded bg-indigo-50/80 p-2 text-[10px] text-indigo-900 border border-indigo-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">AI SEMANTIC SUGGESTION (DEMO EXAMPLE)</span>
                            <span className="rounded bg-indigo-200/80 px-1.5 py-0.5 font-bold text-indigo-800">
                              REVIEW ONLY
                            </span>
                          </div>
                          <p className="mt-0.5 text-indigo-700">
                            Static Demonstration Overlay · Live Gemini mapping available in AI Playground below
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Education Mappings */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy">Education Transformation Rules</span>
                <span className="text-[10px] text-slate-400 font-mono">4 rules</span>
              </div>
              <div className="space-y-2">
                {EDUCATION_MAPPING_RULES.map((rule) => {
                  const ruleId = `education-${rule.sourceField}`;
                  const isSelected = selectedRuleId === ruleId;
                  return (
                    <div
                      key={rule.sourceField}
                      onClick={() => setSelectedRuleId(ruleId)}
                      className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                        isSelected
                          ? "border-teal bg-white ring-2 ring-teal shadow-panel"
                          : "border-slate-200 bg-white hover:border-teal/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{rule.sourceField}</span>
                        <span className="text-teal font-bold">→</span>
                        <span className="font-semibold text-navy">
                          {rule.canonicalModel}.{rule.canonicalField}
                        </span>
                      </div>

                      {/* Deterministic Authority Label */}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">
                            AUTHORITATIVE MAPPING
                          </span>
                          <span className="font-mono text-slate-500">mapping-registry-v1</span>
                          <span className="font-bold text-emerald-600">✓ Deterministic</span>
                        </div>
                        {isSelected && (
                          <span className="font-mono font-bold text-teal animate-pulse">
                            ACTIVE CONNECTOR →
                          </span>
                        )}
                      </div>

                      {/* AI Semantic Suggestion (Visually Distinct & Review Only) */}
                      {showAiSuggestions && (
                        <div className="mt-2 rounded bg-indigo-50/80 p-2 text-[10px] text-indigo-900 border border-indigo-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">AI SEMANTIC SUGGESTION (DEMO EXAMPLE)</span>
                            <span className="rounded bg-indigo-200/80 px-1.5 py-0.5 font-bold text-indigo-800">
                              REVIEW ONLY
                            </span>
                          </div>
                          <p className="mt-0.5 text-indigo-700">
                            Static Demonstration Overlay · Live Gemini mapping available in AI Playground below
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Income Mappings */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy">Income Transformation Rules</span>
                <span className="text-[10px] text-slate-400 font-mono">3 rules</span>
              </div>
              <div className="space-y-2">
                {INCOME_MAPPING_RULES.map((rule) => {
                  const ruleId = `income-${rule.sourceField}`;
                  const isSelected = selectedRuleId === ruleId;
                  return (
                    <div
                      key={rule.sourceField}
                      onClick={() => setSelectedRuleId(ruleId)}
                      className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                        isSelected
                          ? "border-teal bg-white ring-2 ring-teal shadow-panel"
                          : "border-slate-200 bg-white hover:border-teal/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{rule.sourceField}</span>
                        <span className="text-teal font-bold">→</span>
                        <span className="font-semibold text-navy">
                          {rule.canonicalModel}.{rule.canonicalField}
                        </span>
                      </div>

                      {/* Deterministic Authority Label */}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">
                            AUTHORITATIVE MAPPING
                          </span>
                          <span className="font-mono text-slate-500">mapping-registry-v1</span>
                          <span className="font-bold text-emerald-600">✓ Deterministic</span>
                        </div>
                        {isSelected && (
                          <span className="font-mono font-bold text-teal animate-pulse">
                            ACTIVE CONNECTOR →
                          </span>
                        )}
                      </div>

                      {/* AI Semantic Suggestion (Visually Distinct & Review Only) */}
                      {showAiSuggestions && (
                        <div className="mt-2 rounded bg-indigo-50/80 p-2 text-[10px] text-indigo-900 border border-indigo-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">AI SEMANTIC SUGGESTION (DEMO EXAMPLE)</span>
                            <span className="rounded bg-indigo-200/80 px-1.5 py-0.5 font-bold text-indigo-800">
                              REVIEW ONLY
                            </span>
                          </div>
                          <p className="mt-0.5 text-indigo-700">
                            Static Demonstration Overlay · Live Gemini mapping available in AI Playground below
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 3: CANONICAL MODEL */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  3
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  CANONICAL MODEL
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">NORMALIZED CONTRACTS</span>
            </div>

            {/* Model 1: CitizenProfile */}
            <div
              className={`rounded-xl border p-4 space-y-2 transition ${
                selectedRuleId.startsWith("identity-")
                  ? "border-emerald-300 bg-emerald-50/50 shadow-sm"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-navy">CitizenProfile</h5>
                  <span className="text-[10px] text-slate-500">Target Schema: Canonical Government Profile</span>
                </div>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  READY
                </span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-[11px] text-slate-800 border border-slate-200">
                {JSON.stringify(identityResult.canonical, null, 2)}
              </pre>
            </div>

            {/* Model 2: EducationRecord */}
            <div
              className={`rounded-xl border p-4 space-y-2 transition ${
                selectedRuleId.startsWith("education-")
                  ? "border-emerald-300 bg-emerald-50/50 shadow-sm"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-navy">EducationRecord</h5>
                  <span className="text-[10px] text-slate-500">Target Schema: Canonical Academic Record</span>
                </div>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  READY
                </span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-[11px] text-slate-800 border border-slate-200">
                {JSON.stringify(educationResult.canonical, null, 2)}
              </pre>
            </div>

            {/* Model 3: IncomeRecord */}
            <div
              className={`rounded-xl border p-4 space-y-2 transition ${
                selectedRuleId.startsWith("income-")
                  ? "border-emerald-300 bg-emerald-50/50 shadow-sm"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-navy">IncomeRecord</h5>
                  <span className="text-[10px] text-slate-500">Target Schema: Canonical Income Record</span>
                </div>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  READY
                </span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-[11px] text-slate-800 border border-slate-200">
                {JSON.stringify(incomeResult.canonical, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* AI MAPPING PLAYGROUND */}
      <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-panel space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                AI ASSISTED • REVIEW ONLY
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Live Gemini Semantic Mapping
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-navy">AI MAPPING PLAYGROUND</h3>
            <p className="mt-0.5 text-xs text-slate-600">
              Test how SAMANVAYSETU interprets previously unseen departmental schema fields.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-500">Target Models:</span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">CitizenProfile</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">EducationRecord</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">IncomeRecord</span>
            </div>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500">Quick Test Presets:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPlaygroundJson(
                  JSON.stringify(
                    {
                      beneficiary_full_name: "Aarav Sharma",
                      yearly_household_earnings: 240000,
                      college_program: "B.Tech Computer Engineering",
                    },
                    null,
                    2
                  )
                );
                setAiAnalysisResult(null);
                setAiStatusMessage(null);
              }}
              className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 transition"
            >
              Preset 1: Judge Demo (Aarav)
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaygroundJson(
                  JSON.stringify(
                    {
                      taxpayer_gross_receipts_inr: 185000,
                      pan_card_holder: "Aarav Sharma",
                      revenue_cert_serial: "INC-MH-2024-88912",
                      assessment_cycle: "2024-25",
                    },
                    null,
                    2
                  )
                );
                setAiAnalysisResult(null);
                setAiStatusMessage(null);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Preset 2: Alternate Income Schema
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaygroundJson(
                  JSON.stringify(
                    {
                      degree_qualification: "B.Tech Computer Science",
                      enrolled_campus: "State Institute of Technology",
                      matriculation_code: "ROLL-48291",
                      attendance_standing: "ACTIVE",
                    },
                    null,
                    2
                  )
                );
                setAiAnalysisResult(null);
                setAiStatusMessage(null);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Preset 3: Alternate Education Schema
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaygroundJson(
                  JSON.stringify(
                    {
                      biometric_device_hash: "SHA256:7f9b8c3d1e4a",
                      legacy_quota_category: "GENERAL_MERIT",
                      agricultural_subsidy_code: "AGRI-SUB-994",
                    },
                    null,
                    2
                  )
                );
                setAiAnalysisResult(null);
                setAiStatusMessage(null);
              }}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
            >
              Preset 4: Unseen / Anomaly Fields
            </button>
          </div>
        </div>

        {/* JSON Editor & Action Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Departmental Schema Input (JSON):</span>
              <span className="text-[11px] font-mono text-slate-400">Arbitrary / Unseen Fields</span>
            </div>
            <textarea
              rows={9}
              value={playgroundJson}
              onChange={(e) => {
                setPlaygroundJson(e.target.value);
                setAiStatusMessage(null);
              }}
              placeholder={`{\n  "beneficiary_full_name": "Aarav Sharma",\n  "yearly_household_earnings": 240000,\n  "college_program": "B.Tech Computer Engineering"\n}`}
              className="w-full rounded-xl border border-slate-300 bg-slate-900 p-3 font-mono text-xs text-emerald-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={isAiAnalyzing}
                onClick={async () => {
                  setIsAiAnalyzing(true);
                  setAiStatusMessage("Analyzing schema...");
                  try {
                    let parsed: any = {};
                    try {
                      parsed = JSON.parse(playgroundJson);
                    } catch {
                      setAiStatusMessage("Malformed JSON input. Please check syntax.");
                      setIsAiAnalyzing(false);
                      return;
                    }
                    const res = await requestAiSchemaSuggestions(parsed);
                    setAiAnalysisResult(res);
                    if (res.success) {
                      setAiStatusMessage("AI suggestions ready");
                    } else {
                      setAiStatusMessage(res.error || "AI suggestions unavailable.");
                    }
                  } catch {
                    setAiStatusMessage("AI suggestions unavailable.");
                  } finally {
                    setIsAiAnalyzing(false);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
                  isAiAnalyzing
                    ? "bg-slate-400 text-white cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]"
                }`}
              >
                {isAiAnalyzing ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Analyzing schema...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Suggest Mappings with AI</span>
                  </>
                )}
              </button>

              {aiStatusMessage && (
                <span
                  className={`text-xs font-medium ${
                    aiStatusMessage.includes("ready")
                      ? "text-emerald-700"
                      : aiStatusMessage.includes("Analyzing")
                      ? "text-indigo-700 animate-pulse"
                      : "text-amber-800"
                  }`}
                >
                  {aiStatusMessage}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Canonical Standards Context */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
            <span className="font-bold text-navy">Target Canonical Interoperability Standard</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              SAMANVAYSETU restricts AI suggestion output strictly to known canonical models. The AI
              cannot hallucinate or invent new canonical attributes.
            </p>
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <span className="font-mono font-bold text-teal">CitizenProfile:</span>
                <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                  citizen_id · name · date_of_birth
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <span className="font-mono font-bold text-teal">EducationRecord:</span>
                <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                  citizen_id · student_id · student_name · date_of_birth · course · institution · enrollment_status
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <span className="font-mono font-bold text-teal">IncomeRecord:</span>
                <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                  citizen_id · applicant_name · annual_family_income · certificate_number · financial_year
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Output Display / Suggested Mappings Section */}
        {aiAnalysisResult && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Review-Only Output
                </span>
                <h4 className="text-sm font-bold text-ink">AI SUGGESTED MAPPINGS</h4>
              </div>
              {aiAnalysisResult.modelUsed && (
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 font-mono text-[10px] text-indigo-800">
                  Model: {aiAnalysisResult.modelUsed}
                </span>
              )}
            </div>

            {/* Error or Fallback Banner */}
            {!aiAnalysisResult.success && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <span>⚠️ AI suggestions unavailable.</span>
                </div>
                <p className="text-amber-800">
                  Deterministic mapping remains available through mapping-registry-v1.
                </p>
                {aiAnalysisResult.details && (
                  <p className="font-mono text-[11px] text-amber-700">{aiAnalysisResult.details}</p>
                )}
              </div>
            )}

            {/* Live Suggestions Grid / Table */}
            {aiAnalysisResult.success && aiAnalysisResult.suggestions.length > 0 && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="p-3 font-semibold">Source Field</th>
                        <th className="p-3 font-semibold">Suggested Canonical Mapping</th>
                        <th className="p-3 font-semibold">Confidence</th>
                        <th className="p-3 font-semibold">Semantic Reasoning</th>
                        <th className="p-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aiAnalysisResult.suggestions.map((suggestion, idx) => {
                        const isNoMatch =
                          suggestion.suggested_model === "NO_CONFIDENT_MATCH" ||
                          suggestion.suggested_field === "NO_CONFIDENT_MATCH";
                        const isQueued = queuedReviewFields[suggestion.source_field];

                        return (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition">
                            <td className="p-3 font-mono font-bold text-slate-900">
                              {suggestion.source_field}
                            </td>
                            <td className="p-3">
                              {isNoMatch ? (
                                <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-800">
                                  NO_CONFIDENT_MATCH
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-semibold text-teal">
                                    {suggestion.suggested_model}
                                  </span>
                                  <span className="text-slate-400">.</span>
                                  <span className="font-mono font-bold text-navy">
                                    {suggestion.suggested_field}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                                  suggestion.confidence >= 0.8
                                    ? "bg-emerald-100 text-emerald-800"
                                    : suggestion.confidence >= 0.5
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                              {suggestion.reason}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveReviewSuggestion(suggestion)}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition"
                                >
                                  [ Review ]
                                </button>
                                {isQueued ? (
                                  <span className="rounded-lg bg-teal/10 px-2.5 py-1 text-[10px] font-bold text-teal">
                                    ✓ Queued for Review
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQueuedReviewFields((prev) => ({
                                        ...prev,
                                        [suggestion.source_field]: {
                                          queuedAt: new Date().toLocaleTimeString(),
                                          status: "Queued for Officer Review (Registry remains unchanged)",
                                        },
                                      }));
                                      setToastMessage(
                                        `Suggestion queued for registry review: "${suggestion.source_field}" → ${suggestion.suggested_model}.${suggestion.suggested_field}`
                                      );
                                      setTimeout(() => setToastMessage(null), 4000);
                                    }}
                                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-100 transition"
                                  >
                                    [ Accept for Registry Review ]
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">Registry Invariant:</span>
                    <span>
                      Accepting an AI suggestion queues it for Government Officer review. It does NOT automatically modify or commit into mapping-registry-v1.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Zero Silent Mutations</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Review Modal / Drawer */}
        {activeReviewSuggestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Schema Inspection & Verification
                  </span>
                  <h4 className="text-base font-bold text-ink">Field Review Details</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReviewSuggestion(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Source Field:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {activeReviewSuggestion.source_field}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Suggested Canonical Model:</span>
                    <span className="font-mono font-bold text-teal">
                      {activeReviewSuggestion.suggested_model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Suggested Canonical Field:</span>
                    <span className="font-mono font-bold text-navy">
                      {activeReviewSuggestion.suggested_field}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Gemini Confidence Score:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {Math.round(activeReviewSuggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-700">Inference Rationale:</span>
                  <p className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-indigo-950 leading-relaxed">
                    {activeReviewSuggestion.reason}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-amber-900 space-y-1">
                  <span className="font-bold">Architectural Boundary Enforcement:</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    This suggestion was validated server-side against SAMANVAYSETU canonical models.
                    It cannot alter production runtime mappings until formally sanctioned by a designated Government Officer.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReviewSuggestion(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQueuedReviewFields((prev) => ({
                      ...prev,
                      [activeReviewSuggestion.source_field]: {
                        queuedAt: new Date().toLocaleTimeString(),
                        status: "Queued for Officer Review (Registry remains unchanged)",
                      },
                    }));
                    setToastMessage(
                      `Suggestion queued for registry review: "${activeReviewSuggestion.source_field}"`
                    );
                    setTimeout(() => setToastMessage(null), 4000);
                    setActiveReviewSuggestion(null);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
                >
                  Accept for Registry Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Field-Level Transformation Traces Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal">
              Field-Level Transformation View
            </span>
            <h3 className="text-base font-bold text-ink">SOURCE → MAPPING → CANONICAL FIELD → VALUE</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {allTraces.length} Active Traces
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Visualizing precise field transformation flow from departmental source fields to canonical representations:
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="p-3 font-semibold">Department</th>
                <th className="p-3 font-semibold">Source Field</th>
                <th className="p-3 font-semibold">Mapping Registry</th>
                <th className="p-3 font-semibold">Canonical Target</th>
                <th className="p-3 font-semibold">Normalized Output Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allTraces.map((trace, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-700">{trace.department}</td>
                  <td className="p-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-800">
                      {trace.sourceField}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-teal">↓ {trace.mappingVersion}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-navy">
                      {trace.canonicalModel}.{trace.canonicalField}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono font-medium text-emerald-800">
                      &ldquo;{String(trace.transformedValue)}&rdquo;
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

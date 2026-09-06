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

export function SchemaMapperPage() {
  const [activePreset, setActivePreset] = useState<"aarav" | "diya" | "missing_field" | "unknown_field">("aarav");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Schema interoperability & mapping registry"
        description="Adapt disparate departmental data structures at the integration boundary without replacing existing source systems."
      />

      {/* 9. Interoperability Summary Banner */}
      <div className="rounded-2xl border border-teal/30 bg-gradient-to-r from-teal/5 via-white to-teal/5 p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
              Interoperability Architecture
            </span>
            <h2 className="mt-1 text-base font-bold text-ink">
              3 Department Schemas → SAMANVAYSETU Mapping Registry → Canonical Government Data Model → Reusable Interoperability
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              <strong>"Departmental systems do not need to be replaced. SAMANVAYSETU adapts their existing data at the integration boundary."</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-teal/40 bg-teal/10 px-3 py-1.5 font-mono text-xs font-bold text-teal">
              {MAPPING_REGISTRY_VERSION}
            </span>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              Authoritative Registry
            </span>
          </div>
        </div>

        {/* 6. AI-Assisted Mapping Status & Optional Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 text-xs">
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

        {/* 8. Controlled Anomaly Demonstrations */}
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

      {/* 8. Error / Warning Alert when Anomaly is detected */}
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
                  <strong>Field "{issue.fieldName}":</strong> {issue.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Field-Level Transformation View */}
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
                      "{String(trace.transformedValue)}"
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main 3 Sections Grid: A. Source Schemas, B. Mapping Registry, C. Canonical Output */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* SECTION A: Department Source Schemas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              A. Department Source Schemas
            </h3>
            <span className="text-xs text-slate-400">Raw Envelopes</span>
          </div>
          <p className="text-xs text-slate-500">
            Heterogeneous source payloads returned by independent departmental services:
          </p>

          {/* Identity Source */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Identity Department</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                JSON (snake_case)
              </span>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
              {JSON.stringify(currentPayloads.identity, null, 2)}
            </pre>
            <div className="mt-2 text-[11px] text-slate-500">
              Key source fields: <code className="text-slate-800">aadhaar_name</code>,{" "}
              <code className="text-slate-800">dob</code>, <code className="text-slate-800">citizen_id</code>
            </div>
          </div>

          {/* Education Source */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Education Department</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                JSON (camelCase)
              </span>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-teal-300">
              {JSON.stringify(currentPayloads.education, null, 2)}
            </pre>
            <div className="mt-2 text-[11px] text-slate-500">
              Key source fields: <code className="text-slate-800">studentName</code>,{" "}
              <code className="text-slate-800">dateOfBirth</code>, <code className="text-slate-800">course</code>
            </div>
          </div>

          {/* Income Source */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Income Department</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                JSON (numeric/currency)
              </span>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-amber-300">
              {JSON.stringify(currentPayloads.income, null, 2)}
            </pre>
            <div className="mt-2 text-[11px] text-slate-500">
              Key source fields: <code className="text-slate-800">annual_family_income</code>,{" "}
              <code className="text-slate-800">financial_year</code>
            </div>
          </div>
        </div>

        {/* SECTION B: Versioned Mapping Registry */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal">
              B. Mapping Registry ({MAPPING_REGISTRY_VERSION})
            </h3>
            <span className="text-xs font-semibold text-teal">Authoritative</span>
          </div>
          <p className="text-xs text-slate-500">
            Deterministic transformation specifications applied at the boundary:
          </p>

          {/* Identity Mappings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <span className="text-xs font-semibold text-navy">Identity Department Mappings</span>
            <div className="mt-2.5 space-y-2">
              {IDENTITY_MAPPING_RULES.map((rule) => (
                <div key={rule.sourceField} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{rule.sourceField}</span>
                    <span className="text-teal">→</span>
                    <span className="font-semibold text-navy">
                      {rule.canonicalModel}.{rule.canonicalField}
                    </span>
                  </div>
                  {showAiSuggestions && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      <span>AI Semantic Match: 99.2% confidence</span>
                      <span className="font-semibold">Suggested</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education Mappings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <span className="text-xs font-semibold text-navy">Education Department Mappings</span>
            <div className="mt-2.5 space-y-2">
              {EDUCATION_MAPPING_RULES.map((rule) => (
                <div key={rule.sourceField} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{rule.sourceField}</span>
                    <span className="text-teal">→</span>
                    <span className="font-semibold text-navy">
                      {rule.canonicalModel}.{rule.canonicalField}
                    </span>
                  </div>
                  {showAiSuggestions && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      <span>AI Semantic Match: 98.6% confidence</span>
                      <span className="font-semibold">Suggested</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Income Mappings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <span className="text-xs font-semibold text-navy">Income Department Mappings</span>
            <div className="mt-2.5 space-y-2">
              {INCOME_MAPPING_RULES.map((rule) => (
                <div key={rule.sourceField} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{rule.sourceField}</span>
                    <span className="text-teal">→</span>
                    <span className="font-semibold text-navy">
                      {rule.canonicalModel}.{rule.canonicalField}
                    </span>
                  </div>
                  {showAiSuggestions && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      <span>AI Semantic Match: 99.8% confidence</span>
                      <span className="font-semibold">Suggested</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION C: Canonical Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
              C. Canonical Output
            </h3>
            <span className="text-xs text-slate-400">Normalized Models</span>
          </div>
          <p className="text-xs text-slate-500">
            Normalized government records consumed by policy & eligibility engines:
          </p>

          {/* CitizenProfile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-navy">CitizenProfile (Canonical)</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Ready
              </span>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-xl bg-slate-50 p-3 font-mono text-[11px] text-slate-800 border border-slate-200">
              {JSON.stringify(identityResult.canonical, null, 2)}
            </pre>
          </div>

          {/* EducationRecord */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-navy">EducationRecord (Canonical)</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Ready
              </span>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-xl bg-slate-50 p-3 font-mono text-[11px] text-slate-800 border border-slate-200">
              {JSON.stringify(educationResult.canonical, null, 2)}
            </pre>
          </div>

          {/* IncomeRecord */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-navy">IncomeRecord (Canonical)</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Ready
              </span>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-xl bg-slate-50 p-3 font-mono text-[11px] text-slate-800 border border-slate-200">
              {JSON.stringify(incomeResult.canonical, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

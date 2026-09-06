import { useState } from "react";
import { Link } from "react-router-dom";

import { usePlatform } from "../contexts/PlatformContext";
import { MAPPING_REGISTRY_VERSION } from "../services/mappingRegistry";

interface ServiceNodeInfo {
  id: string;
  name: string;
  category: "gateway" | "department" | "core" | "governance";
  purpose: string;
  schemaFormat: string;
  currentStatus: string;
  fieldsConsumed: string[];
  canonicalModelProduced: string;
  lastResponseSnippet: Record<string, unknown>;
  governanceRule: string;
}

const NODES_DATA: Record<string, ServiceNodeInfo> = {
  gateway: {
    id: "gateway",
    name: "SAMANVAYSETU GATEWAY",
    category: "gateway",
    purpose: "Consent verification, departmental request coordination, and secure orchestration boundary.",
    schemaFormat: "REST / JSON (Canonical API Contracts)",
    currentStatus: "Active Orchestrator",
    fieldsConsumed: ["citizen_id", "student_id", "consent_token"],
    canonicalModelProduced: "WorkflowOrchestrationReceipt",
    lastResponseSnippet: {
      gateway_status: "HEALTHY",
      orchestration_id: "ORCH-2026-9041",
      active_pipeline: "SCHOLARSHIP_INTEROP",
    },
    governanceRule: "Does not store persistent citizen PII beyond workflow lifetime.",
  },
  identity: {
    id: "identity",
    name: "IDENTITY DEPARTMENT",
    category: "department",
    purpose: "Statutory demographic identification and citizen age verification.",
    schemaFormat: "snake_case (Demographic Schema v2)",
    currentStatus: "Available",
    fieldsConsumed: ["aadhaar_name", "dob", "citizen_id"],
    canonicalModelProduced: "CitizenProfile (name, date_of_birth, citizen_id)",
    lastResponseSnippet: {
      aadhaar_name: "Aarav Sharma",
      dob: "2003-07-14",
      citizen_id: "CIT-1001",
    },
    governanceRule: "Accessed strictly under explicit citizen consent purpose limitation.",
  },
  education: {
    id: "education",
    name: "EDUCATION DEPARTMENT",
    category: "department",
    purpose: "Student enrollment authentication and recognized academic program verification.",
    schemaFormat: "camelCase (University SIS Schema)",
    currentStatus: "Available",
    fieldsConsumed: ["studentName", "dateOfBirth", "course", "enrollment_status", "institution", "student_id"],
    canonicalModelProduced: "EducationRecord (student_name, course, institution, enrollment_status)",
    lastResponseSnippet: {
      studentName: "Aarav Sharma",
      dateOfBirth: "2003-07-14",
      course: "B.Tech Computer Engineering",
      enrollment_status: "ACTIVE",
      institution: "Innovexa Institute",
      student_id: "STU-5001",
    },
    governanceRule: "Provides academic credentials without access to student income or identity documents.",
  },
  income: {
    id: "income",
    name: "INCOME DEPARTMENT",
    category: "department",
    purpose: "Revenue assessment and certified annual family income validation.",
    schemaFormat: "finance_envelope (Revenue Dept Schema)",
    currentStatus: "Available",
    fieldsConsumed: ["annual_family_income", "income_certificate_no", "financial_year"],
    canonicalModelProduced: "IncomeRecord (annual_family_income, certificate_number, financial_year)",
    lastResponseSnippet: {
      annual_family_income: 240000,
      income_certificate_no: "INC-5001",
      financial_year: "2025/26",
    },
    governanceRule: "Restricted strictly to income threshold validation for statutory benefits.",
  },
  schema_mapper: {
    id: "schema_mapper",
    name: "SCHEMA MAPPER",
    category: "core",
    purpose: "Deterministic translation of disparate departmental schemas into canonical government contracts.",
    schemaFormat: `Authoritative Registry: ${MAPPING_REGISTRY_VERSION}`,
    currentStatus: "Deterministic Active (AI Review Optional)",
    fieldsConsumed: ["All departmental source fields across Identity, Education & Income"],
    canonicalModelProduced: "Validated Field Transformations & Transformation Traces",
    lastResponseSnippet: {
      version: MAPPING_REGISTRY_VERSION,
      engine: "deterministic",
      rules_executed: 12,
      anomalies_detected: 0,
    },
    governanceRule: "No silent modification of canonical data. AI never writes to registry without human audit.",
  },
  canonical_model: {
    id: "canonical_model",
    name: "CANONICAL GOVERNMENT MODEL",
    category: "core",
    purpose: "Unified domain contracts shared across whole-of-government services.",
    schemaFormat: "Standardized TypeScript / JSON Schema",
    currentStatus: "Contract Enforced",
    fieldsConsumed: ["CitizenProfile", "EducationRecord", "IncomeRecord"],
    canonicalModelProduced: "CanonicalScholarshipApplication",
    lastResponseSnippet: {
      models: ["CitizenProfile", "EducationRecord", "IncomeRecord"],
      cross_record_validation: "VALIDATED",
      name_consistency: "MATCHED (Aarav Sharma)",
    },
    governanceRule: "Establishes a common semantic boundary without altering source databases.",
  },
  policy_engine: {
    id: "policy_engine",
    name: "POLICY ENGINE",
    category: "core",
    purpose: "Deterministic evaluation of published statutory criteria against canonical models.",
    schemaFormat: "Explainable Rule Engine",
    currentStatus: "Evaluation Ready",
    fieldsConsumed: ["annual_family_income <= 300000", "enrollment_status == ACTIVE", "course in STEM_LIST"],
    canonicalModelProduced: "EligibilityEvaluation (is_eligible, criteria[], summary)",
    lastResponseSnippet: {
      is_eligible: true,
      criteria_evaluated: 3,
      passed: 3,
      rationale: "All statutory criteria satisfied.",
    },
    governanceRule: "Deterministic and fully explainable — zero opaque black-box decisions.",
  },
  scholarship_dept: {
    id: "scholarship_dept",
    name: "SCHOLARSHIP DEPARTMENT",
    category: "department",
    purpose: "Final intake, application registration, and benefit disbursement.",
    schemaFormat: "Intake Registry Service",
    currentStatus: "Available",
    fieldsConsumed: ["application_reference", "canonical_application_payload"],
    canonicalModelProduced: "SimulatedScholarshipReceipt (application_id, status)",
    lastResponseSnippet: {
      application_id: "SCH-DEMO-AARAV1",
      status: "RECEIVED",
      disbursement_channel: "DIRECT_BENEFIT_TRANSFER",
    },
    governanceRule: "Accepts pre-verified canonical applications directly without manual document review.",
  },
  consent_pillar: {
    id: "consent_pillar",
    name: "CONSENT ENGINE",
    category: "governance",
    purpose: "Verifiable digital consent grant management with purpose limitation and citizen revocation.",
    schemaFormat: "Digital Consent Artefact",
    currentStatus: "Enforced",
    fieldsConsumed: ["citizen_id", "purpose", "departments_authorized", "timestamp"],
    canonicalModelProduced: "ConsentGrant (explicit_approval: true)",
    lastResponseSnippet: {
      consent_id: "CNS-SETU-1001",
      explicit_approval: true,
      purpose: "Scholarship verification",
    },
    governanceRule: "Zero departmental requests are executed without explicit consent verification.",
  },
  audit_pillar: {
    id: "audit_pillar",
    name: "AUDIT & MONITORING",
    category: "governance",
    purpose: "Immutable chronological trail of every request, response, mapping, and decision.",
    schemaFormat: "Append-Only Audit Stream",
    currentStatus: "Active",
    fieldsConsumed: ["event_type", "department", "timestamp", "payload_hash"],
    canonicalModelProduced: "AuditEvent[]",
    lastResponseSnippet: {
      events_recorded: 7,
      tamper_seal: "VERIFIED",
      chronological_order: "ASCENDING",
    },
    governanceRule: "Full observability for oversight officers and citizen transparency portals.",
  },
};

export function ServiceGraphPage() {
  const { isDemoMode } = usePlatform();
  const [selectedNodeId, setSelectedNodeId] = useState<string>("identity");

  const selectedNode = NODES_DATA[selectedNodeId] || NODES_DATA.identity;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
              OFFICER CONSOLE
            </span>
            <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono font-bold text-slate-700">
              SERVICE TOPOLOGY
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Service Dependency & Interoperability Graph
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Interactive topology illustrating that departmental systems remain autonomous while SAMANVAYSETU adapts data at the integration boundary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/officer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back to Operations
          </Link>
          <Link
            to="/admin/schema-mapper"
            className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-navy/90"
          >
            Open Schema Mapper →
          </Link>
        </div>
      </div>

      {/* Main Grid: Graph Layout + Detail Panel */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Graph Visual Canvas (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
                INTEROPERABILITY TOPOLOGY
              </span>
              <h2 className="text-base font-bold text-ink">
                Federated Government Architecture
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Click any node to inspect details
            </span>
          </div>

          {/* Clean CSS/SVG Service Graph Container */}
          <div className="relative mx-auto flex max-w-xl flex-col items-center space-y-4 py-2">
            {/* Top Governance Pillars */}
            <div className="grid w-full grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setSelectedNodeId("consent_pillar")}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedNodeId === "consent_pillar"
                    ? "border-teal bg-teal/10 shadow-sm"
                    : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-teal">GOVERNANCE</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">CONSENT ENGINE</div>
                <div className="text-[10px] text-slate-500">Explicit Citizen Grants</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNodeId("audit_pillar")}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedNodeId === "audit_pillar"
                    ? "border-teal bg-teal/10 shadow-sm"
                    : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-teal">OBSERVABILITY</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">AUDIT & MONITORING</div>
                <div className="text-[10px] text-slate-500">Chronological Event Trail</div>
              </button>
            </div>

            {/* LEVEL 1: SAMANVAYSETU GATEWAY */}
            <button
              type="button"
              onClick={() => setSelectedNodeId("gateway")}
              className={`w-full max-w-md rounded-2xl border p-4 text-center transition shadow-sm ${
                selectedNodeId === "gateway"
                  ? "border-navy bg-navy text-white"
                  : "border-slate-300 bg-white hover:border-navy"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  selectedNodeId === "gateway" ? "text-teal-200" : "text-teal"
                }`}
              >
                FEDERATED ORCHESTRATION LAYER
              </span>
              <span
                className={`text-sm font-bold block ${
                  selectedNodeId === "gateway" ? "text-white" : "text-ink"
                }`}
              >
                SAMANVAYSETU GATEWAY
              </span>
              <span
                className={`text-[11px] block mt-0.5 ${
                  selectedNodeId === "gateway" ? "text-slate-200" : "text-slate-500"
                }`}
              >
                Multi-Department Consent & Request Coordinator
              </span>
            </button>

            {/* SVG Connecting Lines: Gateway to 3 Departments */}
            <div className="w-full max-w-md flex justify-center">
              <svg className="w-full h-8" viewBox="0 0 400 32">
                <line x1="200" y1="0" x2="200" y2="12" stroke="#0e7490" strokeWidth="2" />
                <line x1="60" y1="12" x2="340" y2="12" stroke="#0e7490" strokeWidth="2" />
                <line x1="60" y1="12" x2="60" y2="32" stroke="#0e7490" strokeWidth="2" />
                <line x1="200" y1="12" x2="200" y2="32" stroke="#0e7490" strokeWidth="2" />
                <line x1="340" y1="12" x2="340" y2="32" stroke="#0e7490" strokeWidth="2" />
              </svg>
            </div>

            {/* LEVEL 2: 3 INDEPENDENT DEPARTMENTS */}
            <div className="grid w-full grid-cols-3 gap-2.5">
              {/* Identity Node */}
              <button
                type="button"
                onClick={() => setSelectedNodeId("identity")}
                className={`rounded-xl border p-3 text-center transition ${
                  selectedNodeId === "identity"
                    ? "border-teal bg-teal/10 shadow-sm"
                    : "border-slate-200 bg-slate-50/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-mono font-bold text-slate-600">INDEPENDENT</span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">IDENTITY</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">snake_case</div>
              </button>

              {/* Education Node */}
              <button
                type="button"
                onClick={() => setSelectedNodeId("education")}
                className={`rounded-xl border p-3 text-center transition ${
                  selectedNodeId === "education"
                    ? "border-teal bg-teal/10 shadow-sm"
                    : "border-slate-200 bg-slate-50/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-mono font-bold text-slate-600">INDEPENDENT</span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">EDUCATION</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">camelCase</div>
              </button>

              {/* Income Node */}
              <button
                type="button"
                onClick={() => setSelectedNodeId("income")}
                className={`rounded-xl border p-3 text-center transition ${
                  selectedNodeId === "income"
                    ? "border-teal bg-teal/10 shadow-sm"
                    : "border-slate-200 bg-slate-50/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-mono font-bold text-slate-600">INDEPENDENT</span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">INCOME</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">envelope</div>
              </button>
            </div>

            {/* SVG Lines: 3 Departments converging to Schema Mapper */}
            <div className="w-full max-w-md flex justify-center">
              <svg className="w-full h-8" viewBox="0 0 400 32">
                <line x1="60" y1="0" x2="60" y2="20" stroke="#0e7490" strokeWidth="2" />
                <line x1="200" y1="0" x2="200" y2="20" stroke="#0e7490" strokeWidth="2" />
                <line x1="340" y1="0" x2="340" y2="20" stroke="#0e7490" strokeWidth="2" />
                <line x1="60" y1="20" x2="340" y2="20" stroke="#0e7490" strokeWidth="2" />
                <line x1="200" y1="20" x2="200" y2="32" stroke="#0e7490" strokeWidth="2" />
              </svg>
            </div>

            {/* LEVEL 3: SCHEMA MAPPER */}
            <button
              type="button"
              onClick={() => setSelectedNodeId("schema_mapper")}
              className={`w-full max-w-sm rounded-xl border p-3 text-center transition ${
                selectedNodeId === "schema_mapper"
                  ? "border-teal bg-teal text-white shadow-sm"
                  : "border-teal/40 bg-teal/10 hover:bg-teal/15"
              }`}
            >
              <span
                className={`text-[10px] font-mono font-bold block ${
                  selectedNodeId === "schema_mapper" ? "text-teal-100" : "text-teal"
                }`}
              >
                INTEROPERABILITY BOUNDARY
              </span>
              <span
                className={`text-xs font-bold block ${
                  selectedNodeId === "schema_mapper" ? "text-white" : "text-slate-900"
                }`}
              >
                SCHEMA MAPPER ({MAPPING_REGISTRY_VERSION})
              </span>
              <span
                className={`text-[10px] block ${
                  selectedNodeId === "schema_mapper" ? "text-teal-100" : "text-slate-600"
                }`}
              >
                Deterministic Field Transformation & Tracing
              </span>
            </button>

            {/* Down Arrow Line */}
            <div className="flex justify-center">
              <span className="text-teal font-bold text-sm">↓</span>
            </div>

            {/* LEVEL 4: CANONICAL GOVERNMENT MODEL */}
            <button
              type="button"
              onClick={() => setSelectedNodeId("canonical_model")}
              className={`w-full max-w-sm rounded-xl border p-3 text-center transition ${
                selectedNodeId === "canonical_model"
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase block ${
                  selectedNodeId === "canonical_model" ? "text-indigo-200" : "text-indigo-800"
                }`}
              >
                STANDARDIZED SEMANTICS
              </span>
              <span
                className={`text-xs font-bold block ${
                  selectedNodeId === "canonical_model" ? "text-white" : "text-indigo-950"
                }`}
              >
                CANONICAL MODEL
              </span>
              <span
                className={`text-[10px] block ${
                  selectedNodeId === "canonical_model" ? "text-indigo-100" : "text-indigo-900"
                }`}
              >
                CitizenProfile · EducationRecord · IncomeRecord
              </span>
            </button>

            {/* Down Arrow Line */}
            <div className="flex justify-center">
              <span className="text-teal font-bold text-sm">↓</span>
            </div>

            {/* LEVEL 5: POLICY ENGINE */}
            <button
              type="button"
              onClick={() => setSelectedNodeId("policy_engine")}
              className={`w-full max-w-sm rounded-xl border p-3 text-center transition ${
                selectedNodeId === "policy_engine"
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase block ${
                  selectedNodeId === "policy_engine" ? "text-emerald-200" : "text-emerald-800"
                }`}
              >
                DETERMINISTIC EVALUATION
              </span>
              <span
                className={`text-xs font-bold block ${
                  selectedNodeId === "policy_engine" ? "text-white" : "text-emerald-950"
                }`}
              >
                POLICY ENGINE
              </span>
              <span
                className={`text-[10px] block ${
                  selectedNodeId === "policy_engine" ? "text-emerald-100" : "text-emerald-900"
                }`}
              >
                Published Rules & Explainable Criteria
              </span>
            </button>

            {/* Down Arrow Line */}
            <div className="flex justify-center">
              <span className="text-teal font-bold text-sm">↓</span>
            </div>

            {/* LEVEL 6: SCHOLARSHIP DEPARTMENT */}
            <button
              type="button"
              onClick={() => setSelectedNodeId("scholarship_dept")}
              className={`w-full max-w-sm rounded-xl border p-3 text-center transition ${
                selectedNodeId === "scholarship_dept"
                  ? "border-navy bg-navy text-white shadow-sm"
                  : "border-slate-300 bg-slate-100 hover:border-slate-400"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase block ${
                  selectedNodeId === "scholarship_dept" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                BENEFIT DISBURSEMENT REGISTRY
              </span>
              <span
                className={`text-xs font-bold block ${
                  selectedNodeId === "scholarship_dept" ? "text-white" : "text-ink"
                }`}
              >
                SCHOLARSHIP DEPARTMENT
              </span>
              <span
                className={`text-[10px] block ${
                  selectedNodeId === "scholarship_dept" ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Intake & Direct Application Registration
              </span>
            </button>
          </div>
        </div>

        {/* 8. Service Details Panel (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
              SERVICE DETAILS
            </span>
            <h2 className="text-lg font-bold text-ink">
              {selectedNode.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {selectedNode.currentStatus}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500">
                {isDemoMode ? "SIMULATED SERVICE" : "LIVE SERVICE"}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Purpose */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                PURPOSE
              </span>
              <p className="mt-1 text-slate-800 leading-relaxed font-medium">
                {selectedNode.purpose}
              </p>
            </div>

            {/* Source Schema & Canonical Output */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  SOURCE SCHEMA
                </span>
                <span className="mt-1 font-mono font-bold text-slate-800 block text-[11px]">
                  {selectedNode.schemaFormat}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  CANONICAL OUTPUT
                </span>
                <span className="mt-1 font-bold text-teal block text-[11px]">
                  {selectedNode.canonicalModelProduced}
                </span>
              </div>
            </div>

            {/* Fields Consumed */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                FIELDS CONSUMED & MAPPED
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.fieldsConsumed.map((f, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 border border-slate-200"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Last Response Snippet */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                LAST RESPONSE PAYLOAD
              </span>
              <pre className="rounded-lg bg-white p-2.5 font-mono text-[11px] text-slate-700 border border-slate-200 overflow-x-auto">
                {JSON.stringify(selectedNode.lastResponseSnippet, null, 2)}
              </pre>
            </div>

            {/* Governance Rule */}
            <div className="rounded-xl border border-teal/20 bg-teal/5 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal block">
                FEDERATED GOVERNANCE PRINCIPLE
              </span>
              <p className="mt-1 text-slate-700 text-[11px] leading-relaxed">
                {selectedNode.governanceRule}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";

import { usePlatform } from "../contexts/PlatformContext";
import { submitScholarshipWorkflow } from "../services/api";
import { createInitialWorkflowSteps } from "../services/demoAdapter";
import type {
  AuditEvent,
  CanonicalScholarshipApplication,
  ConsentGrant,
  ScholarshipEligibilityPolicy,
  WorkflowStep,
} from "../types/canonical";
import { DEFAULT_SCHOLARSHIP_POLICY } from "../types/canonical";

export function ScholarshipWorkflow() {
  const { isGatewayOnline } = usePlatform();

  // Form inputs
  const [citizenId, setCitizenId] = useState("CIT-1001");
  const [studentId, setStudentId] = useState("STU-5001");
  const [consentApproved, setConsentApproved] = useState(false);

  // Workflow state
  const [workflowState, setWorkflowState] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [steps, setSteps] = useState<WorkflowStep[]>(createInitialWorkflowSteps());
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [completedApplication, setCompletedApplication] = useState<CanonicalScholarshipApplication | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<WorkflowStep | null>(null);

  // Policy & failure simulation controls
  const [showResilienceControls, setShowResilienceControls] = useState(false);
  const [simFailIdentity, setSimFailIdentity] = useState(false);
  const [simFailEducation, setSimFailEducation] = useState(false);
  const [simFailIncome, setSimFailIncome] = useState(false);
  const [simFailScholarship, setSimFailScholarship] = useState(false);
  const [maxIncomeLimit, setMaxIncomeLimit] = useState(DEFAULT_SCHOLARSHIP_POLICY.maxAnnualIncome);

  const policy: ScholarshipEligibilityPolicy = {
    ...DEFAULT_SCHOLARSHIP_POLICY,
    maxAnnualIncome: maxIncomeLimit,
  };

  const setPreset = (cId: string, sId: string) => {
    setCitizenId(cId);
    setStudentId(sId);
  };

  const handleStartWorkflow = async () => {
    if (!consentApproved) {
      setErrorMessage("Explicit citizen consent is mandatory before querying any departmental registry.");
      return;
    }

    setErrorMessage(null);
    setFailedStep(null);
    setWorkflowState("running");
    setCompletedApplication(null);
    setAuditLog([]);

    const consentGrant: ConsentGrant = {
      consent_id: `CNS-${Date.now().toString().slice(-6)}`,
      citizen_id: citizenId.trim().toUpperCase(),
      purpose: "Verification of applicant identity, academic enrollment, and financial eligibility for Higher Education Scholarship",
      departments: ["IDENTITY", "EDUCATION", "INCOME"],
      data_categories: [
        "Demographic Record (Full Name, Date of Birth)",
        "Higher Education Status (Active Enrollment, Degree Program, Institution)",
        "Verified Annual Family Income (Direct Tax / Revenue Registry)",
      ],
      granted_at: new Date().toISOString(),
      explicit_approval: consentApproved,
    };

    try {
      const application = await submitScholarshipWorkflow(citizenId, studentId, consentGrant, {
        isGatewayOnline,
        stepDelayMs: 400, // realistic visual pacing for observation
        policy,
        simulatedFailures: {
          identity: simFailIdentity,
          education: simFailEducation,
          income: simFailIncome,
          scholarship: simFailScholarship,
        },
        onStepUpdate: (updatedSteps) => {
          setSteps(updatedSteps);
          const failed = updatedSteps.find((s) => s.status === "failed");
          if (failed) {
            setFailedStep(failed);
          }
        },
        onAuditEvent: (event) => {
          setAuditLog((prev) => [event, ...prev]);
        },
      });

      setCompletedApplication(application);
      setWorkflowState("completed");
    } catch (err: any) {
      setErrorMessage(err.message || "Workflow execution failed");
      setWorkflowState("failed");
    }
  };

  const handleReset = () => {
    setWorkflowState("idle");
    setSteps(createInitialWorkflowSteps());
    setCompletedApplication(null);
    setErrorMessage(null);
    setFailedStep(null);
    setAuditLog([]);
  };

  return (
    <div className="space-y-8">
      {/* Mode and Scenario Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal">Demonstration Scenario</span>
          <h2 className="text-lg font-bold text-ink">Scholarship Application & Multi-Department Verification</h2>
          <p className="mt-1 text-xs text-slate-500">
            Citizen requests scholarship → Consented query to Identity, Education & Income → Canonical normalization → Deterministic eligibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGatewayOnline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              REAL MODE (FastAPI Gateway)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              DEMO MODE (Local Simulation)
            </span>
          )}
        </div>
      </div>

      {workflowState === "idle" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 cols: Applicant Form & Consent */}
          <div className="space-y-6 lg:col-span-2">
            {/* Applicant identification */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
              <h3 className="text-base font-semibold text-ink">1. Applicant Identification</h3>
              <p className="mt-1 text-xs text-slate-500">
                Provide the applicant's Citizen ID and Student Identification number to initiate verification.
              </p>

              {/* Demo quick fill presets */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Demo test presets:</span>
                <button
                  type="button"
                  onClick={() => setPreset("CIT-1001", "STU-5001")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition border ${
                    citizenId === "CIT-1001"
                      ? "border-teal bg-teal/10 text-teal"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Preset A: Aarav Sharma (Eligible · Income ₹2,40,000)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset("CIT-1002", "STU-5002")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition border ${
                    citizenId === "CIT-1002"
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Preset B: Diya Verma (Ineligible · Income ₹3,15,000 &gt; Limit)
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="citizen-id-input" className="block text-xs font-semibold text-slate-700">
                    Citizen ID
                  </label>
                  <input
                    id="citizen-id-input"
                    type="text"
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-ink shadow-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                    placeholder="e.g. CIT-1001"
                    required
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">Target registry: Department of Unique Identification</span>
                </div>

                <div>
                  <label htmlFor="student-id-input" className="block text-xs font-semibold text-slate-700">
                    Student ID
                  </label>
                  <input
                    id="student-id-input"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-ink shadow-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                    placeholder="e.g. STU-5001"
                    required
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">Target registry: Department of Higher Education</span>
                </div>
              </div>
            </div>

            {/* Purpose-Specific Consent Section */}
            <div className="rounded-2xl border border-teal/30 bg-teal/5 p-6 shadow-panel">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
                  2
                </span>
                <h3 className="text-base font-semibold text-navy">Purpose-Specific Citizen Consent (DPDP Compliant)</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">
                In compliance with interoperability governance standards, SAMANVAYSETU requires explicit applicant authorization before dispatching federated queries. No data is fetched prior to consent.
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                  <span className="font-semibold text-slate-900">What data will be accessed:</span>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-600">
                    <li><strong className="text-slate-800">Identity:</strong> Official Full Name, Date of Birth, Verification Token.</li>
                    <li><strong className="text-slate-800">Education:</strong> Active Student Enrollment, Degree Program, Institution Name.</li>
                    <li><strong className="text-slate-800">Income:</strong> Gross Annual Family Income from latest Tax Assessment Year.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                  <span className="font-semibold text-slate-900">Participating Departments:</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Identity Department</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Education Department</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Income Department</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Scholarship Department</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                  <span className="font-semibold text-slate-900">Purpose of Processing:</span>
                  <p className="mt-1 text-slate-600">
                    Direct validation of scholarship eligibility criteria under the National Higher Education Support Scheme. The data will not be reused for secondary profiling.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-teal/40 bg-white p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="consent-checkbox"
                    type="checkbox"
                    checked={consentApproved}
                    onChange={(e) => setConsentApproved(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal focus:ring-teal"
                  />
                  <div className="text-xs text-slate-800">
                    <span className="font-semibold text-slate-900">
                      I give explicit, informed consent for SAMANVAYSETU to query my records
                    </span>{" "}
                    from the Identity, Education, and Income departments to evaluate and submit this scholarship application.
                  </div>
                </label>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                  {errorMessage}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end">
                <button
                  id="submit-scholarship-btn"
                  type="button"
                  onClick={handleStartWorkflow}
                  disabled={!consentApproved || !citizenId.trim() || !studentId.trim()}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition ${
                    consentApproved && citizenId.trim() && studentId.trim()
                      ? "bg-teal text-white hover:bg-teal/90 active:scale-[0.98]"
                      : "cursor-not-allowed bg-slate-200 text-slate-400"
                  }`}
                >
                  Consent & Submit Application →
                </button>
              </div>
            </div>
          </div>

          {/* Right col: Deterministic Rules & Resilience Controls */}
          <div className="space-y-6">
            {/* Deterministic Eligibility Rules (Visible & Explainable) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal">Configurable Policy</span>
              <h3 className="mt-1 text-base font-semibold text-ink">Deterministic Eligibility Rules</h3>
              <p className="mt-1 text-xs text-slate-500">
                Rules are transparently published rather than operating as a black box.
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Income Ceiling:</span>
                    <span className="font-bold text-navy">₹{maxIncomeLimit.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="range"
                      min="200000"
                      max="400000"
                      step="10000"
                      value={maxIncomeLimit}
                      onChange={(e) => setMaxIncomeLimit(Number(e.target.value))}
                      className="w-full accent-teal"
                    />
                  </div>
                  <span className="mt-1 block text-[10px] text-slate-400">Slide to test policy boundary conditions</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="font-medium text-slate-700">Approved Degrees:</span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {policy.eligibleCourseKeywords.slice(0, 5).map((kw) => (
                      <span key={kw} className="rounded bg-white px-1.5 py-0.5 text-[11px] text-slate-600 border border-slate-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="font-medium text-slate-700">Enrollment Requirement:</span>
                  <p className="mt-1 text-[11px] text-slate-600">Must be verified as ACTIVE student by Department of Higher Education.</p>
                </div>
              </div>
            </div>

            {/* Failure & Recovery Simulation Controls */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
              <button
                type="button"
                onClick={() => setShowResilienceControls(!showResilienceControls)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Demo Resilience Testing</span>
                  <h3 className="text-sm font-semibold text-ink">Simulate Department Downtime</h3>
                </div>
                <span className="text-xs text-slate-400">{showResilienceControls ? "Hide" : "Show"}</span>
              </button>

              {showResilienceControls && (
                <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs">
                  <p className="text-slate-500">Toggle mock failures to observe error handling and step retry:</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simFailIdentity}
                      onChange={(e) => setSimFailIdentity(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Fail Identity Service (503)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simFailEducation}
                      onChange={(e) => setSimFailEducation(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Fail Education Service (503)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simFailIncome}
                      onChange={(e) => setSimFailIncome(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Fail Income Service (504 Timeout)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simFailScholarship}
                      onChange={(e) => setSimFailScholarship(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Fail Scholarship Registry (500)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Workflow Orchestration & Progress */}
      {(workflowState === "running" || workflowState === "failed" || workflowState === "completed") && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Step-by-Step Progress Indicator (9 Steps) */}
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal">Workflow Orchestration</span>
                    <h3 className="text-lg font-bold text-ink">Multi-Department Verification Pipeline</h3>
                  </div>
                  {workflowState === "running" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-teal animate-ping" />
                      Executing Pipeline…
                    </span>
                  )}
                  {workflowState === "completed" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Execution Finished
                    </span>
                  )}
                  {workflowState === "failed" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Pipeline Halted
                    </span>
                  )}
                </div>

                {/* 9 Steps List */}
                <div className="mt-6 space-y-3">
                  {steps.map((step) => {
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start justify-between rounded-xl border p-3.5 transition ${
                          step.status === "running"
                            ? "border-teal/40 bg-teal/5"
                            : step.status === "success"
                            ? "border-emerald-200 bg-emerald-50/40"
                            : step.status === "failed"
                            ? "border-rose-300 bg-rose-50"
                            : "border-slate-100 bg-slate-50/60 opacity-70"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              step.status === "running"
                                ? "bg-teal text-white animate-spin"
                                : step.status === "success"
                                ? "bg-emerald-600 text-white"
                                : step.status === "failed"
                                ? "bg-rose-600 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step.status === "running" ? (
                              "⟳"
                            ) : step.status === "success" ? (
                              "✓"
                            ) : step.status === "failed" ? (
                              "!"
                            ) : (
                              step.stepNumber
                            )}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{step.label}</span>
                              {step.department && (
                                <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                                  {step.department}
                                </span>
                              )}
                            </div>
                            {step.details && (
                              <p className="mt-0.5 text-xs text-slate-600">{step.details}</p>
                            )}
                            {step.error && (
                              <p className="mt-1 text-xs font-medium text-rose-700">{step.error}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                              step.status === "running"
                                ? "bg-teal/10 text-teal"
                                : step.status === "success"
                                ? "bg-emerald-100 text-emerald-800"
                                : step.status === "failed"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Failure Recovery Box */}
                {failedStep && (
                  <div className="mt-6 rounded-xl border border-rose-300 bg-rose-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                          Failure at Step {failedStep.stepNumber}: {failedStep.label}
                        </h4>
                        <p className="mt-1 text-xs text-rose-700">{failedStep.error}</p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          SAMANVAYSETU caught the exception without crashing. You can adjust parameters, disable mock downtime, and retry.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSimFailIdentity(false);
                          setSimFailEducation(false);
                          setSimFailIncome(false);
                          setSimFailScholarship(false);
                          handleStartWorkflow();
                        }}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 active:scale-[0.98]"
                      >
                        Clear Errors & Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Final Application Details when complete */}
              {completedApplication && (
                <div className="space-y-6">
                  {/* Schema Normalization Stage Demonstration (Section 7) */}
                  <div className="rounded-2xl border border-teal/40 bg-white p-6 shadow-panel">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
                          Schema Interoperability Stage
                        </span>
                        <h3 className="text-base font-bold text-ink">
                          Heterogeneous Responses → Normalization → Canonical Models → Policy Engine
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-teal/30 bg-teal/5 px-2.5 py-1 font-mono text-[11px] font-bold text-teal">
                          mapping-registry-v1
                        </span>
                        <Link
                          to="/admin/schema-mapper"
                          className="text-xs font-semibold text-teal hover:underline"
                        >
                          Open Schema Mapper →
                        </Link>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                      "Departmental systems do not need to be replaced. SAMANVAYSETU adapts their existing data at the integration boundary."
                    </p>

                    {/* Step-by-step visual progression */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 text-xs">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="font-bold text-slate-900 block">1. Identity Response</span>
                        <p className="mt-1 font-mono text-[10px] text-slate-600">
                          aadhaar_name<br/>
                          dob<br/>
                          citizen_id
                        </p>
                        <span className="mt-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          RECEIVED
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="font-bold text-slate-900 block">2. Education Response</span>
                        <p className="mt-1 font-mono text-[10px] text-slate-600">
                          studentName<br/>
                          course<br/>
                          enrollment_status
                        </p>
                        <span className="mt-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          RECEIVED
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="font-bold text-slate-900 block">3. Income Response</span>
                        <p className="mt-1 font-mono text-[10px] text-slate-600">
                          annual_family_income<br/>
                          income_cert_no<br/>
                          financial_year
                        </p>
                        <span className="mt-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          RECEIVED
                        </span>
                      </div>

                      <div className="rounded-xl border border-teal/40 bg-teal/10 p-3">
                        <span className="font-bold text-teal block">4. Schema Normalization</span>
                        <p className="mt-1 text-[10px] text-slate-700">
                          Authoritative mapping-registry-v1 applies field translation rules.
                        </p>
                        <span className="mt-2 inline-block rounded bg-teal/20 px-1.5 py-0.5 text-[9px] font-bold text-teal">
                          NORMALIZED
                        </span>
                      </div>

                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                        <span className="font-bold text-indigo-900 block">5. Canonical Models</span>
                        <p className="mt-1 text-[10px] text-slate-700">
                          CitizenProfile<br/>
                          EducationRecord<br/>
                          IncomeRecord
                        </p>
                        <span className="mt-2 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-800">
                          STRUCTURED
                        </span>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                        <span className="font-bold text-emerald-900 block">6. Eligibility Engine</span>
                        <p className="mt-1 text-[10px] text-slate-700">
                          Deterministic rules evaluated against canonical models.
                        </p>
                        <span className="mt-2 inline-block rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          EVALUATED
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Outcome Banner */}
                  <div
                    className={`rounded-2xl border p-6 shadow-panel ${
                      completedApplication.eligibility_status === "ELIGIBLE"
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-amber-300 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Final Status</span>
                        <div className="mt-1 flex items-center gap-3">
                          <h3 className="text-xl font-bold text-slate-900">
                            {completedApplication.eligibility_status === "ELIGIBLE"
                              ? "Application Verified & Submitted"
                              : "Application Processed: Ineligible"}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              completedApplication.eligibility_status === "ELIGIBLE"
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {completedApplication.workflow_status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-700">
                          Reference: <strong className="font-mono">{completedApplication.application_reference}</strong> ·
                          Application ID: <strong className="font-mono">{completedApplication.application_id}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/citizen/applications/${completedApplication.application_id}`}
                          className="rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy/90"
                        >
                          View in My Applications →
                        </Link>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          New Application
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Deterministic Eligibility Breakdown (Explainable) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
                    <h3 className="text-base font-semibold text-ink">Explainable Deterministic Eligibility Assessment</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Detailed policy rule evaluation matching the applicant's normalized records:
                    </p>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                            <th className="p-3 font-semibold">Criterion</th>
                            <th className="p-3 font-semibold">Requirement</th>
                            <th className="p-3 font-semibold">Normalized Applicant Record</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Explanation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {completedApplication.eligibility_details.criteria.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                              <td className="p-3 text-slate-600">{c.requirement}</td>
                              <td className="p-3 font-mono text-slate-700">{c.actual}</td>
                              <td className="p-3">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    c.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {c.passed ? "PASS" : "FAIL"}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600">{c.explanation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Canonical Records Verified */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal">CitizenProfile (Canonical)</span>
                      <h4 className="mt-1 text-sm font-semibold text-slate-900">{completedApplication.applicant_name}</h4>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div>Citizen ID: <strong className="font-mono">{completedApplication.citizen_id}</strong></div>
                        <div>DOB: <strong className="font-mono">{completedApplication.date_of_birth}</strong></div>
                        <div className="text-emerald-700 font-medium">✓ Identity verified</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal">EducationRecord (Canonical)</span>
                      <h4 className="mt-1 text-sm font-semibold text-slate-900">{completedApplication.course_name}</h4>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div>Institution: {completedApplication.institution_name}</div>
                        <div>Student ID: <strong className="font-mono">{completedApplication.student_id}</strong></div>
                        <div className="text-emerald-700 font-medium">✓ Academic enrollment active</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal">IncomeRecord (Canonical)</span>
                      <h4 className="mt-1 text-sm font-semibold text-slate-900">
                        ₹{completedApplication.annual_income.toLocaleString("en-IN")}
                      </h4>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div>Financial Year: {completedApplication.financial_year}</div>
                        <div>Registry: Income Tax / Revenue</div>
                        <div className="text-emerald-700 font-medium">✓ Verified income report</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right col: Real-Time Audit Log & Contacted Departments */}
            <div className="space-y-6">
              {/* Participating Departments Contacted */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
                <span className="text-xs font-bold uppercase tracking-wider text-teal">Federated Architecture</span>
                <h3 className="text-base font-semibold text-ink">Departments Contacted</h3>
                <div className="mt-4 space-y-2 text-xs">
                  {[
                    { code: "IDENTITY", name: "Identity Department", purpose: "Demographics & identity match" },
                    { code: "EDUCATION", name: "Education Department", purpose: "Active enrollment & course verification" },
                    { code: "INCOME", name: "Income Department", purpose: "Financial assessment validation" },
                    { code: "SCHOLARSHIP", name: "Scholarship Department", purpose: "Final application submission" },
                  ].map((dept) => {
                    const isContacted = completedApplication?.departments_contacted.includes(dept.code);
                    return (
                      <div
                        key={dept.code}
                        className={`rounded-xl border p-3 ${
                          isContacted
                            ? "border-emerald-200 bg-emerald-50/50 text-slate-900"
                            : "border-slate-100 bg-slate-50 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{dept.name}</span>
                          <span className="text-[10px] font-bold uppercase font-mono">{dept.code}</span>
                        </div>
                        <p className="mt-1 text-[11px]">{dept.purpose}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit Event Trail */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal">Compliance & Governance</span>
                    <h3 className="text-base font-semibold text-ink">Audit Event Trail</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {auditLog.length} events
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Immutable record of pipeline actions for oversight:</p>

                <div className="mt-4 max-h-[380px] space-y-2.5 overflow-y-auto pr-1 text-xs">
                  {auditLog.length === 0 && (
                    <div className="py-6 text-center text-slate-400">Events will stream as steps execute…</div>
                  )}
                  {auditLog.map((event) => (
                    <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 font-mono text-[11px]">
                          {event.event_type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.department && (
                        <span className="mt-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">
                          Dept: {event.department}
                        </span>
                      )}
                      <pre className="mt-1.5 overflow-x-auto rounded bg-white p-1.5 text-[10px] text-slate-600">
                        {JSON.stringify(event.details, null, 1)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

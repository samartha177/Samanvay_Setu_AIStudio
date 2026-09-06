import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

const stepperSteps = [
  {
    step: 1,
    title: "Apply",
    description: "Citizen enters minimal identifiers without uploading redundant paperwork.",
  },
  {
    step: 2,
    title: "Give Consent",
    description: "Explicit, purpose-bound electronic consent is granted under DPDP guidelines.",
  },
  {
    step: 3,
    title: "Verify Department Records",
    description: "SAMANVAYSETU coordinates directly with Identity, Education & Income registries.",
  },
  {
    step: 4,
    title: "Normalize Data",
    description: "Authoritative mapping-registry-v1 transforms disparate raw shapes into canonical models.",
  },
  {
    step: 5,
    title: "Evaluate Eligibility",
    description: "Deterministic policy rules verify merit, academic status, and income thresholds.",
  },
  {
    step: 6,
    title: "Submit",
    description: "Application is formally lodged with the Scholarship Department with full audit trail.",
  },
] as const;

export function CitizenDashboardPage() {
  const { user } = useAuth();
  const citizenId = user?.id || "CIT-1001";
  const citizenName = user?.name || "Aarav Sharma";

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
                CITIZEN SERVICES
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                Citizen ID: {citizenId}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({citizenName})
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Citizen Portal
            </h1>

            <p className="text-base font-semibold text-teal italic">
              &ldquo;One application. Multiple departments. One trusted workflow.&rdquo;
            </p>

            <p className="max-w-xl text-xs leading-relaxed text-slate-600">
              Access connected public services where government departments collaborate seamlessly with your explicit consent—eliminating physical certificates and repetitive verifications.
            </p>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/citizen/services"
              id="citizen-apply-cta"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-teal/90"
            >
              Apply for Scholarship →
            </Link>

            <Link
              to="/citizen/applications"
              id="citizen-view-apps-cta"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              View My Applications →
            </Link>
          </div>
        </div>
      </div>

      {/* 2. HOW SAMANVAYSETU WORKS (Visual Stepper) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel md:p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
            TRANSPARENT INTEROPERABILITY PIPELINE
          </span>
          <h2 className="text-lg font-bold text-ink mt-1">
            HOW SAMANVAYSETU WORKS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every step is automated, auditable, and bound to citizen consent without centralizing raw databases.
          </p>
        </div>

        {/* Stepper Grid with visual connectors */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {stepperSteps.map((item, idx) => (
            <div
              key={item.step}
              className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-teal/40 hover:bg-white"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal text-white font-mono text-xs font-bold shadow-xs">
                    {item.step}
                  </span>
                  {idx < stepperSteps.length - 1 && (
                    <span className="hidden lg:block text-slate-300 text-xs font-bold font-mono">
                      →
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-xs font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-teal font-semibold">
                <span>Stage 0{item.step}</span>
                <span>✓ Automated</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Action Cards Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Available Services & Citizen Records
          </h2>
          <p className="text-xs text-slate-500">
            Select a service card to initiate an application, audit records, or review consent history.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* Action 1: Apply for Scholarship */}
          <Link
            to="/citizen/services"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal text-xl">
                  🎓
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-2.5 py-0.5 rounded-full">
                  Available Service
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-ink group-hover:text-teal transition">
                Apply for Scholarship
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Apply for Higher Education Scholarships with automated, consented verification across Identity, Education, and Income departments.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal">
              <span>Start Application</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </div>
          </Link>

          {/* Action 2: My Applications */}
          <Link
            to="/citizen/applications"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy text-xl">
                  📄
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Your Records
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-ink group-hover:text-teal transition">
                My Applications
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Track submitted applications, verification decisions, and purpose-scoped audit history across participating departments.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-teal">
              <span>Track Status</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </div>
          </Link>

          {/* Action 3: Consent History */}
          <Link
            to="/citizen/consent-history"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-xl">
                  🛡️
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  DPDP Principles
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-ink group-hover:text-teal transition">
                Consent History
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Inspect active digital consent grants, purpose limitations, and authorized data fields across external systems.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-teal">
              <span>Inspect Grants</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

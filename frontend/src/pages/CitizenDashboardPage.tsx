import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";

export function CitizenDashboardPage() {
  const { user } = useAuth();
  const citizenId = user?.id || "CIT-1001";
  const citizenName = user?.name || "Aarav Sharma";

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-panel md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
              Citizen Portal
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Welcome back
            </h1>
            <div className="flex items-center gap-2 pt-1">
              <span className="rounded-lg bg-teal/10 px-2.5 py-1 font-mono text-xs font-bold text-teal">
                Citizen ID: {citizenId}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {citizenName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/citizen/services"
              className="rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal/90"
            >
              Apply for Scholarship →
            </Link>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-4">
          SAMANVAYSETU coordinates consented data exchange across independent departmental systems (Identity, Education, and Income) to deliver public services without centralized data duplication.
        </p>
      </div>

      {/* Primary Actions Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Citizen Actions & Services
          </h2>
          <p className="text-xs text-slate-500">
            Select an action to initiate or inspect your public service delivery requests.
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-2 py-0.5 rounded-full">
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
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

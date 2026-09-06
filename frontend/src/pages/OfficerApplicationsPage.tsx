import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { usePlatform } from "../contexts/PlatformContext";
import { fetchApplicationsList } from "../services/api";
import type { CanonicalScholarshipApplication } from "../types/canonical";

export function OfficerApplicationsPage() {
  const { isGatewayOnline, isDemoMode } = usePlatform();
  const [applications, setApplications] = useState<CanonicalScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ELIGIBLE" | "INELIGIBLE">("ALL");

  useEffect(() => {
    let mounted = true;
    fetchApplicationsList(isGatewayOnline).then((apps) => {
      if (mounted) {
        setApplications(apps);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [isGatewayOnline]);

  const filteredApps = applications.filter((app) => {
    if (filter === "ELIGIBLE") return app.eligibility_status === "ELIGIBLE";
    if (filter === "INELIGIBLE") return app.eligibility_status === "INELIGIBLE";
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
              OFFICER CONSOLE
            </span>
            <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono font-bold text-slate-700">
              CASE MANAGEMENT
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Scholarship Applications Repository
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Audit consented citizen applications, verification statuses, and automated policy evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/officer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Operations Console
          </Link>
          <Link
            to="/officer/monitoring"
            className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-navy/90"
          >
            Audit Monitoring →
          </Link>
        </div>
      </div>

      {/* Filter and Overview Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2">Filter Status:</span>
          {(["ALL", "ELIGIBLE", "INELIGIBLE"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === f
                  ? "bg-teal text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
              }`}
            >
              {f === "ALL" ? `All (${applications.length})` : f}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Mode:{" "}
          <strong className="text-slate-800">
            {isDemoMode ? "Local Simulation (Demo Mode)" : "Live Gateway"}
          </strong>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No applications match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-3">Reference / ID</th>
                  <th className="py-3 px-3">Applicant & Student ID</th>
                  <th className="py-3 px-3">Academic Program</th>
                  <th className="py-3 px-3">Annual Income</th>
                  <th className="py-3 px-3">Eligibility</th>
                  <th className="py-3 px-3">Workflow State</th>
                  <th className="py-3 px-3 text-right">Audit & Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.application_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-mono font-medium text-navy">
                      <div className="font-bold">{app.application_reference}</div>
                      <div className="text-[10px] text-slate-400">{app.application_id}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block">{app.applicant_name}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {app.citizen_id} · {app.student_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800">{app.course_name}</div>
                      <div className="text-[11px] text-slate-500">{app.institution_name}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block">
                        ₹{app.annual_income.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {app.financial_year}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          app.eligibility_status === "ELIGIBLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {app.eligibility_status === "ELIGIBLE" ? "✓ ELIGIBLE" : "✕ INELIGIBLE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          app.workflow_status === "SUBMITTED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : app.workflow_status === "REJECTED"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {app.workflow_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/citizen/applications/${app.application_id}`}
                        className="rounded-lg border border-teal/40 bg-teal/5 px-2.5 py-1 text-xs font-bold text-teal hover:bg-teal/10"
                      >
                        Inspect Record →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

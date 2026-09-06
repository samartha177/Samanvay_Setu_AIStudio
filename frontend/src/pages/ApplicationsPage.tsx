import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { usePlatform } from "../contexts/PlatformContext";
import { fetchApplicationsList } from "../services/api";
import type { CanonicalScholarshipApplication } from "../types/canonical";

export function ApplicationsPage() {
  const { isGatewayOnline } = usePlatform();
  const [applications, setApplications] = useState<CanonicalScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationsList(isGatewayOnline)
      .then((data) => setApplications(data))
      .finally(() => setLoading(false));
  }, [isGatewayOnline]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="Citizen portal"
          title="My applications"
          description="Track transparent, consented service delivery and historical scholarship applications across departments."
        />
        <Link
          to="/citizen/services"
          className="rounded-xl bg-teal px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal/90"
        >
          + New Scholarship Application
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-panel">
            Loading submitted applications…
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-panel">
            <span className="text-3xl">📄</span>
            <h3 className="mt-3 text-lg font-semibold text-ink">No submitted applications yet</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
              You haven't submitted any scholarship applications yet. Initiate a new application to experience the multi-department interoperability pipeline.
            </p>
            <div className="mt-6">
              <Link
                to="/citizen/services"
                className="inline-flex rounded-xl bg-teal px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal/90"
              >
                Start Scholarship Application →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.application_id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel transition hover:border-teal/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy">{app.application_id}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        app.eligibility_status === "ELIGIBLE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {app.workflow_status}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 uppercase">
                      {app.mode} mode
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">{app.applicant_name}</h4>
                  <p className="text-xs text-slate-600">
                    {app.course_name} · {app.institution_name}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Income: ₹{app.annual_income.toLocaleString("en-IN")} ({app.financial_year}) · Submitted:{" "}
                    {new Date(app.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/citizen/applications/${app.application_id}`}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Application →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

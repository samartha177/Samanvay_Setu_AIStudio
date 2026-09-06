import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { usePlatform } from "../contexts/PlatformContext";
import { fetchApplicationById } from "../services/api";
import type { CanonicalScholarshipApplication } from "../types/canonical";

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isGatewayOnline } = usePlatform();
  const [application, setApplication] = useState<CanonicalScholarshipApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchApplicationById(id, isGatewayOnline)
        .then((app) => setApplication(app))
        .finally(() => setLoading(false));
    }
  }, [id, isGatewayOnline]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-panel">
        Loading application details…
      </div>
    );
  }

  if (!application) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-panel">
        <h3 className="text-base font-semibold text-rose-700">Application not found</h3>
        <p className="mt-2 text-xs text-slate-500">Could not locate an application with ID: {id}</p>
        <div className="mt-6">
          <Link
            to="/citizen/applications"
            className="rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy/90"
          >
            ← Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="Application Record"
          title={`Application ${application.application_id}`}
          description={`Verified interoperability record for ${application.applicant_name}`}
        />
        <Link
          to="/citizen/applications"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to All Applications
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        {/* Top Summary Banner */}
        <div
          className={`rounded-2xl border p-6 shadow-panel ${
            application.eligibility_status === "ELIGIBLE"
              ? "border-emerald-300 bg-emerald-50/40"
              : "border-amber-300 bg-amber-50/40"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Status</span>
              <div className="mt-1 flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900">
                  {application.eligibility_status === "ELIGIBLE"
                    ? "Verified & Submitted to Scholarship Department"
                    : "Processed: Ineligible per Criteria"}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    application.eligibility_status === "ELIGIBLE"
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 text-white"
                  }`}
                >
                  {application.workflow_status}
                </span>
                <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 uppercase">
                  {application.mode} mode
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Gateway Reference: <strong className="font-mono">{application.application_reference}</strong> ·
                Submitted on: {new Date(application.created_at).toLocaleString()}
              </p>
            </div>

            {application.submission_receipt && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <span className="font-semibold text-slate-900">Submission Receipt:</span>
                <div className="mt-1 font-mono text-[11px] text-slate-600">
                  ID: {application.submission_receipt.application_id}
                </div>
                <div className="text-[10px] text-slate-400">
                  Source: {application.submission_receipt.source}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canonical Department Records Verified */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
              Identity Department (Verified)
            </span>
            <h4 className="mt-2 text-base font-semibold text-slate-900">{application.applicant_name}</h4>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Citizen ID:</dt>
                <dd className="font-mono font-medium text-slate-800">{application.citizen_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Date of Birth:</dt>
                <dd className="font-mono font-medium text-slate-800">{application.date_of_birth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status:</dt>
                <dd className="font-medium text-emerald-700">✓ Verified Profile</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
              Education Department (Verified)
            </span>
            <h4 className="mt-2 text-base font-semibold text-slate-900">{application.course_name}</h4>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Institution:</dt>
                <dd className="font-medium text-slate-800">{application.institution_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Student ID:</dt>
                <dd className="font-mono font-medium text-slate-800">{application.student_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status:</dt>
                <dd className="font-medium text-emerald-700">✓ Active Enrollment</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
              Income Department (Verified)
            </span>
            <h4 className="mt-2 text-base font-semibold text-slate-900">
              ₹{application.annual_income.toLocaleString("en-IN")}
            </h4>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Financial Year:</dt>
                <dd className="font-medium text-slate-800">{application.financial_year}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Source Registry:</dt>
                <dd className="font-medium text-slate-800">Income Tax / Revenue</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status:</dt>
                <dd className="font-medium text-emerald-700">✓ Verified Returns</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Explainable Eligibility Policy Evaluation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
          <h3 className="text-base font-semibold text-ink">Deterministic Eligibility Evaluation</h3>
          <p className="mt-1 text-xs text-slate-500">
            Rules evaluated during multi-department normalization:
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-3 font-semibold">Rule</th>
                  <th className="p-3 font-semibold">Requirement</th>
                  <th className="p-3 font-semibold">Verified Applicant Data</th>
                  <th className="p-3 font-semibold">Result</th>
                  <th className="p-3 font-semibold">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {application.eligibility_details.criteria.map((c) => (
                  <tr key={c.id}>
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

        {/* Audit Log Trail */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Audit & Event History</h3>
            <span className="text-xs text-slate-500">{application.audit_events.length} recorded events</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {application.audit_events.map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900">{event.event_type}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                {event.department && (
                  <span className="mt-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">
                    Department: {event.department}
                  </span>
                )}
                <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[10px] text-slate-600">
                  {JSON.stringify(event.details, null, 1)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

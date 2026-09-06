import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { usePlatform } from "../contexts/PlatformContext";
import { fetchApplicationsList } from "../services/api";
import type { AuditEvent, CanonicalScholarshipApplication } from "../types/canonical";

type FilterType = "all" | "requests" | "responses" | "normalization" | "eligibility" | "errors";

interface AugmentedAuditEvent extends AuditEvent {
  applicationId: string;
  applicationReference: string;
  applicantName: string;
}

export function MonitoringPage() {
  const { isGatewayOnline, isDemoMode } = usePlatform();
  const [applications, setApplications] = useState<CanonicalScholarshipApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Flatten and aggregate all audit events with application context
  const allEvents = useMemo(() => {
    const list: AugmentedAuditEvent[] = [];
    applications.forEach((app) => {
      (app.audit_events || []).forEach((ev) => {
        list.push({
          ...ev,
          applicationId: app.application_id,
          applicationReference: app.application_reference,
          applicantName: app.applicant_name,
        });
      });
    });
    // Sort chronologically (most recent first)
    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [applications]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (selectedAppId !== "all" && ev.applicationId !== selectedAppId) {
        return false;
      }
      if (activeFilter === "requests") {
        return ev.event_type === "department_requested";
      }
      if (activeFilter === "responses") {
        return (
          ev.event_type === "department_response_received" ||
          ev.event_type === "application_submitted" ||
          ev.event_type === "consent_granted"
        );
      }
      if (activeFilter === "normalization") {
        return ev.event_type === "normalization_completed";
      }
      if (activeFilter === "eligibility") {
        return ev.event_type === "eligibility_evaluated";
      }
      if (activeFilter === "errors") {
        return (
          ev.event_type === "step_failed" ||
          Boolean(ev.details?.error) ||
          ev.details?.is_eligible === false
        );
      }
      return true;
    });
  }, [allEvents, selectedAppId, activeFilter]);

  const getEventTitle = (ev: AugmentedAuditEvent): string => {
    switch (ev.event_type) {
      case "consent_granted":
        return "Consent granted";
      case "department_requested":
        return `${ev.department || "Department"} request dispatched`;
      case "department_response_received":
        return `${ev.department || "Department"} request completed`;
      case "normalization_completed":
        return "Schema normalization completed";
      case "eligibility_evaluated":
        return "Eligibility evaluated";
      case "application_submitted":
        return "Scholarship application submitted";
      case "step_failed":
        return `Step failed: ${ev.department || "System"}`;
      case "step_retried":
        return `Step retried: ${ev.department || "System"}`;
      default:
        return ev.event_type;
    }
  };

  const getEventBadge = (ev: AugmentedAuditEvent) => {
    if (ev.event_type === "step_failed" || ev.details?.error) {
      return <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold">ERROR</span>;
    }
    if (ev.event_type === "normalization_completed") {
      return <span className="rounded bg-teal/15 text-teal px-2 py-0.5 text-[10px] font-bold">NORMALIZED</span>;
    }
    if (ev.event_type === "eligibility_evaluated") {
      const isEligible = ev.details?.is_eligible;
      return (
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
            isEligible ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {isEligible ? "ELIGIBLE" : "INELIGIBLE"}
        </span>
      );
    }
    return <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">SUCCESS</span>;
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toTimeString().split(" ")[0]; // "HH:MM:SS"
    } catch {
      return ts;
    }
  };

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
              AUDIT LOGS
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Workflow Audit & Transaction Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time chronological timeline of consented citizen transactions, department requests, and interoperability transformations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/officer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back to Operations
          </Link>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchApplicationsList(isGatewayOnline).then((apps) => {
                setApplications(apps);
                setLoading(false);
              });
            }}
            className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-navy/90"
          >
            Refresh Stream
          </button>
        </div>
      </div>

      {/* Filter and Scope Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Scope Dropdown */}
          <div className="flex items-center gap-3">
            <label htmlFor="app-scope" className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Application Scope:
            </label>
            <select
              id="app-scope"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            >
              <option value="all">All Applications ({allEvents.length} events)</option>
              {applications.map((app) => (
                <option key={app.application_id} value={app.application_id}>
                  {app.applicant_name} ({app.application_reference})
                </option>
              ))}
            </select>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing <strong>{filteredEvents.length}</strong> events</span>
            {isDemoMode && (
              <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                LOCAL AUDIT STORE
              </span>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="text-xs font-bold text-slate-500 mr-2">Filter:</span>
          {(
            [
              ["all", "All"],
              ["requests", "Requests"],
              ["responses", "Responses"],
              ["normalization", "Normalization"],
              ["eligibility", "Eligibility"],
              ["errors", "Errors"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeFilter === key
                  ? "bg-teal text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Audit Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="border-b border-slate-100 pb-3 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal">
            CHRONOLOGICAL AUDIT TIMELINE
          </span>
          <h2 className="text-base font-bold text-ink">
            Consented Interoperability Audit Events
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading audit records...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No audit events matched the selected filter.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
            {filteredEvents.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              const isError = ev.event_type === "step_failed" || ev.details?.error;
              const timeString = formatTime(ev.timestamp);

              return (
                <div key={ev.id} className="relative pl-6">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      isError
                        ? "border-rose-500 text-rose-500"
                        : ev.event_type === "normalization_completed"
                        ? "border-teal text-teal"
                        : "border-emerald-500 text-emerald-500"
                    }`}
                  >
                    <span className="text-[9px] font-bold leading-none">
                      {isError ? "✕" : "✓"}
                    </span>
                  </div>

                  {/* Card row */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-slate-50 hover:border-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {timeString}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {getEventTitle(ev)}
                        </h3>
                        {ev.department && (
                          <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-mono font-bold text-navy">
                            {ev.department}
                          </span>
                        )}
                        {getEventBadge(ev)}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-500">
                          {ev.applicantName} ({ev.applicationReference})
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className="text-xs font-bold text-teal hover:underline"
                        >
                          {isExpanded ? "Hide Details ▲" : "Details ▼"}
                        </button>
                      </div>
                    </div>

                    {/* Summary text */}
                    {ev.details && (
                      <p className="mt-2 text-xs text-slate-600">
                        {ev.event_type === "consent_granted" &&
                          `Explicit citizen consent recorded for ${ev.details.purpose || "scholarship evaluation"}.`}
                        {ev.event_type === "department_response_received" &&
                          `Received 200 OK response from ${ev.department} Department service.`}
                        {ev.event_type === "normalization_completed" &&
                          "Transformed source schema into canonical models via mapping-registry-v1."}
                        {ev.event_type === "eligibility_evaluated" &&
                          (ev.details.is_eligible
                            ? "All statutory criteria satisfied under published scholarship rules."
                            : `Ineligible: ${ev.details.summary || "Did not satisfy policy requirements"}`)}
                        {ev.event_type === "application_submitted" &&
                          `Registered with Scholarship Department with ID ${ev.details.application_id}.`}
                        {ev.event_type === "step_failed" &&
                          `Service exception: ${ev.details.error || "Execution halted"}`}
                      </p>
                    )}

                    {/* Collapsible raw details */}
                    {isExpanded && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-800 overflow-x-auto">
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                          AUDIT EVENT PAYLOAD
                        </div>
                        <pre className="text-[11px] text-slate-700">
                          {JSON.stringify(
                            {
                              id: ev.id,
                              timestamp: ev.timestamp,
                              event_type: ev.event_type,
                              department: ev.department,
                              application_id: ev.applicationId,
                              details: ev.details,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

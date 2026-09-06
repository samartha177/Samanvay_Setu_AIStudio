import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { usePlatform } from "../contexts/PlatformContext";
import { fetchApplicationsList } from "../services/api";
import type { AuditEvent, CanonicalScholarshipApplication } from "../types/canonical";

type EventCategory = "ALL" | "REQUEST" | "RESPONSE" | "NORMALIZATION" | "POLICY" | "SUBMISSION" | "ERRORS";

interface AugmentedAuditEvent extends AuditEvent {
  applicationId: string;
  applicationReference: string;
  applicantName: string;
  category: "REQUEST" | "RESPONSE" | "NORMALIZATION" | "POLICY" | "SUBMISSION";
}

export function MonitoringPage() {
  const { isGatewayOnline, isDemoMode } = usePlatform();
  const [applications, setApplications] = useState<CanonicalScholarshipApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<EventCategory>("ALL");
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

  const mapCategory = (eventType: string): "REQUEST" | "RESPONSE" | "NORMALIZATION" | "POLICY" | "SUBMISSION" => {
    switch (eventType) {
      case "department_requested":
        return "REQUEST";
      case "department_response_received":
      case "consent_granted":
        return "RESPONSE";
      case "normalization_completed":
        return "NORMALIZATION";
      case "eligibility_evaluated":
        return "POLICY";
      case "application_submitted":
        return "SUBMISSION";
      default:
        return "REQUEST";
    }
  };

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
          category: mapCategory(ev.event_type),
        });
      });
    });
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
      if (activeCategory === "ERRORS") {
        return ev.event_type === "step_failed" || Boolean(ev.details?.error) || ev.details?.is_eligible === false;
      }
      if (activeCategory !== "ALL") {
        return ev.category === activeCategory;
      }
      return true;
    });
  }, [allEvents, selectedAppId, activeCategory]);

  const selectedApp = applications.find((a) => a.application_id === selectedAppId);

  const getEventTitle = (ev: AugmentedAuditEvent): string => {
    switch (ev.event_type) {
      case "consent_granted":
        return "Consent granted by citizen";
      case "department_requested":
        return `${ev.department || "Department"} request dispatched`;
      case "department_response_received":
        return `${ev.department || "Department"} payload received`;
      case "normalization_completed":
        return "Schema normalization applied (mapping-registry-v1)";
      case "eligibility_evaluated":
        return "Deterministic eligibility evaluated";
      case "application_submitted":
        return "Scholarship application lodged with registry";
      case "step_failed":
        return `Step failed: ${ev.department || "System"}`;
      case "step_retried":
        return `Step retried: ${ev.department || "System"}`;
      default:
        return ev.event_type;
    }
  };

  const getCategoryBadge = (category: AugmentedAuditEvent["category"], isError?: boolean) => {
    if (isError) {
      return (
        <span className="rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider">
          ERROR
        </span>
      );
    }
    switch (category) {
      case "REQUEST":
        return (
          <span className="rounded-md bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider">
            REQUEST
          </span>
        );
      case "RESPONSE":
        return (
          <span className="rounded-md bg-purple-100 text-purple-900 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider">
            RESPONSE
          </span>
        );
      case "NORMALIZATION":
        return (
          <span className="rounded-md bg-teal/15 text-teal px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider">
            NORMALIZATION
          </span>
        );
      case "POLICY":
        return (
          <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider">
            POLICY
          </span>
        );
      case "SUBMISSION":
        return (
          <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider">
            SUBMISSION
          </span>
        );
    }
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
              AUDIT TIMELINE
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
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Filter and Scope Controls */}
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

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing <strong>{filteredEvents.length}</strong> events</span>
            {isDemoMode && (
              <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                DEMO AUDIT LOGS
              </span>
            )}
          </div>
        </div>

        {/* Categories Filter (Requested: REQUEST, RESPONSE, NORMALIZATION, POLICY, SUBMISSION) */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="text-xs font-bold text-slate-500 mr-2">Category:</span>
          {(
            [
              ["ALL", "All Events"],
              ["REQUEST", "REQUEST"],
              ["RESPONSE", "RESPONSE"],
              ["NORMALIZATION", "NORMALIZATION"],
              ["POLICY", "POLICY"],
              ["SUBMISSION", "SUBMISSION"],
              ["ERRORS", "ERRORS"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeCategory === key
                  ? "bg-teal text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Application Banner if filtered */}
      {selectedApp && (
        <div className="rounded-2xl border border-teal/40 bg-teal/5 p-4 shadow-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal block">
              FILTERED APPLICATION
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <strong className="text-sm text-slate-900">{selectedApp.applicant_name}</strong>
              <span className="font-mono text-slate-600">({selectedApp.application_reference})</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedApp.eligibility_status === "ELIGIBLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {selectedApp.eligibility_status}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Citizen ID: <span className="font-mono">{selectedApp.citizen_id}</span> · Student ID: <span className="font-mono">{selectedApp.student_id}</span> · Course: {selectedApp.course_name}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              to={`/citizen/applications/${selectedApp.application_id}`}
              className="rounded-lg bg-teal px-3 py-1.5 font-bold text-white shadow-sm hover:bg-teal/90"
            >
              View Record →
            </Link>
            <button
              type="button"
              onClick={() => setSelectedAppId("all")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

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
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-4">
            {filteredEvents.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              const isError = ev.event_type === "step_failed" || Boolean(ev.details?.error);
              const timeString = formatTime(ev.timestamp);

              return (
                <div key={ev.id} className="relative pl-6">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[9px] top-3 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      isError
                        ? "border-rose-500 text-rose-500"
                        : ev.category === "NORMALIZATION"
                        ? "border-teal text-teal"
                        : ev.category === "SUBMISSION"
                        ? "border-emerald-600 text-emerald-600"
                        : "border-slate-400 text-slate-500"
                    }`}
                  >
                    <span className="text-[9px] font-bold leading-none">
                      {isError ? "✕" : "✓"}
                    </span>
                  </div>

                  {/* Compact Timeline Card */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition hover:bg-white hover:border-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getCategoryBadge(ev.category, isError)}
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {timeString}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900">
                          {getEventTitle(ev)}
                        </h3>
                        {ev.department && (
                          <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                            {ev.department}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          {ev.applicantName} ({ev.applicationReference})
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                        </button>
                      </div>
                    </div>

                    {/* Expandable JSON details */}
                    {isExpanded && (
                      <div className="mt-3 border-t border-slate-200 pt-2.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-mono">Event ID: {ev.id}</span>
                          <span>Timestamp: {new Date(ev.timestamp).toISOString()}</span>
                        </div>
                        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
                          {JSON.stringify(ev.details, null, 2)}
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

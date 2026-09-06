import { useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";

export function ConsentHistoryPage() {
  const { user } = useAuth();
  const [consentRevoked, setConsentRevoked] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <PageHeader
            eyebrow="Citizen portal"
            title="Consent History"
            description="Verifiable digital consent grants governing purpose-limited data exchange across government departments."
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded bg-teal/10 px-2.5 py-0.5 text-xs font-mono font-bold text-teal">
              Citizen ID: {user?.id || "CIT-1001"}
            </span>
            <span className="text-xs text-slate-500">
              ({user?.name || "Aarav Sharma"})
            </span>
          </div>
        </div>

        <Link
          to="/citizen/services"
          className="rounded-xl bg-teal px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal/90"
        >
          + Apply for Scholarship
        </Link>
      </div>

      {/* DPDP Information Notice */}
      <div className="rounded-2xl border border-teal/30 bg-teal/5 p-5 shadow-panel">
        <div className="flex items-start gap-3">
          <span className="text-xl">🛡️</span>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal">
              CITIZEN CONSENT & DATA SOVEREIGNTY
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Under SAMANVAYSETU, government departments cannot exchange citizen records without explicit, purpose-limited electronic consent. Data is normalized at the integration boundary and never stored in a central surveillance registry.
            </p>
          </div>
        </div>
      </div>

      {/* Active Consent Grant Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              CONSENT ARTEFACT ID
            </span>
            <div className="text-sm font-mono font-bold text-navy">CNS-SETU-1001</div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              consentRevoked
                ? "bg-rose-100 text-rose-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                consentRevoked ? "bg-rose-600" : "bg-emerald-600 animate-pulse"
              }`}
            />
            {consentRevoked ? "REVOKED BY CITIZEN" : "ACTIVE & PURPOSE-BOUND"}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              AUTHORIZED PURPOSE
            </span>
            <p className="mt-1 text-xs font-medium text-slate-800 leading-relaxed">
              &ldquo;Automated verification of demographic identity, enrollment credentials, and annual family income for Higher Education Scholarship award determination.&rdquo;
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                IDENTITY DEPARTMENT
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-1">
                Demographic Verification
              </span>
              <span className="text-[11px] font-mono text-slate-500 block mt-1">
                aadhaar_name, dob, citizen_id
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                EDUCATION DEPARTMENT
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-1">
                Academic Registry
              </span>
              <span className="text-[11px] font-mono text-slate-500 block mt-1">
                studentName, course, enrollment_status
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                INCOME DEPARTMENT
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-1">
                Revenue & Tax Assessment
              </span>
              <span className="text-[11px] font-mono text-slate-500 block mt-1">
                annual_family_income, certificate_no
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <div>
              <span>Granted on: </span>
              <strong className="text-slate-700">Permanent Demo Baseline</strong> ·{" "}
              <span>Expiry: </span>
              <strong className="text-slate-700">Workflow Lifetime Only</strong>
            </div>

            {!consentRevoked ? (
              <button
                type="button"
                onClick={() => setShowRevokeConfirm(true)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                Revoke Consent ✕
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConsentRevoked(false)}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              >
                Re-grant Consent ✓
              </button>
            )}
          </div>

          {/* Revoke Confirmation Modal / Banner */}
          {showRevokeConfirm && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Confirm Consent Revocation
              </div>
              <p className="text-[11px] leading-relaxed">
                Revoking consent immediately halts any pending automated data exchanges with the Education and Income departments for your scholarship application.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConsentRevoked(true);
                    setShowRevokeConfirm(false);
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Yes, Revoke Grant
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevokeConfirm(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

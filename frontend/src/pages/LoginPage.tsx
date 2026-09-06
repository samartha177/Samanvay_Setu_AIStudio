import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BackendStatus } from "../components/BackendStatus";
import { DEMO_ACCOUNTS, useAuth, type UserRole } from "../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, logout } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("CITIZEN");
  const [identifier, setIdentifier] = useState<string>("CIT-1001");
  const [password, setPassword] = useState<string>("demo123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If role changes, we can prepopulate with the demo credentials of that role
  const handleSelectRole = (roleToSelect: UserRole) => {
    setSelectedRole(roleToSelect);
    setErrorMessage(null);
    setIdentifier(DEMO_ACCOUNTS[roleToSelect].id);
    setPassword(DEMO_ACCOUNTS[roleToSelect].password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = login(selectedRole, identifier, password);
    if (!result.success) {
      setErrorMessage(result.error || "Authentication failed.");
      return;
    }

    // Redirect based on authenticated role
    if (selectedRole === "CITIZEN") {
      navigate("/citizen");
    } else {
      navigate("/officer");
    }
  };

  const handleQuickFill = (roleToFill: UserRole) => {
    setSelectedRole(roleToFill);
    setIdentifier(DEMO_ACCOUNTS[roleToFill].id);
    setPassword(DEMO_ACCOUNTS[roleToFill].password);
    setErrorMessage(null);
  };

  return (
    <main className="min-h-screen bg-slate-100/70 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header & Emblem */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3.5 py-1 text-[11px] font-bold tracking-wider text-teal uppercase">
            <span>GOVERNMENT OF INDIA · DIGITAL ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            SAMANVAYSETU
          </h1>
          <p className="text-base font-semibold text-slate-700">
            Unified Government Interoperability Platform
          </p>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            Coordinated, consented data exchange across independent departmental systems without centralized data aggregation.
          </p>
        </div>

        {/* Existing Session Notice if already logged in */}
        {isAuthenticated && role && (
          <div className="rounded-2xl border border-teal/40 bg-teal/5 p-4 text-xs text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-panel">
            <div>
              <span className="font-bold text-teal block">Active Session Detected</span>
              <span>
                Currently authenticated as <strong>{role}</strong> ({identifier}).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(role === "CITIZEN" ? "/citizen" : "/officer")}
                className="rounded-lg bg-teal px-3 py-1.5 font-bold text-white hover:bg-teal/90 text-xs shadow-sm"
              >
                Go to Portal →
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 text-xs shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Authentication Container */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-panel sm:p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-ink">Sign In to SAMANVAYSETU</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your authorization role to access citizen services or government operations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Two Clearly Separated Role Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Select Your Role
              </label>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* CITIZEN Option */}
                <button
                  type="button"
                  id="role-select-citizen"
                  onClick={() => handleSelectRole("CITIZEN")}
                  className={`relative flex flex-col text-left rounded-2xl border p-4 transition ${
                    selectedRole === "CITIZEN"
                      ? "border-teal bg-teal/5 ring-2 ring-teal/30 shadow-sm"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal/15 text-teal text-base">
                      👤
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        selectedRole === "CITIZEN"
                          ? "bg-teal text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {selectedRole === "CITIZEN" ? "✓ SELECTED" : "SELECT"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">CITIZEN</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Access citizen services and track applications.
                  </p>
                </button>

                {/* OFFICER Option */}
                <button
                  type="button"
                  id="role-select-officer"
                  onClick={() => handleSelectRole("OFFICER")}
                  className={`relative flex flex-col text-left rounded-2xl border p-4 transition ${
                    selectedRole === "OFFICER"
                      ? "border-navy bg-navy/5 ring-2 ring-navy/30 shadow-sm"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy/15 text-navy text-base">
                      🏛️
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        selectedRole === "OFFICER"
                          ? "bg-navy text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {selectedRole === "OFFICER" ? "✓ SELECTED" : "SELECT"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">OFFICER</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Access government operations, monitoring and audit tools.
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Demo Account Banner */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  DEMO ACCOUNT CREDENTIALS
                </span>
                <span className="rounded bg-amber-200/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900">
                  PROTOTYPE MODE
                </span>
              </div>

              <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="text-slate-800">
                    Active Preset: <strong>{selectedRole === "CITIZEN" ? "Citizen (Aarav Sharma)" : "Government Officer (S. Ramanathan)"}</strong>
                  </div>
                  <div className="font-mono text-slate-600">
                    ID: <strong className="text-navy">{DEMO_ACCOUNTS[selectedRole].id}</strong> · Password: <strong className="text-navy">{DEMO_ACCOUNTS[selectedRole].password}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickFill(selectedRole)}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm hover:bg-amber-50 self-start sm:self-auto"
                >
                  Fill Credentials
                </button>
              </div>
            </div>

            {/* 3. Error Alert */}
            {errorMessage && (
              <div
                id="login-error-alert"
                className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5"
              >
                <span className="text-sm">⚠️</span>
                <div>
                  <strong className="block font-bold">Authentication Notice</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* 4. Form Fields */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="user-identifier"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  {selectedRole === "CITIZEN" ? "Citizen ID" : "Officer ID"}
                </label>
                <input
                  id="user-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={selectedRole === "CITIZEN" ? "e.g., CIT-1001" : "e.g., OFF-1001"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              <div>
                <label
                  htmlFor="user-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Password
                </label>
                <input
                  id="user-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>
            </div>

            {/* 5. Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              className={`w-full rounded-xl py-3 text-xs font-bold text-white shadow-sm transition ${
                selectedRole === "CITIZEN"
                  ? "bg-teal hover:bg-teal/90"
                  : "bg-navy hover:bg-navy/90"
              }`}
            >
              Sign In as {selectedRole === "CITIZEN" ? "Citizen" : "Government Officer"} →
            </button>
          </form>
        </div>

        {/* 6. Security UX & Architecture Disclaimer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500 shadow-panel space-y-2">
          <p className="leading-relaxed">
            <strong>Security Notice:</strong> Prototype authentication — production deployment would integrate with authorized government identity infrastructure.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-center">
            <BackendStatus />
          </div>
        </div>
      </div>
    </main>
  );
}

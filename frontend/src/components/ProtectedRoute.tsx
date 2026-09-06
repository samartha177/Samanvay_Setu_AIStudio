import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { useAuth, type UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if current role is permitted
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "CITIZEN") {
      return (
        <div className="mx-auto max-w-2xl py-12 px-4 text-center">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-panel md:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl text-rose-700">
              🔒
            </div>
            <span className="mt-5 inline-block rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-rose-700">
              ACCESS RESTRICTED
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
              Officer Authorization Required
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              Officer authorization is required to access this area. Access restricted to authorized government officers. Your current session is authenticated as{" "}
              <strong>Citizen ({user.id})</strong>.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/citizen"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-teal px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-teal/90"
              >
                Return to Citizen Portal
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Officer attempting to access citizen-only route
    return (
      <div className="mx-auto max-w-2xl py-12 px-4 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-panel md:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-800">
            🏛️
          </div>
          <span className="mt-5 inline-block rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-amber-800">
            CITIZEN AREA
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
            Citizen Self-Service Zone
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
            This area is designated for citizen public service applications. As an authenticated government officer (
            <strong>{user.id}</strong>), please use the operations console.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/officer"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-navy/90"
            >
              Return to Operations Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

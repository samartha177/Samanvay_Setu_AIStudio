import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { BackendStatus } from "../components/BackendStatus";
import { useAuth } from "../contexts/AuthContext";

const citizenNavItems = [
  ["/citizen", "Citizen portal"],
  ["/citizen/services", "Services"],
  ["/citizen/applications", "My Applications"],
  ["/citizen/consent-history", "Consent History"],
] as const;

const officerNavItems = [
  ["/officer", "Operations"],
  ["/officer/applications", "Applications"],
  ["/officer/monitoring", "Monitoring"],
  ["/officer/service-graph", "Service Graph"],
  ["/admin/schema-mapper", "Schema Mapper"],
] as const;

export function PortalLayout() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = role === "OFFICER" ? officerNavItems : citizenNavItems;

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      <header className="border-b border-white/60 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <NavLink to={role === "OFFICER" ? "/officer" : "/citizen"} className="min-w-0 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white font-black text-sm shadow-sm">
              सं
            </span>
            <div>
              <span className="block text-lg font-bold tracking-tight text-navy leading-none">
                SAMANVAYSETU
              </span>
              <span className="block text-[11px] text-slate-500 mt-1">
                Unified Government Interoperability Platform
              </span>
            </div>
          </NavLink>

          <div className="flex items-center gap-3">
            <BackendStatus />
            <button
              type="button"
              id="header-signout-btn"
              onClick={handleSignOut}
              className="hidden sm:inline-flex rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              title="Sign out of SAMANVAYSETU"
            >
              Sign out ⎋
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl flex-1 w-full md:grid-cols-[230px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-3 py-5 md:min-h-[calc(100vh-73px)] md:border-b-0 md:border-r flex flex-col justify-between">
          <div className="space-y-4">
            <div className="px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {role === "OFFICER" ? "GOVERNMENT OPERATIONS" : "CITIZEN SERVICES"}
              </span>
            </div>
            <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Platform navigation">
              {navItems.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/citizen" || to === "/officer"}
                  className={({ isActive }) =>
                    `nav-link whitespace-nowrap text-xs font-medium px-3.5 py-2.5 rounded-xl transition ${
                      isActive
                        ? "bg-teal/10 font-bold text-teal shadow-panel border border-teal/20"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User Profile & Sign Out at the Bottom */}
          <div className="mt-8 pt-4 border-t border-slate-200 px-2 space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Signed in as:
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    role === "OFFICER" ? "bg-navy" : "bg-teal"
                  }`}
                />
                <span className="text-xs font-bold text-slate-800">
                  {role === "OFFICER" ? "Officer" : "Citizen"}
                </span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                  {user?.id || (role === "OFFICER" ? "OFF-1001" : "CIT-1001")}
                </span>
              </div>
              {user?.name && (
                <div className="text-[11px] text-slate-500 truncate pl-4">
                  {user.name}
                </div>
              )}
            </div>

            <button
              type="button"
              id="sidebar-signout-btn"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-rose-700 transition"
            >
              <span>Sign out</span>
              <span className="text-slate-400">⎋</span>
            </button>
          </div>
        </aside>

        <main className="px-5 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

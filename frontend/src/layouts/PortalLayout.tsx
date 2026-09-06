import { NavLink, Outlet } from "react-router-dom";

import { BackendStatus } from "../components/BackendStatus";

const navItems = [
  ["/citizen", "Citizen portal"],
  ["/citizen/services", "Services"],
  ["/citizen/applications", "Applications"],
  ["/officer", "Officer console"],
  ["/officer/monitoring", "Monitoring"],
  ["/officer/service-graph", "Service graph"],
  ["/admin/schema-mapper", "Schema mapper"],
] as const;

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-white/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <NavLink to="/citizen" className="min-w-0">
            <span className="block text-lg font-bold tracking-tight text-navy">SAMANVAYSETU</span>
            <span className="block text-xs text-slate-500">Unified Government Interoperability Platform</span>
          </NavLink>
          <BackendStatus />
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl md:grid-cols-[220px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-3 py-4 md:min-h-[calc(100vh-73px)] md:border-b-0 md:border-r">
          <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Platform navigation">
            {navItems.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link whitespace-nowrap ${isActive ? "nav-link-active" : ""}`}>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="px-5 py-8 md:px-10"><Outlet /></main>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";

export function CitizenDashboardPage() {
  return (
    <>
      <PageHeader eyebrow="Citizen portal" title="Services that work together" description="SAMANVAYSETU will coordinate consented data exchange across existing departments without replacing their systems." />
      <section className="grid gap-5 lg:grid-cols-2">
        <Link to="/citizen/services" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal/40">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Available service</p>
          <h2 className="mt-3 text-xl font-semibold text-ink">Scholarship application</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Apply for Higher Education Scholarships with automated, consented verification across Identity, Education, and Income departments.</p>
        </Link>
        <Link to="/citizen/applications" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal/40">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Your records</p>
          <h2 className="mt-3 text-xl font-semibold text-ink">Application status</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Track submitted applications, verification decisions, and purpose-scoped audit history.</p>
        </Link>
      </section>
    </>
  );
}

import { Link } from "react-router-dom";

import { BackendStatus } from "../components/BackendStatus";

export function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-5 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-white bg-white p-8 shadow-panel sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">SAMANVAYSETU</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">One bridge for connected public services.</h1>
        <p className="mt-4 text-lg leading-7 text-slate-600">Unified Government Interoperability Platform</p>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4"><BackendStatus /></div>
        <p className="mt-8 text-sm leading-6 text-slate-600">Secure sign-in and role-based access will be implemented with the consent and workflow foundation. This Phase 1 screen intentionally contains no inactive sign-in form.</p>
        <Link className="mt-8 inline-flex rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink" to="/citizen">Explore the prototype foundation</Link>
      </section>
    </main>
  );
}

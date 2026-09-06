type PlaceholderPanelProps = {
  heading: string;
  description: string;
  phase: string;
};

export function PlaceholderPanel({ heading, description, phase }: PlaceholderPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Planned · {phase}</p>
      <h2 className="mt-3 text-xl font-semibold text-ink">{heading}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}

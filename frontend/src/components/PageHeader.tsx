export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
    </header>
  );
}

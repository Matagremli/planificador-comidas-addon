import Link from "next/link";

export default function WeeklyMenuPage() {
  return (
    <section className="card-surface rounded-[2rem] p-6 sm:p-8">
      <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
        Fase 3
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
        Menú semanal
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
        El generador ya puntúa recetas por variedad, duración en nevera, batch cooking, bases
        compartidas útiles y similitud. Desde aquí puedes abrirlo y ajustar una semana concreta.
      </p>
      <Link
        href="/menu/generar"
        className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-white hover:-translate-y-0.5 hover:bg-accent-strong"
      >
        Abrir generador
      </Link>
    </section>
  );
}

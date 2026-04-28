import Link from "next/link";

export default function NewRecipePage() {
  return (
    <section className="card-surface rounded-[2rem] p-6 sm:p-8">
      <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
        Siguiente paso
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
        Formulario de receta en la Fase 2
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
        Esta ruta ya está preparada. En la siguiente fase añadiremos el formulario completo para
        crear, editar y validar recetas en español.
      </p>
      <Link
        href="/recetas"
        className="mt-6 inline-flex rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
      >
        Volver al catálogo
      </Link>
    </section>
  );
}

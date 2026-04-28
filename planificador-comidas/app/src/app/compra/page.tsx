export default function ShoppingPage() {
  return (
    <section className="card-surface rounded-[2rem] p-6 sm:p-8">
      <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
        Fase 4
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
        Lista de la compra
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
        Esta vista quedará conectada al menú semanal para agrupar ingredientes, ajustar raciones y
        copiar la lista en texto.
      </p>
    </section>
  );
}

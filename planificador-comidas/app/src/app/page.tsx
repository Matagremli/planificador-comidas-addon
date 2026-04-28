import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { recipeCategoryLabels } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [recipeCount, menuCount, categories] = await Promise.all([
    prisma.recipe.count(),
    prisma.weeklyMenu.count(),
    prisma.recipe.groupBy({
      by: ["category"],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: "desc",
        },
      },
      take: 4,
    }),
  ]);

  return (
    <section className="space-y-6">
      <div className="card-surface overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Base local lista para crecer por fases
            </span>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Organiza recetas, menús semanales y la compra desde una sola app.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                Esta primera versión ya guarda recetas en SQLite con Prisma, muestra el catálogo
                inicial y deja preparada la estructura para el generador semanal.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/recetas"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-base font-extrabold text-white hover:-translate-y-0.5 hover:bg-accent-strong"
              >
                Ver recetas
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-5 py-3 text-base font-bold text-foreground hover:-translate-y-0.5 hover:border-accent"
              >
                Explorar menú semanal
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-line bg-[#fff7ee] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-warm">
              Resumen rápido
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-surface px-4 py-4">
                <p className="text-sm text-muted">Recetas disponibles</p>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{recipeCount}</p>
              </div>
              <div className="rounded-[1.4rem] bg-surface px-4 py-4">
                <p className="text-sm text-muted">Menús guardados</p>
                <p className="mt-2 text-3xl font-extrabold text-foreground">{menuCount}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[1.4rem] bg-surface px-4 py-4">
              <p className="text-sm font-bold text-foreground">Categorías más presentes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <span key={item.category} className="tag-chip">
                    {recipeCategoryLabels[item.category]} · {item._count.category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            href: "/recetas",
            title: "Catálogo de recetas",
            description: "Consulta las recetas semilla, sus etiquetas y sus ingredientes.",
          },
          {
            href: "/menu/generar",
            title: "Generador semanal",
            description: "La lógica de reglas llegará en la siguiente fase, con esta base ya lista.",
          },
          {
            href: "/compra",
            title: "Lista de la compra",
            description: "La ruta queda preparada para conectar los menús con ingredientes agrupados.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card-surface rounded-[1.75rem] p-5 hover:-translate-y-1"
          >
            <p className="text-xl font-extrabold text-foreground">{item.title}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

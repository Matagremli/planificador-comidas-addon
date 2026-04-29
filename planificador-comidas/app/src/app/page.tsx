import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCatalogCategoryLabel, recipeCategoryLabels } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [recipeCount, menuCount, highlightedRecipes, categories] = await Promise.all([
    prisma.recipe.count(),
    prisma.weeklyMenu.count(),
    prisma.recipe.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 3,
    }),
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
      <div className="card-surface overflow-hidden rounded-[2.4rem] p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Version 0.1.1 · recetas editables y calendario mensual
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-6xl">
                Cocina con una vista clara de tus recetas y de todo el mes.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                El add-on ya te deja editar recetas existentes, filtrar por tipo de comida y
                guardar semanas para verlas despues en formato calendario.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/recetas"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-base font-extrabold text-white shadow-[0_10px_24px_rgba(97,122,66,0.22)] hover:-translate-y-0.5 hover:bg-accent-strong"
              >
                Gestionar recetas
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-5 py-3 text-base font-bold text-foreground hover:-translate-y-0.5 hover:border-accent"
              >
                Ver calendario mensual
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-line bg-[#fff7ee] p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-warm">
              Resumen rapido
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-surface px-4 py-4">
                <p className="text-sm text-muted">Recetas</p>
                <p className="mt-2 text-3xl font-black text-foreground">{recipeCount}</p>
              </div>
              <div className="rounded-[1.4rem] bg-surface px-4 py-4">
                <p className="text-sm text-muted">Semanas guardadas</p>
                <p className="mt-2 text-3xl font-black text-foreground">{menuCount}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] bg-surface px-4 py-4">
              <p className="text-sm font-black text-foreground">Categorias mas presentes</p>
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

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface rounded-[2rem] p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-warm">
            Accesos directos
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                href: "/recetas",
                title: "Recetas",
                description: "Filtra por cremas, vinagretas, carnes o postres y edita cada ficha.",
              },
              {
                href: "/menu/generar",
                title: "Generador",
                description: "Decide cuantas comidas quieres en la semana y guarda el resultado.",
              },
              {
                href: "/menu",
                title: "Calendario",
                description: "Revisa el mes completo y reabre cualquier semana guardada.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.4rem] border border-line bg-white/70 p-4 hover:-translate-y-1"
              >
                <p className="text-lg font-black text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-[2rem] p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-warm">
            Ultimas recetas tocadas
          </p>
          <div className="mt-4 space-y-3">
            {highlightedRecipes.map((recipe) => (
              <article
                key={recipe.id}
                className="rounded-[1.4rem] border border-line bg-white/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">{recipe.name}</p>
                    <p className="mt-1 text-sm text-muted">{recipe.shortDescription}</p>
                  </div>
                  <span className="tag-chip">{getCatalogCategoryLabel(recipe.catalogCategory)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

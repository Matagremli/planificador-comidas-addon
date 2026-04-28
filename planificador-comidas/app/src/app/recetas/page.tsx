import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { difficultyLabels, recipeCategoryLabels, splitTags } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    include: {
      recipeIngredients: {
        include: {
          ingredient: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <section className="space-y-6">
      <div className="card-surface rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Fase 1 · Catálogo básico conectado a SQLite
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Recetas guardadas
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-8 text-muted">
                Ya puedes navegar por las recetas semilla, revisar sus ingredientes y abrir su
                ficha individual. La creación y edición llegarán en la siguiente fase.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/recetas/nueva"
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-white hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              Nueva receta
            </Link>
            <div className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-bold text-muted">
              {recipes.length} recetas cargadas
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {recipes.map((recipe) => {
          const tags = splitTags(recipe.tags);

          return (
            <article key={recipe.id} className="card-surface rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm">
                      {recipeCategoryLabels[recipe.category]}
                    </p>
                    <div>
                      <h2 className="text-2xl font-extrabold text-foreground">{recipe.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {recipe.shortDescription}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-line bg-surface-strong px-3 py-2 text-sm font-bold text-muted">
                    Base: {recipe.culinaryBase}
                  </span>
                </div>

                <div className="grid gap-3 rounded-[1.4rem] bg-[#fff7ee] p-4 text-sm text-muted sm:grid-cols-4">
                  <div>
                    <p className="font-bold text-foreground">Raciones</p>
                    <p>{recipe.servings}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Tiempo</p>
                    <p>{recipe.estimatedMinutes} min</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Dificultad</p>
                    <p>{difficultyLabels[recipe.difficulty]}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Nevera</p>
                    <p>{recipe.fridgeDays} días</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-foreground">Ingredientes principales</p>
                  <div className="flex flex-wrap gap-2">
                    {recipe.recipeIngredients.slice(0, 5).map(({ ingredient }) => (
                      <span key={ingredient.id} className="tag-chip">
                        {ingredient.name}
                      </span>
                    ))}
                    {recipe.recipeIngredients.length > 5 ? (
                      <span className="tag-chip">
                        +{recipe.recipeIngredients.length - 5} más
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/recetas/${recipe.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-4 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
                  >
                    Ver ficha completa
                  </Link>
                  <span className="inline-flex items-center justify-center rounded-full bg-accent-soft px-4 py-3 text-sm font-bold text-accent-strong">
                    {recipe.isAvailableThisWeek ? "Disponible esta semana" : "No disponible"}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

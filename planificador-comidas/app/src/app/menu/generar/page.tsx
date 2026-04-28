import Link from "next/link";
import type { WeeklyMenuItemType } from "@prisma/client";
import {
  generateWeeklyMenu,
  getGeneratorDefaults,
  parseGeneratorRules,
} from "@/lib/menu-generator";
import { prisma } from "@/lib/prisma";
import { recipeCategoryLabels, splitTags } from "@/lib/recipes";

export const dynamic = "force-dynamic";

type GenerateMenuPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const menuTypeLabels: Record<WeeklyMenuItemType, string> = {
  PRINCIPAL: "Plato principal",
  ENSALADA: "Ensalada",
  CREMA: "Crema",
  ACOMPANAMIENTO: "Acompañamiento",
};

export default async function GenerateMenuPage({ searchParams }: GenerateMenuPageProps) {
  const resolvedSearchParams = await searchParams;

  const [recipes, defaultRuleSet] = await Promise.all([
    prisma.recipe.findMany({
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
    }),
    prisma.ruleSet.findFirst({
      where: {
        isDefault: true,
      },
    }),
  ]);

  const defaults = getGeneratorDefaults(resolvedSearchParams);
  const rules = parseGeneratorRules(defaultRuleSet?.config);
  const generatedMenu = generateWeeklyMenu(
    recipes,
    {
      mainDishCount: defaults.mainDishCount,
      includeSalad: defaults.includeSalad,
      includeCream: defaults.includeCream,
      excludedRecipeIds: defaults.excludedRecipeIds,
      excludedIngredients: defaults.excludedIngredients,
    },
    rules,
  );

  return (
    <section className="space-y-6">
      <div className="card-surface rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Fase 3 · Generador con reglas locales
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Generador de menú semanal
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-8 text-muted">
                Este generador ya no elige recetas al azar. Puntúa variedad, duración en nevera,
                potencial para batch cooking, bases compartidas útiles y penaliza similitudes o
                repeticiones excesivas.
              </p>
            </div>
          </div>

          <Link
            href="/menu"
            className="inline-flex rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
          >
            Volver a menú
          </Link>
        </div>
      </div>

      <form className="card-surface rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Reglas rápidas</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Ajusta lo básico y vuelve a generar. Mantengo el foco en una primera versión útil,
                con reglas locales y explicación visible por receta.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="rounded-[1.4rem] border border-line bg-surface-strong p-4">
                <span className="text-sm font-bold text-foreground">Principales</span>
                <input
                  type="number"
                  name="mainDishCount"
                  min={3}
                  max={7}
                  defaultValue={defaults.mainDishCount}
                  className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>

              <label className="rounded-[1.4rem] border border-line bg-surface-strong p-4">
                <span className="text-sm font-bold text-foreground">Ensalada</span>
                <select
                  name="includeSalad"
                  defaultValue={String(defaults.includeSalad)}
                  className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label className="rounded-[1.4rem] border border-line bg-surface-strong p-4">
                <span className="text-sm font-bold text-foreground">Crema</span>
                <select
                  name="includeCream"
                  defaultValue={String(defaults.includeCream)}
                  className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </label>
            </div>

            <label className="block rounded-[1.4rem] border border-line bg-surface-strong p-4">
              <span className="text-sm font-bold text-foreground">Excluir ingredientes</span>
              <input
                type="text"
                name="excludedIngredients"
                defaultValue={defaults.excludedIngredientsText}
                placeholder="Ejemplo: atún, chorizo, merluza"
                className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <span className="mt-2 block text-xs leading-6 text-muted">
                Escríbelos separados por comas. El generador descartará cualquier receta que los
                contenga.
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Excluir recetas concretas</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Útil para semanas en las que no te apetece repetir un plato concreto aunque encaje
                bien por puntuación.
              </p>
            </div>

            <div className="grid max-h-72 gap-3 overflow-y-auto rounded-[1.4rem] border border-line bg-surface-strong p-4 sm:grid-cols-2">
              {recipes.map((recipe) => (
                <label key={recipe.id} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    name="excludedRecipeIds"
                    value={recipe.id}
                    defaultChecked={defaults.excludedRecipeIds.includes(recipe.id)}
                    className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent"
                  />
                  <span>
                    <span className="block text-sm font-bold text-foreground">{recipe.name}</span>
                    <span className="text-xs text-muted">
                      {recipeCategoryLabels[recipe.category]} · {recipe.culinaryBase}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-white hover:-translate-y-0.5 hover:bg-accent-strong"
          >
            Generar menú
          </button>
          <Link
            href="/menu/generar"
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
          >
            Restablecer filtros
          </Link>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="card-surface rounded-[1.75rem] p-6">
          <h2 className="text-xl font-extrabold text-foreground">Resumen de esta generación</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] bg-surface-strong p-4">
              <p className="text-sm text-muted">Recetas elegibles</p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {generatedMenu.metadata.totalEligibleRecipes}
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-surface-strong p-4">
              <p className="text-sm text-muted">Platos elegidos</p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {generatedMenu.items.length}
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-surface-strong p-4">
              <p className="text-sm text-muted">Excluidas manualmente</p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {generatedMenu.metadata.excludedByRecipe}
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-surface-strong p-4">
              <p className="text-sm text-muted">Excluidas por ingrediente</p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {generatedMenu.metadata.excludedByIngredient}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] bg-[#fff7ee] p-4">
            <p className="text-sm font-bold text-foreground">Reglas activas de puntuación</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Variedad por categoría",
                "Días de nevera",
                "Batch cooking",
                "Base compartida útil",
                "Penalización por similitud",
              ].map((item) => (
                <span key={item} className="tag-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {generatedMenu.warnings.length > 0 ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-bold text-foreground">Avisos del menú</p>
              {generatedMenu.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-[1.25rem] border border-line bg-surface-strong p-4 text-sm leading-7 text-muted"
                >
                  {warning}
                </div>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="space-y-4">
          {generatedMenu.items.map((item) => (
            <article
              key={`${item.type}-${item.recipe.id}`}
              className="card-surface rounded-[1.75rem] p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="tag-chip">{menuTypeLabels[item.type]}</span>
                      <span className="tag-chip">{recipeCategoryLabels[item.recipe.category]}</span>
                      <span className="tag-chip">Base: {item.recipe.culinaryBase}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-foreground">{item.recipe.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {item.recipe.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] bg-accent-soft px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
                      Puntuación
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-accent-strong">{item.score}</p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] bg-[#fff7ee] p-4">
                  <p className="text-sm font-bold text-foreground">Por qué se eligió</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.explanation}</p>
                </div>

                <div className="grid gap-3 rounded-[1.25rem] bg-surface-strong p-4 text-sm text-muted sm:grid-cols-3">
                  <div>
                    <p className="font-bold text-foreground">Nevera</p>
                    <p>{item.recipe.fridgeDays} días</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Tiempo</p>
                    <p>{item.recipe.estimatedMinutes} min</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Raciones base</p>
                    <p>{item.recipe.servings}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {splitTags(item.recipe.tags).map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

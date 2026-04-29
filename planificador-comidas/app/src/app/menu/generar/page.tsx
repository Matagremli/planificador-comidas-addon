import Link from "next/link";
import type { WeeklyMenuItemType } from "@prisma/client";
import { saveWeeklyMenuAction } from "@/app/menu/actions";
import {
  generateWeeklyMenu,
  getGeneratorDefaults,
  parseGeneratorRules,
} from "@/lib/menu-generator";
import { parseDateInput, toDateInputValue, weekName } from "@/lib/menu-calendar";
import { prisma } from "@/lib/prisma";
import { getCatalogCategoryLabel, recipeCategoryLabels, splitTags } from "@/lib/recipes";

export const dynamic = "force-dynamic";

type GenerateMenuPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const menuTypeLabels: Record<WeeklyMenuItemType, string> = {
  PRINCIPAL: "Plato principal",
  ENSALADA: "Ensalada",
  CREMA: "Crema",
  ACOMPANAMIENTO: "Acompanamiento",
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
  const weekStart = parseDateInput(
    typeof resolvedSearchParams.weekStart === "string" ? resolvedSearchParams.weekStart : undefined,
  );
  const servings =
    typeof resolvedSearchParams.servings === "string"
      ? Math.max(1, Number.parseInt(resolvedSearchParams.servings, 10) || 4)
      : 4;
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
      <div className="card-surface rounded-[2.2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Generador semanal configurable
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                Generar y guardar una semana
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-muted">
                Ajusta cuantas comidas quieres, decide si quieres ensalada o crema y guarda el
                resultado para verlo despues en el calendario mensual.
              </p>
            </div>
          </div>

          <Link
            href="/menu"
            className="inline-flex rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
          >
            Volver al calendario
          </Link>
        </div>
      </div>

      <form className="card-surface rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-foreground">Ajustes semanales</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Esta configuracion controla el volumen de recetas de la semana y la fecha desde la
                que se colocara en el calendario.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-[1.5rem] border border-line bg-surface-strong p-4">
                <span className="text-sm font-bold text-foreground">Semana que quieres planificar</span>
                <input
                  type="date"
                  name="weekStart"
                  defaultValue={toDateInputValue(weekStart)}
                  className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>

              <label className="rounded-[1.5rem] border border-line bg-surface-strong p-4">
                <span className="text-sm font-bold text-foreground">Raciones base</span>
                <input
                  type="number"
                  name="servings"
                  min={1}
                  max={12}
                  defaultValue={servings}
                  className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>

              <label className="rounded-[1.5rem] border border-line bg-surface-strong p-4">
                <span className="text-sm font-bold text-foreground">Comidas principales</span>
                <input
                  type="number"
                  name="mainDishCount"
                  min={3}
                  max={7}
                  defaultValue={defaults.mainDishCount}
                  className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                />
                <span className="mt-2 block text-xs leading-6 text-muted">
                  Asi decides cuantas comidas quieres programar en la semana.
                </span>
              </label>

              <label className="rounded-[1.5rem] border border-line bg-surface-strong p-4">
                <span className="text-sm font-bold text-foreground">Ensalada y crema</span>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <select
                    name="includeSalad"
                    defaultValue={String(defaults.includeSalad)}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                  >
                    <option value="true">Con ensalada</option>
                    <option value="false">Sin ensalada</option>
                  </select>
                  <select
                    name="includeCream"
                    defaultValue={String(defaults.includeCream)}
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                  >
                    <option value="true">Con crema</option>
                    <option value="false">Sin crema</option>
                  </select>
                </div>
              </label>
            </div>

            <label className="block rounded-[1.5rem] border border-line bg-surface-strong p-4">
              <span className="text-sm font-bold text-foreground">Excluir ingredientes</span>
              <input
                type="text"
                name="excludedIngredients"
                defaultValue={defaults.excludedIngredientsText}
                placeholder="atun, chorizo, merluza"
                className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <span className="mt-2 block text-xs leading-6 text-muted">
                El generador descartara cualquier receta que contenga esos ingredientes.
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-foreground">Recetas a excluir</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Si esta semana no quieres un plato concreto, marcalo aqui y se quedara fuera.
              </p>
            </div>

            <div className="grid max-h-80 gap-3 overflow-y-auto rounded-[1.5rem] border border-line bg-surface-strong p-4 sm:grid-cols-2">
              {recipes.map((recipe) => (
                <label
                  key={recipe.id}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-line/70 bg-white/80 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    name="excludedRecipeIds"
                    value={recipe.id}
                    defaultChecked={defaults.excludedRecipeIds.includes(recipe.id)}
                    className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent"
                  />
                  <span>
                    <span className="block text-sm font-black text-foreground">{recipe.name}</span>
                    <span className="text-xs text-muted">
                      {getCatalogCategoryLabel(recipe.catalogCategory)} · {recipe.culinaryBase}
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
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(97,122,66,0.22)] hover:-translate-y-0.5 hover:bg-accent-strong"
          >
            Generar menu
          </button>
          <Link
            href="/menu/generar"
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
          >
            Restablecer
          </Link>
        </div>
      </form>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-6">
          <div className="card-surface rounded-[1.9rem] p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-warm">
              Semana prevista
            </p>
            <h2 className="mt-2 text-2xl font-black text-foreground">{weekName(weekStart)}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] bg-surface-strong p-4">
                <p className="text-sm text-muted">Elegibles</p>
                <p className="mt-2 text-3xl font-black text-foreground">
                  {generatedMenu.metadata.totalEligibleRecipes}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-surface-strong p-4">
                <p className="text-sm text-muted">Platos del menu</p>
                <p className="mt-2 text-3xl font-black text-foreground">
                  {generatedMenu.items.length}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-surface-strong p-4">
                <p className="text-sm text-muted">Excluidas a mano</p>
                <p className="mt-2 text-3xl font-black text-foreground">
                  {generatedMenu.metadata.excludedByRecipe}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-surface-strong p-4">
                <p className="text-sm text-muted">Por ingrediente</p>
                <p className="mt-2 text-3xl font-black text-foreground">
                  {generatedMenu.metadata.excludedByIngredient}
                </p>
              </div>
            </div>
          </div>

          <div className="card-surface rounded-[1.9rem] p-6">
            <h2 className="text-xl font-black text-foreground">Guardar en el calendario</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Si te convence la seleccion, guardala y quedara visible en la vista mensual.
            </p>

            <form action={saveWeeklyMenuAction} className="mt-5">
              <input type="hidden" name="weekStart" value={toDateInputValue(weekStart)} />
              <input type="hidden" name="servings" value={String(servings)} />
              <input type="hidden" name="mainDishCount" value={String(defaults.mainDishCount)} />
              <input
                type="hidden"
                name="includeSalad"
                value={String(defaults.includeSalad)}
              />
              <input
                type="hidden"
                name="includeCream"
                value={String(defaults.includeCream)}
              />
              <input
                type="hidden"
                name="excludedRecipeIds"
                value={JSON.stringify(defaults.excludedRecipeIds)}
              />
              <input
                type="hidden"
                name="excludedIngredients"
                value={JSON.stringify(defaults.excludedIngredients)}
              />

              {generatedMenu.items.map((item) => (
                <input
                  key={`${item.type}-${item.recipe.id}`}
                  type="hidden"
                  name="items"
                  value={JSON.stringify({
                    recipeId: item.recipe.id,
                    type: item.type,
                    explanation: item.explanation,
                  })}
                />
              ))}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(97,122,66,0.22)] hover:-translate-y-0.5 hover:bg-accent-strong"
              >
                Guardar esta semana
              </button>
            </form>

            {generatedMenu.warnings.length > 0 ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm font-black text-foreground">Avisos</p>
                {generatedMenu.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="rounded-[1.2rem] border border-line bg-white/70 p-4 text-sm leading-7 text-muted"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="space-y-4">
          {generatedMenu.items.map((item, index) => (
            <article
              key={`${item.type}-${item.recipe.id}`}
              className="card-surface rounded-[1.8rem] p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="tag-chip">{menuTypeLabels[item.type]}</span>
                      <span className="tag-chip">{recipeCategoryLabels[item.recipe.category]}</span>
                      <span className="tag-chip">
                        Tipo: {getCatalogCategoryLabel(item.recipe.catalogCategory)}
                      </span>
                      <span className="tag-chip">Base: {item.recipe.culinaryBase}</span>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-warm">
                        Seleccion {index + 1}
                      </p>
                      <h2 className="text-2xl font-black text-foreground">{item.recipe.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {item.recipe.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] bg-accent-soft px-4 py-3 text-right">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent-strong">
                      Puntuacion
                    </p>
                    <p className="mt-1 text-3xl font-black text-accent-strong">{item.score}</p>
                  </div>
                </div>

                <div className="rounded-[1.3rem] bg-[#fff7ee] p-4">
                  <p className="text-sm font-black text-foreground">Por que se eligio</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.explanation}</p>
                </div>

                <div className="grid gap-3 rounded-[1.3rem] bg-surface-strong p-4 text-sm text-muted sm:grid-cols-3">
                  <div>
                    <p className="font-black text-foreground">Nevera</p>
                    <p>{item.recipe.fridgeDays} dias</p>
                  </div>
                  <div>
                    <p className="font-black text-foreground">Tiempo</p>
                    <p>{item.recipe.estimatedMinutes} min</p>
                  </div>
                  <div>
                    <p className="font-black text-foreground">Raciones base</p>
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

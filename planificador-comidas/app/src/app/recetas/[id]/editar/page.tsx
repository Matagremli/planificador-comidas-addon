import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  catalogCategoryLabels,
  catalogCategoryOptions,
  difficultyLabels,
  difficultyOptions,
  purchaseCategoryLabels,
  recipeCategoryLabels,
  recipeCategoryOptions,
  splitTags,
} from "@/lib/recipes";
import { updateRecipeAction } from "@/app/recetas/actions";

export const dynamic = "force-dynamic";

type EditRecipePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      recipeIngredients: {
        include: {
          ingredient: true,
        },
        orderBy: {
          ingredient: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  const ingredientLines = recipe.recipeIngredients
    .map(
      (item) =>
        `${item.ingredient.name} | ${item.quantity} | ${item.unit} | ${item.ingredient.purchaseCategory}`,
    )
    .join("\n");

  const tagsText = splitTags(recipe.tags).join(", ");

  return (
    <section className="space-y-6">
      <div className="card-surface rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Edicion segura en SQLite
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Editar receta
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-8 text-muted">
                Ajusta la ficha de {recipe.name} y guarda los cambios directamente en la base de
                datos del add-on.
              </p>
            </div>
          </div>
          <Link
            href={`/recetas/${recipe.id}`}
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
          >
            Cancelar
          </Link>
        </div>
      </div>

      <form action={updateRecipeAction} className="card-surface rounded-[2rem] p-6 sm:p-8">
        <input type="hidden" name="recipeId" value={recipe.id} />

        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Nombre</span>
            <input
              name="name"
              defaultValue={recipe.name}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Descripcion corta</span>
            <input
              name="shortDescription"
              defaultValue={recipe.shortDescription}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Categoria principal</span>
            <select
              name="category"
              defaultValue={recipe.category}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            >
              {recipeCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {recipeCategoryLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Categoria de catalogo</span>
            <select
              name="catalogCategory"
              defaultValue={recipe.catalogCategory}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            >
              {catalogCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {catalogCategoryLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Base culinaria</span>
            <input
              name="culinaryBase"
              defaultValue={recipe.culinaryBase}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Etiquetas</span>
            <input
              name="tags"
              defaultValue={tagsText}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Raciones</span>
            <input
              type="number"
              min="1"
              name="servings"
              defaultValue={recipe.servings}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Tiempo estimado (min)</span>
            <input
              type="number"
              min="1"
              name="estimatedMinutes"
              defaultValue={recipe.estimatedMinutes}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Dificultad</span>
            <select
              name="difficulty"
              defaultValue={recipe.difficulty}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            >
              {difficultyOptions.map((option) => (
                <option key={option} value={option}>
                  {difficultyLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-foreground">Dias en nevera</span>
            <input
              type="number"
              min="0"
              name="fridgeDays"
              defaultValue={recipe.fridgeDays}
              className="w-full rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-bold text-foreground">Ingredientes</span>
          <textarea
            name="ingredients"
            defaultValue={ingredientLines}
            rows={8}
            className="w-full rounded-[1.5rem] border border-line bg-surface-strong px-4 py-3 text-sm leading-7 text-foreground outline-none focus:border-accent"
          />
          <span className="text-xs leading-6 text-muted">
            Una linea por ingrediente con el formato: nombre | cantidad | unidad | categoria.
            Categorias validas: {Object.entries(purchaseCategoryLabels)
              .map(([key, label]) => `${key} (${label})`)
              .join(", ")}
          </span>
        </label>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-bold text-foreground">Pasos</span>
          <textarea
            name="steps"
            defaultValue={recipe.steps}
            rows={7}
            className="w-full rounded-[1.5rem] border border-line bg-surface-strong px-4 py-3 text-sm leading-7 text-foreground outline-none focus:border-accent"
          />
          <span className="text-xs leading-6 text-muted">
            Escribe un paso por linea. En esta primera iteracion se guardan como texto sencillo.
          </span>
        </label>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-bold text-foreground">Notas</span>
          <textarea
            name="notes"
            defaultValue={recipe.notes ?? ""}
            rows={5}
            className="w-full rounded-[1.5rem] border border-line bg-surface-strong px-4 py-3 text-sm leading-7 text-foreground outline-none focus:border-accent"
          />
        </label>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-extrabold text-white hover:-translate-y-0.5 hover:bg-accent-strong"
          >
            Guardar cambios
          </button>
          <Link
            href={`/recetas/${recipe.id}`}
            className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-6 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
          >
            Volver sin guardar
          </Link>
        </div>
      </form>
    </section>
  );
}

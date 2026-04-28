import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  difficultyLabels,
  purchaseCategoryLabels,
  recipeCategoryLabels,
  splitTags,
} from "@/lib/recipes";

export const dynamic = "force-dynamic";

type RecipeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
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

  const tags = splitTags(recipe.tags);

  return (
    <section className="space-y-6">
      <div className="card-surface rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="tag-chip">{recipeCategoryLabels[recipe.category]}</span>
            <span className="tag-chip">Base: {recipe.culinaryBase}</span>
            <span className="tag-chip">{difficultyLabels[recipe.difficulty]}</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {recipe.name}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-muted">
              {recipe.shortDescription}
            </p>
          </div>
          <div className="grid gap-3 rounded-[1.4rem] bg-[#fff7ee] p-4 text-sm text-muted sm:grid-cols-4">
            <div>
              <p className="font-bold text-foreground">Raciones base</p>
              <p>{recipe.servings}</p>
            </div>
            <div>
              <p className="font-bold text-foreground">Tiempo estimado</p>
              <p>{recipe.estimatedMinutes} min</p>
            </div>
            <div>
              <p className="font-bold text-foreground">Nevera</p>
              <p>{recipe.fridgeDays} días</p>
            </div>
            <div>
              <p className="font-bold text-foreground">Estado</p>
              <p>{recipe.isAvailableThisWeek ? "Disponible" : "No disponible esta semana"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="card-surface rounded-[1.75rem] p-6">
          <h2 className="text-xl font-extrabold text-foreground">Ingredientes</h2>
          <div className="mt-4 space-y-3">
            {recipe.recipeIngredients.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-[1.25rem] border border-line bg-surface-strong px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-foreground">{item.ingredient.name}</p>
                  <p className="text-sm text-muted">
                    {purchaseCategoryLabels[item.ingredient.purchaseCategory]}
                  </p>
                </div>
                <p className="text-sm font-bold text-accent-strong">
                  {item.quantity} {item.unit}
                </p>
              </div>
            ))}
          </div>
        </article>

        <aside className="card-surface rounded-[1.75rem] p-6">
          <h2 className="text-xl font-extrabold text-foreground">Notas</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            {recipe.notes || "Sin notas por ahora."}
          </p>
          <Link
            href="/recetas"
            className="mt-6 inline-flex rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-extrabold text-foreground hover:-translate-y-0.5 hover:border-accent"
          >
            Volver a recetas
          </Link>
        </aside>
      </div>
    </section>
  );
}

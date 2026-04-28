import { Prisma, RecipeCategory, type WeeklyMenuItemType } from "@prisma/client";
import { recipeCategoryLabels, splitTags } from "@/lib/recipes";

export type RecipeForMenu = Prisma.RecipeGetPayload<{
  include: {
    recipeIngredients: {
      include: {
        ingredient: true;
      };
    };
  };
}>;

export type GeneratorRules = {
  maxPerBase: number;
  maxMeatRecipes: number;
  minKeepWellRecipes: number;
  scoring: {
    keepsWell: number;
    batchCooking: number;
    sauce: number;
    usefulSharedBase: number;
    repeatedCategory: number;
    repeatedBase: number;
    verySimilarRecipe: number;
  };
};

export type GenerateWeeklyMenuOptions = {
  mainDishCount: number;
  includeSalad: boolean;
  includeCream: boolean;
  excludedRecipeIds: string[];
  excludedIngredients: string[];
};

export type GeneratedMenuItem = {
  type: WeeklyMenuItemType;
  recipe: RecipeForMenu;
  score: number;
  reasons: string[];
  penalties: string[];
  explanation: string;
  mandatory: boolean;
};

export type GeneratedWeeklyMenu = {
  items: GeneratedMenuItem[];
  warnings: string[];
  metadata: {
    totalEligibleRecipes: number;
    excludedByRecipe: number;
    excludedByIngredient: number;
  };
};

const DEFAULT_RULES: GeneratorRules = {
  maxPerBase: 2,
  maxMeatRecipes: 2,
  minKeepWellRecipes: 1,
  scoring: {
    keepsWell: 3,
    batchCooking: 2,
    sauce: 2,
    usefulSharedBase: 1,
    repeatedCategory: -3,
    repeatedBase: -4,
    verySimilarRecipe: -5,
  },
};

const MAIN_RECIPE_CATEGORIES = new Set<RecipeCategory>([
  RecipeCategory.CARNE,
  RecipeCategory.PESCADO,
  RecipeCategory.PASTA,
  RecipeCategory.ARROZ,
  RecipeCategory.LEGUMBRE,
  RecipeCategory.HORNO,
  RecipeCategory.RAPIDA,
  RecipeCategory.OTRO,
]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getTagSet(recipe: RecipeForMenu) {
  return new Set(splitTags(recipe.tags).map(normalizeText));
}

function hasTag(recipe: RecipeForMenu, tag: string) {
  return getTagSet(recipe).has(normalizeText(tag));
}

function sharesBase(a: RecipeForMenu, b: RecipeForMenu) {
  return normalizeText(a.culinaryBase) === normalizeText(b.culinaryBase);
}

function ingredientOverlapCount(a: RecipeForMenu, b: RecipeForMenu) {
  const aNames = new Set(
    a.recipeIngredients.map((item) => normalizeText(item.ingredient.name)),
  );

  return b.recipeIngredients.reduce((count, item) => {
    return count + Number(aNames.has(normalizeText(item.ingredient.name)));
  }, 0);
}

function areRecipesTooSimilar(a: RecipeForMenu, b: RecipeForMenu) {
  if (!sharesBase(a, b)) {
    return false;
  }

  const overlap = ingredientOverlapCount(a, b);
  const aName = normalizeText(a.name);
  const bName = normalizeText(b.name);
  const ovenLikeCategories = new Set<RecipeCategory>([
    RecipeCategory.HORNO,
    RecipeCategory.PASTA,
  ]);
  const stuffedLike =
    (aName.includes("lasa") || aName.includes("rellen")) &&
    (bName.includes("lasa") || bName.includes("rellen"));
  const ovenLike =
    [a.category, b.category].every((category) => ovenLikeCategories.has(category)) || stuffedLike;

  return overlap >= 3 || (overlap >= 2 && ovenLike);
}

function isKeepWellRecipe(recipe: RecipeForMenu) {
  return hasTag(recipe, "aguanta bien") || recipe.fridgeDays >= 4;
}

function isBatchRecipe(recipe: RecipeForMenu) {
  return hasTag(recipe, "batch cooking");
}

function hasSauce(recipe: RecipeForMenu) {
  return hasTag(recipe, "salsa");
}

function isMeatRecipe(recipe: RecipeForMenu) {
  return (
    recipe.category !== RecipeCategory.LEGUMBRE &&
    recipe.recipeIngredients.some((item) => item.ingredient.purchaseCategory === "CARNE")
  );
}

function isMainRecipe(recipe: RecipeForMenu) {
  return MAIN_RECIPE_CATEGORIES.has(recipe.category);
}

function isFishRecipe(recipe: RecipeForMenu) {
  return recipe.category === RecipeCategory.PESCADO;
}

function pickArray(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function scoreRecipe(
  recipe: RecipeForMenu,
  selectedItems: GeneratedMenuItem[],
  type: WeeklyMenuItemType,
  rules: GeneratorRules,
  remainingMainSlots: number,
  allCandidates: RecipeForMenu[],
) {
  let score = 0;
  const reasons: string[] = [];
  const penalties: string[] = [];

  if (isKeepWellRecipe(recipe)) {
    score += rules.scoring.keepsWell;
    reasons.push(`aguanta bien en nevera (+${rules.scoring.keepsWell})`);
  }

  if (recipe.fridgeDays >= 4) {
    score += 2;
    reasons.push(`buena duración en nevera (${recipe.fridgeDays} días) (+2)`);
  } else if (recipe.fridgeDays === 3) {
    score += 1;
    reasons.push("duración correcta para varios días (+1)");
  } else if (type === "PRINCIPAL") {
    score -= 1;
    penalties.push("duración más corta en nevera (-1)");
  }

  if (isBatchRecipe(recipe)) {
    score += rules.scoring.batchCooking;
    reasons.push(`sirve para batch cooking (+${rules.scoring.batchCooking})`);
  }

  if (hasSauce(recipe)) {
    score += rules.scoring.sauce;
    reasons.push(`la salsa ayuda a recalentar mejor (+${rules.scoring.sauce})`);
  }

  if (type !== "PRINCIPAL") {
    return { score, reasons, penalties };
  }

  const selectedMainItems = selectedItems.filter((item) => item.type === "PRINCIPAL");
  const sameCategoryCount = selectedMainItems.filter(
    (item) => item.recipe.category === recipe.category,
  ).length;
  const sameBaseItems = selectedMainItems.filter((item) => sharesBase(item.recipe, recipe));
  const similarRecipes = selectedMainItems.filter((item) =>
    areRecipesTooSimilar(item.recipe, recipe),
  );

  if (sameCategoryCount === 0) {
    score += 2;
    reasons.push("aporta variedad de categoría (+2)");
  } else {
    score += rules.scoring.repeatedCategory;
    penalties.push(
      `repite la categoría ${recipeCategoryLabels[recipe.category].toLowerCase()} (${rules.scoring.repeatedCategory})`,
    );
  }

  if (sameBaseItems.length === 1 && similarRecipes.length === 0) {
    score += rules.scoring.usefulSharedBase;
    reasons.push(
      `comparte la base "${recipe.culinaryBase}" de forma útil (+${rules.scoring.usefulSharedBase})`,
    );
  }

  if (sameBaseItems.length >= rules.maxPerBase) {
    score += rules.scoring.repeatedBase;
    penalties.push(
      `supera el máximo de ${rules.maxPerBase} recetas con la misma base (${rules.scoring.repeatedBase})`,
    );
  } else if (sameBaseItems.length === 0) {
    score += 1;
    reasons.push("abre una base culinaria distinta (+1)");
  }

  if (similarRecipes.length > 0) {
    score += rules.scoring.verySimilarRecipe;
    penalties.push(
      `se parece demasiado a ${similarRecipes[0].recipe.name} (${rules.scoring.verySimilarRecipe})`,
    );
  }

  const selectedMeatCount = selectedMainItems.filter((item) => isMeatRecipe(item.recipe)).length;
  const candidateWouldExceedMeat =
    isMeatRecipe(recipe) && selectedMeatCount >= rules.maxMeatRecipes;
  const nonMeatAlternatives = allCandidates.filter(
    (candidate) =>
      candidate.id !== recipe.id &&
      !selectedMainItems.some((item) => item.recipe.id === candidate.id) &&
      !isMeatRecipe(candidate),
  ).length;

  if (candidateWouldExceedMeat && nonMeatAlternatives >= remainingMainSlots) {
    score -= 3;
    penalties.push(`haría pasar del máximo de ${rules.maxMeatRecipes} recetas con carne (-3)`);
  }

  if (isFishRecipe(recipe) && hasSauce(recipe)) {
    score += 1;
    reasons.push("encaja bien como pescado con salsa (+1)");
  }

  return { score, reasons, penalties };
}

function toExplanation(score: number, reasons: string[], penalties: string[]) {
  const highlights = [...reasons.slice(0, 3), ...penalties.slice(0, 1)];

  if (highlights.length === 0) {
    return `Puntuación ${score}. Entró por equilibrio general del menú.`;
  }

  return `Puntuación ${score}. ${highlights.join(". ")}.`;
}

function chooseBestRecipe(
  candidates: RecipeForMenu[],
  selectedItems: GeneratedMenuItem[],
  type: WeeklyMenuItemType,
  rules: GeneratorRules,
  remainingMainSlots: number,
  mandatory = false,
) {
  const scored = candidates
    .map((recipe) => {
      const result = scoreRecipe(
        recipe,
        selectedItems,
        type,
        rules,
        remainingMainSlots,
        candidates,
      );

      return {
        type,
        recipe,
        score: result.score,
        reasons: result.reasons,
        penalties: result.penalties,
        explanation: toExplanation(result.score, result.reasons, result.penalties),
        mandatory,
      } satisfies GeneratedMenuItem;
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.recipe.fridgeDays !== a.recipe.fridgeDays) {
        return b.recipe.fridgeDays - a.recipe.fridgeDays;
      }

      return a.recipe.name.localeCompare(b.recipe.name, "es");
    });

  return scored[0];
}

function ensureKeepWellRecipe(
  items: GeneratedMenuItem[],
  mainCandidates: RecipeForMenu[],
  rules: GeneratorRules,
) {
  const selectedMainItems = items.filter((item) => item.type === "PRINCIPAL");

  if (selectedMainItems.some((item) => isKeepWellRecipe(item.recipe))) {
    return items;
  }

  const replacementTarget = [...selectedMainItems]
    .filter((item) => !item.mandatory)
    .sort((a, b) => a.score - b.score)[0];

  if (!replacementTarget) {
    return items;
  }

  const replacementCandidates = mainCandidates.filter(
    (recipe) =>
      recipe.id !== replacementTarget.recipe.id &&
      !selectedMainItems.some((item) => item.recipe.id === recipe.id) &&
      isKeepWellRecipe(recipe),
  );

  if (replacementCandidates.length === 0) {
    return items;
  }

  const remainingItems = items.filter((item) => item.recipe.id !== replacementTarget.recipe.id);
  const replacement = chooseBestRecipe(
    replacementCandidates,
    remainingItems,
    "PRINCIPAL",
    rules,
    1,
  );

  if (!replacement) {
    return items;
  }

  replacement.explanation = `${replacement.explanation} Se priorizó además para asegurar un plato que aguante bien la semana.`;

  return [...remainingItems, replacement];
}

function buildWarnings(items: GeneratedMenuItem[], rules: GeneratorRules) {
  const warnings: string[] = [];
  const mainItems = items.filter((item) => item.type === "PRINCIPAL");
  const baseCounts = new Map<string, number>();

  for (const item of mainItems) {
    const key = normalizeText(item.recipe.culinaryBase);
    baseCounts.set(key, (baseCounts.get(key) ?? 0) + 1);
  }

  for (const item of mainItems) {
    const count = baseCounts.get(normalizeText(item.recipe.culinaryBase)) ?? 0;

    if (count === rules.maxPerBase) {
      warnings.push(
        `La base "${item.recipe.culinaryBase}" aparece ${count} veces para ahorrar preparación sin pasar el límite.`,
      );
    }
  }

  for (let index = 0; index < mainItems.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < mainItems.length; nextIndex += 1) {
      if (areRecipesTooSimilar(mainItems[index].recipe, mainItems[nextIndex].recipe)) {
        warnings.push(
          `Revisa ${mainItems[index].recipe.name} y ${mainItems[nextIndex].recipe.name}: se parecen bastante.`,
        );
      }
    }
  }

  return Array.from(new Set(warnings));
}

export function parseExcludedIngredients(value: string) {
  return value
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

export function parseGeneratorRules(config: string | null | undefined) {
  if (!config) {
    return DEFAULT_RULES;
  }

  try {
    const parsed = JSON.parse(config);

    return {
      ...DEFAULT_RULES,
      ...parsed,
      scoring: {
        ...DEFAULT_RULES.scoring,
        ...(parsed.scoring ?? {}),
      },
    } satisfies GeneratorRules;
  } catch {
    return DEFAULT_RULES;
  }
}

export function getGeneratorDefaults(searchParams: Record<string, string | string[] | undefined>) {
  const hasExplicitFilters = Object.keys(searchParams).length > 0;
  const mainDishCount = Number(searchParams.mainDishCount ?? 5);
  const includeSalad = hasExplicitFilters
    ? searchParams.includeSalad === "true"
    : true;
  const includeCream = hasExplicitFilters
    ? searchParams.includeCream === "true"
    : true;
  const excludedRecipeIds = pickArray(searchParams.excludedRecipeIds);
  const excludedIngredientsText =
    typeof searchParams.excludedIngredients === "string" ? searchParams.excludedIngredients : "";

  return {
    mainDishCount: Number.isFinite(mainDishCount) ? Math.min(Math.max(mainDishCount, 3), 7) : 5,
    includeSalad,
    includeCream,
    excludedRecipeIds,
    excludedIngredientsText,
    excludedIngredients: parseExcludedIngredients(excludedIngredientsText),
  };
}

export function generateWeeklyMenu(
  recipes: RecipeForMenu[],
  options: GenerateWeeklyMenuOptions,
  rules: GeneratorRules,
): GeneratedWeeklyMenu {
  const excludedRecipeIds = new Set(options.excludedRecipeIds);
  const excludedIngredients = new Set(options.excludedIngredients.map(normalizeText));

  const availableRecipes = recipes.filter((recipe) => recipe.isAvailableThisWeek);
  const eligibleRecipes = availableRecipes.filter((recipe) => {
    if (excludedRecipeIds.has(recipe.id)) {
      return false;
    }

    return !recipe.recipeIngredients.some((item) =>
      excludedIngredients.has(normalizeText(item.ingredient.name)),
    );
  });

  const selectedItems: GeneratedMenuItem[] = [];
  const usedIds = new Set<string>();

  const addBestCandidate = (
    candidates: RecipeForMenu[],
    type: WeeklyMenuItemType,
    remainingMainSlots: number,
    mandatory = false,
  ) => {
    const filteredCandidates = candidates.filter((recipe) => !usedIds.has(recipe.id));
    const best = chooseBestRecipe(
      filteredCandidates,
      selectedItems,
      type,
      rules,
      remainingMainSlots,
      mandatory,
    );

    if (!best) {
      return;
    }

    usedIds.add(best.recipe.id);
    selectedItems.push(best);
  };

  if (options.includeSalad) {
    addBestCandidate(
      eligibleRecipes.filter((recipe) => recipe.category === RecipeCategory.ENSALADA),
      "ENSALADA",
      options.mainDishCount,
      true,
    );
  }

  if (options.includeCream) {
    addBestCandidate(
      eligibleRecipes.filter((recipe) => recipe.category === RecipeCategory.CREMA),
      "CREMA",
      options.mainDishCount,
      true,
    );
  }

  const mainCandidates = eligibleRecipes.filter(isMainRecipe);
  const fishCandidates = mainCandidates.filter(isFishRecipe);
  const shouldReserveFish = options.mainDishCount >= 5 && fishCandidates.length > 0;

  if (shouldReserveFish) {
    addBestCandidate(fishCandidates, "PRINCIPAL", options.mainDishCount, true);
  }

  while (selectedItems.filter((item) => item.type === "PRINCIPAL").length < options.mainDishCount) {
    const remainingMainSlots =
      options.mainDishCount - selectedItems.filter((item) => item.type === "PRINCIPAL").length;
    const remainingCandidates = mainCandidates.filter((recipe) => !usedIds.has(recipe.id));

    if (remainingCandidates.length === 0) {
      break;
    }

    addBestCandidate(remainingCandidates, "PRINCIPAL", remainingMainSlots);
  }

  const normalizedItems = ensureKeepWellRecipe(selectedItems, mainCandidates, rules).sort((a, b) => {
    const typeOrder: Record<WeeklyMenuItemType, number> = {
      PRINCIPAL: 0,
      ENSALADA: 1,
      CREMA: 2,
      ACOMPANAMIENTO: 3,
    };

    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }

    return b.score - a.score;
  });

  return {
    items: normalizedItems,
    warnings: buildWarnings(normalizedItems, rules),
    metadata: {
      totalEligibleRecipes: eligibleRecipes.length,
      excludedByRecipe:
        availableRecipes.length -
        availableRecipes.filter((recipe) => !excludedRecipeIds.has(recipe.id)).length,
      excludedByIngredient: availableRecipes.filter(
        (recipe) =>
          !excludedRecipeIds.has(recipe.id) &&
          recipe.recipeIngredients.some((item) =>
            excludedIngredients.has(normalizeText(item.ingredient.name)),
          ),
      ).length,
    },
  };
}

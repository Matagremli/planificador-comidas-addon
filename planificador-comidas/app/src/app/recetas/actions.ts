"use server";

import { Difficulty, PurchaseCategory, RecipeCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  normalizeCatalogCategory,
  purchaseCategoryOptions,
  splitMultilineText,
} from "@/lib/recipes";

const recipeCategorySet = new Set(Object.values(RecipeCategory));
const difficultySet = new Set(Object.values(Difficulty));
const purchaseCategorySet = new Set(purchaseCategoryOptions);

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readInteger(formData: FormData, key: string, fallback = 0) {
  const rawValue = readText(formData, key);
  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function parseTagsInput(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIngredientLine(line: string, index: number) {
  const [name, quantityRaw, unit, purchaseCategory] = line.split("|").map((item) => item.trim());

  if (!name || !quantityRaw || !unit || !purchaseCategory) {
    throw new Error(
      `Ingrediente ${index + 1}: usa el formato nombre | cantidad | unidad | categoria de compra.`,
    );
  }

  const quantity = Number.parseFloat(quantityRaw.replace(",", "."));

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`Ingrediente ${index + 1}: la cantidad debe ser un numero mayor que cero.`);
  }

  if (!purchaseCategorySet.has(purchaseCategory as PurchaseCategory)) {
    throw new Error(`Ingrediente ${index + 1}: categoria de compra no valida.`);
  }

  return {
    name,
    quantity,
    unit,
    purchaseCategory: purchaseCategory as PurchaseCategory,
  };
}

function parseRecipePayload(formData: FormData) {
  const recipeId = readText(formData, "recipeId");
  const name = readText(formData, "name");
  const shortDescription = readText(formData, "shortDescription");
  const category = readText(formData, "category");
  const catalogCategory = normalizeCatalogCategory(readText(formData, "catalogCategory"));
  const culinaryBase = readText(formData, "culinaryBase");
  const tags = parseTagsInput(readText(formData, "tags"));
  const servings = readInteger(formData, "servings");
  const estimatedMinutes = readInteger(formData, "estimatedMinutes");
  const difficulty = readText(formData, "difficulty");
  const fridgeDays = readInteger(formData, "fridgeDays");
  const notes = readText(formData, "notes");
  const steps = splitMultilineText(readText(formData, "steps"));
  const ingredientLines = splitMultilineText(readText(formData, "ingredients"));

  if (!recipeId) {
    throw new Error("Falta el identificador de la receta.");
  }

  if (!name || !shortDescription || !culinaryBase) {
    throw new Error("Nombre, descripcion y base culinaria son obligatorios.");
  }

  if (!recipeCategorySet.has(category as RecipeCategory)) {
    throw new Error("La categoria principal no es valida.");
  }

  if (!difficultySet.has(difficulty as Difficulty)) {
    throw new Error("La dificultad no es valida.");
  }

  if (servings <= 0 || estimatedMinutes <= 0 || fridgeDays < 0) {
    throw new Error("Raciones, tiempo y dias de nevera deben tener valores validos.");
  }

  if (ingredientLines.length === 0) {
    throw new Error("Debes indicar al menos un ingrediente.");
  }

  const ingredients = ingredientLines.map(parseIngredientLine);

  return {
    recipeId,
    name,
    shortDescription,
    category: category as RecipeCategory,
    catalogCategory,
    culinaryBase,
    tags,
    servings,
    estimatedMinutes,
    difficulty: difficulty as Difficulty,
    fridgeDays,
    notes,
    steps,
    ingredients,
  };
}

export async function updateRecipeAction(formData: FormData) {
  const payload = parseRecipePayload(formData);

  await prisma.$transaction(async (tx) => {
    const ingredientRecords: Array<{ id: string }> = [];

    for (const ingredient of payload.ingredients) {
      const ingredientRecord = await tx.ingredient.upsert({
        where: { name: ingredient.name },
        update: {
          purchaseCategory: ingredient.purchaseCategory,
          defaultUnit: ingredient.unit,
        },
        create: {
          name: ingredient.name,
          purchaseCategory: ingredient.purchaseCategory,
          defaultUnit: ingredient.unit,
        },
      });

      ingredientRecords.push(ingredientRecord);
    }

    await tx.recipe.update({
      where: { id: payload.recipeId },
      data: {
        name: payload.name,
        shortDescription: payload.shortDescription,
        category: payload.category,
        catalogCategory: payload.catalogCategory,
        culinaryBase: payload.culinaryBase,
        tags: payload.tags.join("|"),
        servings: payload.servings,
        estimatedMinutes: payload.estimatedMinutes,
        difficulty: payload.difficulty,
        fridgeDays: payload.fridgeDays,
        steps: payload.steps.join("\n"),
        notes: payload.notes,
      },
    });

    await tx.recipeIngredient.deleteMany({
      where: { recipeId: payload.recipeId },
    });

    await tx.recipeIngredient.createMany({
      data: payload.ingredients.map((ingredient, index) => ({
        recipeId: payload.recipeId,
        ingredientId: ingredientRecords[index].id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      })),
    });
  });

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${payload.recipeId}`);
  revalidatePath(`/recetas/${payload.recipeId}/editar`);
  redirect(`/recetas/${payload.recipeId}`);
}

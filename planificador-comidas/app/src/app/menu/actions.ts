"use server";

import { WeeklyMenuItemType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseDateInput, startOfWeek, weekName } from "@/lib/menu-calendar";

type SerializedMenuItem = {
  recipeId: string;
  type: WeeklyMenuItemType;
  explanation: string;
};

function parseBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "false") === "true";
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStringArray(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseItems(formData: FormData) {
  const values = formData.getAll("items");

  return values.map((value) => {
    const parsed = JSON.parse(String(value)) as SerializedMenuItem;
    return {
      recipeId: parsed.recipeId,
      type: parsed.type,
      explanation: parsed.explanation,
    };
  });
}

export async function saveWeeklyMenuAction(formData: FormData) {
  const weekStart = startOfWeek(parseDateInput(String(formData.get("weekStart") ?? "")));
  const items = parseItems(formData);

  if (items.length === 0) {
    throw new Error("No hay platos que guardar para esta semana.");
  }

  const defaultRuleSet = await prisma.ruleSet.findFirst({
    where: {
      isDefault: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    const existingMenus = await tx.weeklyMenu.findMany({
      where: {
        weekStart,
      },
      select: {
        id: true,
      },
    });

    if (existingMenus.length > 0) {
      await tx.weeklyMenu.deleteMany({
        where: {
          id: {
            in: existingMenus.map((menu) => menu.id),
          },
        },
      });
    }

    await tx.weeklyMenu.create({
      data: {
        name: weekName(weekStart),
        weekStart,
        servings: parseInteger(formData.get("servings"), 4),
        mainDishCount: parseInteger(formData.get("mainDishCount"), 5),
        includeSalad: parseBoolean(formData.get("includeSalad")),
        includeCream: parseBoolean(formData.get("includeCream")),
        excludedRecipeIds: JSON.stringify(parseStringArray(formData.get("excludedRecipeIds"))),
        excludedIngredientNames: JSON.stringify(
          parseStringArray(formData.get("excludedIngredients")),
        ),
        rulesetId: defaultRuleSet?.id,
        items: {
          create: items.map((item, index) => ({
            recipeId: item.recipeId,
            position: index,
            type: item.type,
            explanation: item.explanation,
          })),
        },
      },
    });
  });

  revalidatePath("/menu");
  revalidatePath("/menu/generar");
  redirect("/menu");
}

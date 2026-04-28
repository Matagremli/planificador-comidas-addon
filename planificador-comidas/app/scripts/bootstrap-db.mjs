import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const prismaDir = path.join(process.cwd(), "prisma");

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl?.startsWith("file:")) {
    const filePath = databaseUrl.slice("file:".length);

    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    // Prisma resolves SQLite relative paths from the schema directory.
    return path.resolve(prismaDir, filePath);
  }

  return path.join(prismaDir, "dev.db");
}

const databasePath = resolveDatabasePath();
const databaseDirectory = path.dirname(databasePath);

fs.mkdirSync(prismaDir, { recursive: true });
fs.mkdirSync(databaseDirectory, { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = OFF;

  DROP TABLE IF EXISTS "WeeklyMenuItem";
  DROP TABLE IF EXISTS "WeeklyMenu";
  DROP TABLE IF EXISTS "RecipeIngredient";
  DROP TABLE IF EXISTS "Recipe";
  DROP TABLE IF EXISTS "Ingredient";
  DROP TABLE IF EXISTS "RuleSet";

  PRAGMA foreign_keys = ON;

  CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "catalogCategory" TEXT NOT NULL DEFAULT 'otros',
    "culinaryBase" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "fridgeDays" INTEGER NOT NULL,
    "steps" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "isAvailableThisWeek" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");

  CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "purchaseCategory" TEXT NOT NULL,
    "defaultUnit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

  CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "RecipeIngredient_recipeId_fkey"
      FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_ingredientId_fkey"
      FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
  );

  CREATE UNIQUE INDEX "RecipeIngredient_recipeId_ingredientId_unit_key"
    ON "RecipeIngredient"("recipeId", "ingredientId", "unit");
  CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");
  CREATE INDEX "RecipeIngredient_ingredientId_idx" ON "RecipeIngredient"("ingredientId");

  CREATE TABLE "RuleSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDefault" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX "RuleSet_name_key" ON "RuleSet"("name");

  CREATE TABLE "WeeklyMenu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "servings" INTEGER NOT NULL,
    "mainDishCount" INTEGER NOT NULL,
    "includeSalad" INTEGER NOT NULL DEFAULT 1,
    "includeCream" INTEGER NOT NULL DEFAULT 1,
    "excludedRecipeIds" TEXT NOT NULL DEFAULT '[]',
    "excludedIngredientNames" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rulesetId" TEXT,
    CONSTRAINT "WeeklyMenu_rulesetId_fkey"
      FOREIGN KEY ("rulesetId") REFERENCES "RuleSet" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE TABLE "WeeklyMenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklyMenuId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "explanation" TEXT,
    CONSTRAINT "WeeklyMenuItem_weeklyMenuId_fkey"
      FOREIGN KEY ("weeklyMenuId") REFERENCES "WeeklyMenu" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WeeklyMenuItem_recipeId_fkey"
      FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
  );

  CREATE UNIQUE INDEX "WeeklyMenuItem_weeklyMenuId_position_key"
    ON "WeeklyMenuItem"("weeklyMenuId", "position");
  CREATE INDEX "WeeklyMenuItem_recipeId_idx" ON "WeeklyMenuItem"("recipeId");
`);

db.close();

console.log(`Base SQLite inicializada en ${databasePath}`);

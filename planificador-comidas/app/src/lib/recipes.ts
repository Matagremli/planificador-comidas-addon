import { Difficulty, PurchaseCategory, RecipeCategory } from "@prisma/client";

export const recipeCategoryLabels: Record<RecipeCategory, string> = {
  CARNE: "Carne",
  PESCADO: "Pescado",
  PASTA: "Pasta",
  ARROZ: "Arroz",
  LEGUMBRE: "Legumbre",
  CREMA: "Crema",
  ENSALADA: "Ensalada",
  ACOMPANAMIENTO: "Acompañamiento",
  HORNO: "Horno",
  RAPIDA: "Rápida",
  OTRO: "Otro",
};

export const difficultyLabels: Record<Difficulty, string> = {
  FACIL: "Fácil",
  MEDIA: "Media",
  DIFICIL: "Difícil",
};

export const purchaseCategoryLabels: Record<PurchaseCategory, string> = {
  VERDURA_FRUTA: "Verdura / fruta",
  CARNE: "Carne",
  PESCADO: "Pescado",
  LACTEOS: "Lácteos",
  HUEVOS: "Huevos",
  DESPENSA: "Despensa",
  CONGELADOS: "Congelados",
  ESPECIAS_SALSAS: "Especias / salsas",
  PANADERIA: "Panadería",
  OTROS: "Otros",
};

export const catalogCategoryOptions = [
  "vinagretas",
  "cremas",
  "carnes",
  "pescados",
  "pastas",
  "ensaladas",
  "guarniciones",
  "salsas",
  "postres",
  "otros",
] as const;

export type CatalogCategory = (typeof catalogCategoryOptions)[number];

export const catalogCategoryLabels: Record<CatalogCategory, string> = {
  vinagretas: "Vinagretas",
  cremas: "Cremas",
  carnes: "Carnes",
  pescados: "Pescados",
  pastas: "Pastas",
  ensaladas: "Ensaladas",
  guarniciones: "Guarniciones",
  salsas: "Salsas",
  postres: "Postres",
  otros: "Otros",
};

export const recipeCategoryOptions = Object.keys(recipeCategoryLabels) as RecipeCategory[];
export const difficultyOptions = Object.keys(difficultyLabels) as Difficulty[];
export const purchaseCategoryOptions = Object.keys(
  purchaseCategoryLabels,
) as PurchaseCategory[];

export function splitTags(tags: string) {
  return tags
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function normalizeCatalogCategory(value: string): CatalogCategory {
  const normalizedValue = value.trim().toLowerCase();

  if (catalogCategoryOptions.includes(normalizedValue as CatalogCategory)) {
    return normalizedValue as CatalogCategory;
  }

  return "otros";
}

export function getCatalogCategoryLabel(value: string) {
  const normalizedValue = normalizeCatalogCategory(value);
  return catalogCategoryLabels[normalizedValue];
}

export function splitMultilineText(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

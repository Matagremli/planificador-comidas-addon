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

export function splitTags(tags: string) {
  return tags
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

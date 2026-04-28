import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rulesConfig = {
  mainDishCount: 5,
  includeSalad: true,
  includeCreamWhenAvailable: true,
  maxPerBase: 2,
  maxMeatRecipes: 2,
  minKeepWellRecipes: 1,
  fishPreference: "prefiere_recetas_con_salsa",
  sideDishRule: "huevos_rellenos_maximo_cada_dos_semanas",
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

const recipes = [
  {
    name: "Albóndigas en salsa",
    shortDescription: "Clásico de carne picada con salsa suave, ideal para varios días.",
    category: "CARNE",
    culinaryBase: "carne picada",
    tags: ["aguanta bien", "batch cooking", "salsa", "tupper", "comida principal"],
    servings: 4,
    estimatedMinutes: 55,
    difficulty: "MEDIA",
    fridgeDays: 4,
    notes: "Congela muy bien y comparte base con lasaña o calabacines rellenos.",
    ingredients: [
      ["carne picada mixta", "CARNE", 600, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["ajo", "VERDURA_FRUTA", 2, "diente"],
      ["pan rallado", "DESPENSA", 50, "g"],
      ["huevo", "HUEVOS", 1, "unidad"],
      ["tomate triturado", "DESPENSA", 400, "g"],
      ["zanahoria", "VERDURA_FRUTA", 2, "unidad"],
    ],
  },
  {
    name: "Lasaña de carne",
    shortDescription: "Lasaña casera con relleno de carne picada y bechamel.",
    category: "HORNO",
    culinaryBase: "carne picada",
    tags: ["batch cooking", "aguanta bien", "congelable", "comida principal"],
    servings: 6,
    estimatedMinutes: 80,
    difficulty: "MEDIA",
    fridgeDays: 4,
    notes: "Evitar en la misma semana que calabacines rellenos si comparten relleno.",
    ingredients: [
      ["carne picada mixta", "CARNE", 500, "g"],
      ["placas de lasaña", "DESPENSA", 12, "unidad"],
      ["tomate triturado", "DESPENSA", 400, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["bechamel", "LACTEOS", 500, "ml"],
      ["queso rallado", "LACTEOS", 150, "g"],
    ],
  },
  {
    name: "Calabacines rellenos",
    shortDescription: "Calabacines al horno con relleno sabroso y gratinado.",
    category: "HORNO",
    culinaryBase: "carne picada",
    tags: ["aguanta bien", "batch cooking", "tupper", "comida principal"],
    servings: 4,
    estimatedMinutes: 65,
    difficulty: "MEDIA",
    fridgeDays: 3,
    notes: "Muy práctico para preparar el fin de semana.",
    ingredients: [
      ["calabacín", "VERDURA_FRUTA", 4, "unidad"],
      ["carne picada mixta", "CARNE", 400, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["tomate triturado", "DESPENSA", 250, "g"],
      ["queso rallado", "LACTEOS", 120, "g"],
    ],
  },
  {
    name: "Crema de calabaza",
    shortDescription: "Crema suave y ligera para acompañar o cenar.",
    category: "CREMA",
    culinaryBase: "verduras asadas",
    tags: ["ligero", "aguanta bien", "batch cooking", "cena rápida"],
    servings: 4,
    estimatedMinutes: 40,
    difficulty: "FACIL",
    fridgeDays: 4,
    notes: "Puede servirse con pipas o queso fresco.",
    ingredients: [
      ["calabaza", "VERDURA_FRUTA", 900, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["zanahoria", "VERDURA_FRUTA", 2, "unidad"],
      ["caldo de verduras", "DESPENSA", 800, "ml"],
      ["nata para cocinar", "LACTEOS", 100, "ml"],
    ],
  },
  {
    name: "Crema de verduras",
    shortDescription: "Fondo de verduras para aprovechar nevera y tener cenas listas.",
    category: "CREMA",
    culinaryBase: "verduras asadas",
    tags: ["ligero", "aguanta bien", "batch cooking", "tupper"],
    servings: 4,
    estimatedMinutes: 35,
    difficulty: "FACIL",
    fridgeDays: 4,
    notes: "Admite casi cualquier combinación de verduras.",
    ingredients: [
      ["puerro", "VERDURA_FRUTA", 1, "unidad"],
      ["patata", "VERDURA_FRUTA", 2, "unidad"],
      ["zanahoria", "VERDURA_FRUTA", 2, "unidad"],
      ["calabacín", "VERDURA_FRUTA", 1, "unidad"],
      ["caldo de verduras", "DESPENSA", 900, "ml"],
    ],
  },
  {
    name: "Ensalada de col",
    shortDescription: "Ensalada fresca que aguanta bien preparada con antelación.",
    category: "ENSALADA",
    culinaryBase: "verduras crudas",
    tags: ["ligero", "aguanta bien", "acompañamiento", "tupper"],
    servings: 4,
    estimatedMinutes: 15,
    difficulty: "FACIL",
    fridgeDays: 3,
    notes: "Mejora tras unas horas en frío.",
    ingredients: [
      ["col", "VERDURA_FRUTA", 0.5, "unidad"],
      ["zanahoria", "VERDURA_FRUTA", 2, "unidad"],
      ["yogur natural", "LACTEOS", 2, "unidad"],
      ["limón", "VERDURA_FRUTA", 1, "unidad"],
      ["mostaza", "ESPECIAS_SALSAS", 1, "cucharada"],
    ],
  },
  {
    name: "Ensalada de pasta",
    shortDescription: "Opción fría y completa para dejar lista en táper.",
    category: "ENSALADA",
    culinaryBase: "pasta",
    tags: ["tupper", "cena rápida", "comida principal"],
    servings: 4,
    estimatedMinutes: 20,
    difficulty: "FACIL",
    fridgeDays: 3,
    notes: "Mejor aliñar justo antes de comer si lleva hojas verdes.",
    ingredients: [
      ["pasta corta", "DESPENSA", 320, "g"],
      ["atún en conserva", "PESCADO", 2, "lata"],
      ["maíz", "DESPENSA", 150, "g"],
      ["tomate cherry", "VERDURA_FRUTA", 200, "g"],
      ["aceitunas", "DESPENSA", 80, "g"],
    ],
  },
  {
    name: "Fajitas de pollo",
    shortDescription: "Pollo especiado con verduras para una comida rápida.",
    category: "RAPIDA",
    culinaryBase: "pollo",
    tags: ["cena rápida", "comida principal", "tupper"],
    servings: 4,
    estimatedMinutes: 30,
    difficulty: "FACIL",
    fridgeDays: 3,
    notes: "Se puede dejar el relleno hecho y montar al momento.",
    ingredients: [
      ["pechuga de pollo", "CARNE", 500, "g"],
      ["pimiento rojo", "VERDURA_FRUTA", 1, "unidad"],
      ["pimiento verde", "VERDURA_FRUTA", 1, "unidad"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["tortillas de trigo", "PANADERIA", 8, "unidad"],
      ["mezcla de especias fajita", "ESPECIAS_SALSAS", 2, "cucharada"],
    ],
  },
  {
    name: "Estofado de ternera",
    shortDescription: "Guiso meloso que gana sabor de un día para otro.",
    category: "CARNE",
    culinaryBase: "guiso de carne",
    tags: ["aguanta bien", "batch cooking", "salsa", "tupper", "comida principal"],
    servings: 4,
    estimatedMinutes: 95,
    difficulty: "MEDIA",
    fridgeDays: 4,
    notes: "Perfecto para preparar en cantidad.",
    ingredients: [
      ["ternera para guisar", "CARNE", 700, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["zanahoria", "VERDURA_FRUTA", 3, "unidad"],
      ["patata", "VERDURA_FRUTA", 3, "unidad"],
      ["vino tinto", "DESPENSA", 150, "ml"],
      ["caldo de carne", "DESPENSA", 500, "ml"],
    ],
  },
  {
    name: "Merluza en salsa verde",
    shortDescription: "Pescado con salsa ligera pensado para aguantar mejor.",
    category: "PESCADO",
    culinaryBase: "pescado en salsa",
    tags: ["salsa", "aguanta bien", "comida principal"],
    servings: 4,
    estimatedMinutes: 35,
    difficulty: "MEDIA",
    fridgeDays: 2,
    notes: "Buena opción cuando toca incluir pescado en la semana.",
    ingredients: [
      ["merluza", "PESCADO", 700, "g"],
      ["ajo", "VERDURA_FRUTA", 3, "diente"],
      ["perejil", "VERDURA_FRUTA", 1, "manojo"],
      ["caldo de pescado", "DESPENSA", 350, "ml"],
      ["harina", "DESPENSA", 1, "cucharada"],
      ["guisantes", "CONGELADOS", 150, "g"],
    ],
  },
  {
    name: "Pollo al curry",
    shortDescription: "Pollo cremoso y especiado, fácil de recalentar.",
    category: "CARNE",
    culinaryBase: "pollo",
    tags: ["aguanta bien", "batch cooking", "salsa", "tupper", "comida principal"],
    servings: 4,
    estimatedMinutes: 40,
    difficulty: "FACIL",
    fridgeDays: 4,
    notes: "Comparte base con fajitas o arroz con pollo.",
    ingredients: [
      ["pechuga de pollo", "CARNE", 600, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["leche de coco", "DESPENSA", 400, "ml"],
      ["curry", "ESPECIAS_SALSAS", 2, "cucharada"],
      ["arroz basmati", "DESPENSA", 250, "g"],
    ],
  },
  {
    name: "Arroz con pollo",
    shortDescription: "Arroz completo para cocinar una vez y resolver varias comidas.",
    category: "ARROZ",
    culinaryBase: "pollo",
    tags: ["batch cooking", "tupper", "comida principal"],
    servings: 4,
    estimatedMinutes: 45,
    difficulty: "MEDIA",
    fridgeDays: 3,
    notes: "Se beneficia de compartir sofrito con otras recetas de pollo.",
    ingredients: [
      ["contramuslo de pollo", "CARNE", 500, "g"],
      ["arroz", "DESPENSA", 320, "g"],
      ["pimiento rojo", "VERDURA_FRUTA", 1, "unidad"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["tomate triturado", "DESPENSA", 150, "g"],
      ["caldo de pollo", "DESPENSA", 800, "ml"],
    ],
  },
  {
    name: "Lentejas",
    shortDescription: "Guiso de legumbre muy completo para cocinar a lo grande.",
    category: "LEGUMBRE",
    culinaryBase: "legumbre",
    tags: ["aguanta bien", "batch cooking", "tupper", "comida principal"],
    servings: 6,
    estimatedMinutes: 60,
    difficulty: "FACIL",
    fridgeDays: 4,
    notes: "Excelente para congelar en porciones.",
    ingredients: [
      ["lentejas", "DESPENSA", 500, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["zanahoria", "VERDURA_FRUTA", 2, "unidad"],
      ["pimiento verde", "VERDURA_FRUTA", 1, "unidad"],
      ["chorizo", "CARNE", 150, "g"],
      ["patata", "VERDURA_FRUTA", 2, "unidad"],
    ],
  },
  {
    name: "Huevos rellenos",
    shortDescription: "Acompañamiento fresco para completar el menú semanal.",
    category: "ACOMPANAMIENTO",
    culinaryBase: "huevo",
    tags: ["acompañamiento", "cena rápida", "tupper"],
    servings: 4,
    estimatedMinutes: 20,
    difficulty: "FACIL",
    fridgeDays: 2,
    notes: "Solo debe aparecer como acompañamiento y no más de una vez cada dos semanas.",
    ingredients: [
      ["huevo", "HUEVOS", 8, "unidad"],
      ["atún en conserva", "PESCADO", 2, "lata"],
      ["mayonesa", "ESPECIAS_SALSAS", 4, "cucharada"],
      ["pimiento piquillo", "DESPENSA", 4, "unidad"],
    ],
  },
  {
    name: "Pasta boloñesa",
    shortDescription: "Receta rápida y familiar con salsa de tomate y carne.",
    category: "PASTA",
    culinaryBase: "carne picada",
    tags: ["salsa", "tupper", "comida principal"],
    servings: 4,
    estimatedMinutes: 35,
    difficulty: "FACIL",
    fridgeDays: 3,
    notes: "Comparte base útil con albóndigas y lasaña.",
    ingredients: [
      ["pasta corta", "DESPENSA", 320, "g"],
      ["carne picada mixta", "CARNE", 400, "g"],
      ["tomate triturado", "DESPENSA", 350, "g"],
      ["cebolla", "VERDURA_FRUTA", 1, "unidad"],
      ["zanahoria", "VERDURA_FRUTA", 1, "unidad"],
      ["queso rallado", "LACTEOS", 80, "g"],
    ],
  },
];

async function main() {
  await prisma.weeklyMenuItem.deleteMany();
  await prisma.weeklyMenu.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.ruleSet.deleteMany();

  const ingredients = new Map();

  for (const recipe of recipes) {
    for (const [name, purchaseCategory, , unit] of recipe.ingredients) {
      if (!ingredients.has(name)) {
        const ingredient = await prisma.ingredient.create({
          data: {
            name,
            purchaseCategory,
            defaultUnit: unit,
          },
        });

        ingredients.set(name, ingredient);
      }
    }
  }

  for (const recipe of recipes) {
    await prisma.recipe.create({
      data: {
        name: recipe.name,
        shortDescription: recipe.shortDescription,
        category: recipe.category,
        culinaryBase: recipe.culinaryBase,
        tags: recipe.tags.join("|"),
        servings: recipe.servings,
        estimatedMinutes: recipe.estimatedMinutes,
        difficulty: recipe.difficulty,
        fridgeDays: recipe.fridgeDays,
        notes: recipe.notes,
        recipeIngredients: {
          create: recipe.ingredients.map(([name, , quantity, unit]) => ({
            quantity,
            unit,
            ingredient: {
              connect: {
                id: ingredients.get(name).id,
              },
            },
          })),
        },
      },
    });
  }

  await prisma.ruleSet.create({
    data: {
      name: "Reglas por defecto",
      isDefault: true,
      description:
        "Reglas iniciales para favorecer variedad, recetas que aguantan bien y bases compartidas.",
      config: JSON.stringify(rulesConfig),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

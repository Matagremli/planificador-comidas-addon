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

    return path.resolve(prismaDir, filePath);
  }

  return path.join(prismaDir, "dev.db");
}

function getRecipeColumns(db) {
  const columns = db.prepare(`PRAGMA table_info("Recipe")`).all();
  return new Set(columns.map((column) => column.name));
}

const databasePath = resolveDatabasePath();
const db = new DatabaseSync(databasePath);

const recipeColumns = getRecipeColumns(db);

if (recipeColumns.size === 0) {
  db.close();
  console.log(`Esquema SQLite pendiente de inicializar en ${databasePath}`);
  process.exit(0);
}

if (!recipeColumns.has("catalogCategory")) {
  db.exec(`ALTER TABLE "Recipe" ADD COLUMN "catalogCategory" TEXT NOT NULL DEFAULT 'otros';`);
}

if (!recipeColumns.has("steps")) {
  db.exec(`ALTER TABLE "Recipe" ADD COLUMN "steps" TEXT NOT NULL DEFAULT '';`);
}

db.close();

console.log(`Esquema SQLite verificado en ${databasePath}`);

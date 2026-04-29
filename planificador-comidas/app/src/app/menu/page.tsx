import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  buildMonthCalendar,
  getMonthNavigation,
  getMonthReference,
  monthLabel,
  toDateInputValue,
  toMonthInputValue,
  weekName,
} from "@/lib/menu-calendar";

export const dynamic = "force-dynamic";

type WeeklyMenuPageProps = {
  searchParams?: Promise<{
    mes?: string;
  }>;
};

function MealSlot({
  label,
  recipeName,
}: {
  label: string;
  recipeName: string | null;
}) {
  return (
    <div className="rounded-2xl border border-line/70 bg-white/70 px-3 py-2">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {recipeName ?? <span className="text-muted">Sin plan</span>}
      </p>
    </div>
  );
}

export default async function WeeklyMenuPage({ searchParams }: WeeklyMenuPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const referenceMonth = getMonthReference(resolvedSearchParams?.mes);
  const navigation = getMonthNavigation(referenceMonth);

  const monthStart = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), 1, 12);
  const monthEnd = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() + 1, 0, 12);

  const savedMenus = await prisma.weeklyMenu.findMany({
    where: {
      weekStart: {
        gte: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - 7, 12),
        lte: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + 7, 12),
      },
    },
    include: {
      items: {
        include: {
          recipe: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: {
      weekStart: "asc",
    },
  });

  const calendar = buildMonthCalendar(referenceMonth, savedMenus);
  const latestMenus = [...savedMenus].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime(),
  );

  return (
    <section className="space-y-6">
      <div className="card-surface rounded-[2.2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Vista semanal y mensual
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                Plan de comidas con calendario
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-muted">
                Aqui puedes ver el mes completo, revisar las semanas guardadas y abrir el generador
                para decidir cuantas comidas quieres programar.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/menu/generar?weekStart=${toDateInputValue(new Date())}`}
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(97,122,66,0.22)] hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              Generar nueva semana
            </Link>
            <div className="inline-flex items-center justify-center rounded-full border border-line bg-surface-strong px-5 py-3 text-sm font-bold text-muted">
              {savedMenus.length} semanas guardadas
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-6">
          <div className="card-surface rounded-[1.9rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-warm">
                  Mes visible
                </p>
                <h2 className="mt-2 text-2xl font-black text-foreground">
                  {monthLabel(referenceMonth)}
                </h2>
              </div>
              <form method="get">
                <input
                  type="month"
                  name="mes"
                  defaultValue={toMonthInputValue(referenceMonth)}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="ml-2 rounded-full border border-line bg-surface-strong px-4 py-3 text-sm font-extrabold text-foreground hover:border-accent"
                >
                  Ver
                </button>
              </form>
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href={`/menu?mes=${navigation.previous}`}
                className="rounded-full border border-line bg-surface-strong px-4 py-2 text-sm font-bold text-foreground hover:border-accent"
              >
                Mes anterior
              </Link>
              <Link
                href={`/menu?mes=${navigation.next}`}
                className="rounded-full border border-line bg-surface-strong px-4 py-2 text-sm font-bold text-foreground hover:border-accent"
              >
                Mes siguiente
              </Link>
            </div>
          </div>

          <div className="card-surface rounded-[1.9rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-warm">
                  Semanas guardadas
                </p>
                <h2 className="mt-2 text-2xl font-black text-foreground">Resumen rapido</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {latestMenus.length > 0 ? (
                latestMenus.slice(0, 6).map((menu) => (
                  <article
                    key={menu.id}
                    className="rounded-[1.4rem] border border-line bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-foreground">
                          {weekName(new Date(menu.weekStart))}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {menu.items.length} platos guardados · {menu.mainDishCount} principales
                        </p>
                      </div>
                      <Link
                        href={`/menu/generar?weekStart=${toDateInputValue(new Date(menu.weekStart))}&mainDishCount=${menu.mainDishCount}&includeSalad=${menu.includeSalad}&includeCream=${menu.includeCream}`}
                        className="rounded-full border border-line bg-surface-strong px-3 py-2 text-xs font-extrabold text-foreground hover:border-accent"
                      >
                        Reabrir
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Todavia no hay semanas guardadas. Genera una y guardala para verla en el
                  calendario.
                </p>
              )}
            </div>
          </div>
        </aside>

        <div className="card-surface rounded-[2rem] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-warm">
                Calendario mensual
              </p>
              <h2 className="mt-2 text-2xl font-black text-foreground">
                {monthLabel(referenceMonth)}
              </h2>
            </div>
            <div className="rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent-strong">
              Solo muestra desayuno/comida/cena si existen
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendar.dayNames.map((dayName) => (
              <div
                key={dayName}
                className="rounded-2xl border border-line bg-surface-strong px-3 py-3 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-muted"
              >
                {dayName}
              </div>
            ))}

            {calendar.weeks.flat().map((day) => {
              const isCurrentMonth = day.date.getMonth() === referenceMonth.getMonth();
              const dayDate = toDateInputValue(day.date);

              return (
                <div
                  key={dayDate}
                  className={`min-h-[15rem] rounded-[1.6rem] border p-3 ${
                    isCurrentMonth
                      ? "border-line bg-white/75"
                      : "border-line/60 bg-surface-strong/70 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-foreground">{day.date.getDate()}</p>
                    <Link
                      href={`/menu/generar?weekStart=${toDateInputValue(day.date)}`}
                      className="rounded-full border border-line bg-surface-strong px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-foreground hover:border-accent"
                    >
                      Abrir semana
                    </Link>
                  </div>

                  <div className="mt-3 space-y-2">
                    <MealSlot label="Desayuno" recipeName={day.desayuno?.recipe.name ?? null} />
                    <MealSlot label="Comida" recipeName={day.comida?.recipe.name ?? null} />
                    <MealSlot label="Cena" recipeName={day.cena?.recipe.name ?? null} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

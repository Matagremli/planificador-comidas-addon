import { Prisma, type WeeklyMenuItemType } from "@prisma/client";

export type WeeklyMenuWithRecipes = Prisma.WeeklyMenuGetPayload<{
  include: {
    items: {
      include: {
        recipe: true;
      };
      orderBy: {
        position: "asc";
      };
    };
  };
}>;

export type CalendarMealSlot = "desayuno" | "comida" | "cena";

export type PlannedDay = {
  date: Date;
  desayuno: WeeklyMenuWithRecipes["items"][number] | null;
  comida: WeeklyMenuWithRecipes["items"][number] | null;
  cena: WeeklyMenuWithRecipes["items"][number] | null;
  weeklyMenuId: string | null;
};

const DAY_NAMES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function normalizeToMidday(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

export function addDays(date: Date, days: number) {
  const nextDate = normalizeToMidday(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function startOfWeek(date: Date) {
  const normalizedDate = normalizeToMidday(date);
  const day = normalizedDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(normalizedDate, diff);
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string | undefined) {
  if (!value) {
    return startOfWeek(new Date());
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return startOfWeek(new Date());
  }

  return normalizeToMidday(parsedDate);
}

export function monthLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function getMonthReference(searchValue: string | undefined) {
  if (!searchValue) {
    return normalizeToMidday(new Date());
  }

  const parsedDate = new Date(`${searchValue}-01T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return normalizeToMidday(new Date());
  }

  return normalizeToMidday(parsedDate);
}

export function toMonthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthNavigation(date: Date) {
  return {
    previous: toMonthInputValue(new Date(date.getFullYear(), date.getMonth() - 1, 1, 12)),
    next: toMonthInputValue(new Date(date.getFullYear(), date.getMonth() + 1, 1, 12)),
  };
}

function emptyPlannedDay(date: Date): PlannedDay {
  return {
    date,
    desayuno: null,
    comida: null,
    cena: null,
    weeklyMenuId: null,
  };
}

function assignSlot(day: PlannedDay, slot: CalendarMealSlot, item: WeeklyMenuWithRecipes["items"][number]) {
  if (slot === "desayuno") day.desayuno = item;
  if (slot === "comida") day.comida = item;
  if (slot === "cena") day.cena = item;
}

function mapItemTypeToPreferredSlot(type: WeeklyMenuItemType): CalendarMealSlot {
  if (type === "PRINCIPAL") return "comida";
  return "cena";
}

export function buildPlannedWeek(menu: WeeklyMenuWithRecipes) {
  const weekStart = normalizeToMidday(new Date(menu.weekStart));
  const days = Array.from({ length: 7 }, (_, index) => emptyPlannedDay(addDays(weekStart, index)));
  const dinnerCursor = { index: 0 };

  const primaryItems = menu.items.filter((item) => item.type === "PRINCIPAL");
  const secondaryItems = menu.items.filter((item) => item.type !== "PRINCIPAL");

  primaryItems.forEach((item, index) => {
    const day = days[Math.min(index, 6)];
    day.weeklyMenuId = menu.id;
    assignSlot(day, "comida", item);
  });

  secondaryItems.forEach((item) => {
    while (dinnerCursor.index < days.length && days[dinnerCursor.index].cena) {
      dinnerCursor.index += 1;
    }

    const targetIndex = dinnerCursor.index < days.length ? dinnerCursor.index : days.length - 1;
    const day = days[targetIndex];
    day.weeklyMenuId = menu.id;
    assignSlot(day, mapItemTypeToPreferredSlot(item.type), item);
    dinnerCursor.index = targetIndex + 1;
  });

  return days;
}

export function buildMonthCalendar(referenceDate: Date, menus: WeeklyMenuWithRecipes[]) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 12);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 12);
  const gridStart = startOfWeek(monthStart);
  const lastGridDay = addDays(monthEnd, monthEnd.getDay() === 0 ? 0 : 7 - monthEnd.getDay());
  const menuDays = new Map<string, PlannedDay>();

  for (const menu of menus) {
    for (const day of buildPlannedWeek(menu)) {
      menuDays.set(toDateInputValue(day.date), day);
    }
  }

  const weeks: PlannedDay[][] = [];
  let current = gridStart;

  while (current <= lastGridDay) {
    const week: PlannedDay[] = [];

    for (let index = 0; index < 7; index += 1) {
      const key = toDateInputValue(current);
      week.push(menuDays.get(key) ?? emptyPlannedDay(current));
      current = addDays(current, 1);
    }

    weeks.push(week);
  }

  return {
    dayNames: DAY_NAMES,
    weeks,
    monthStart,
    monthEnd,
  };
}

export function weekName(date: Date) {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  return `Semana del ${weekStart.getDate()}/${weekStart.getMonth() + 1} al ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
}

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

function cmp(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a);
  const sb = String(b);
  // ISO date strings (YYYY-MM-DD...) sort lexicographically
  if (/^\d{4}-\d{2}-\d{2}/.test(sa) && /^\d{4}-\d{2}-\d{2}/.test(sb)) {
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  }
  // Natural sort: handles numeric codes like "PLT-0001" < "PLT-0002" and coerced numbers
  return sa.localeCompare(sb, "es", { sensitivity: "base", numeric: true });
}

export function useSortable<T extends object>(items: T[]) {
  const [col, setCol] = useState<string | null>(null);
  const [dir, setDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!col) return items;
    return [...items].sort((a, b) => {
      const row = a as Record<string, unknown>;
      const rowB = b as Record<string, unknown>;
      const result = cmp(row[col], rowB[col]);
      return dir === "asc" ? result : -result;
    });
  }, [items, col, dir]);

  function toggle(key: string) {
    if (col === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setCol(key); setDir("asc"); }
  }

  return { sorted, col, dir, toggle };
}

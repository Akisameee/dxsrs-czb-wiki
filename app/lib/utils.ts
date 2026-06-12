import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function enumMapFromRows(rows: Array<{ type: string, id: number | string, label: string | null }>) {
  const enums: Record<string, Record<string, string | null>> = {}
  for (const row of rows) {
    const group = enums[row.type] ?? {}
    group[String(row.id)] = row.label
    enums[row.type] = group
  }
  return enums
}

export function groupBy<T extends Record<string, any>>(rows: T[], key: keyof T) {
  const groups = new Map<T[keyof T], T[]>()
  for (const row of rows) {
    const value = row[key]
    groups.set(value, [...(groups.get(value) || []), row])
  }
  return groups
}

export function enumLabel(
  enums: Record<string, Record<string, string | null>> | null | undefined,
  type: string,
  id: number | string | null | undefined,
  fallback = "未知",
) {
  if (id === null || id === undefined || Number.isNaN(Number(id))) return fallback
  return enums?.[type]?.[String(id)] ?? fallback
}

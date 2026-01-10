export const LEVELS = ['beginner', 'intermediate', 'expert'] as const
export type Level = typeof LEVELS[number]

export const SIZE_MAP: Record<Level, { cols: number; rows: number }> = {
  beginner: { cols: 5, rows: 4 },
  intermediate: { cols: 6, rows: 5 },
  expert: { cols: 8, rows: 5 },
}

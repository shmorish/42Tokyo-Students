import type { Student } from '../types'

export interface StudentGroup {
  key: string
  label: string
  students: Student[]
  levelMax: number
  levelAvg: number
}

function getYearMonthKey(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getYearMonthLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${year}年${Number(month)}月`
}

function computeGroupStats(students: Student[]): { levelMax: number; levelAvg: number } {
  if (students.length === 0) return { levelMax: 0, levelAvg: 0 }
  const levels = students.map(s => s.level)
  const levelMax = Math.max(...levels)
  const levelAvg = levels.reduce((sum, l) => sum + l, 0) / levels.length
  return { levelMax, levelAvg }
}

export function filterStudentsByName(students: Student[], query: string): Student[] {
  const trimmed = query.trim()
  if (!trimmed) return students
  const q = trimmed.toLowerCase()
  return students.filter(s => s.name.toLowerCase().includes(q))
}

export function groupStudentsByYearMonth(
  students: Student[],
  groupSortDir: 'asc' | 'desc',
  levelSortDir: 'asc' | 'desc' | null
): StudentGroup[] {
  const groupMap = students.reduce<Record<string, Student[]>>((acc, student) => {
    const key = getYearMonthKey(student.commonCoreStartedAt)
    return { ...acc, [key]: [...(acc[key] ?? []), student] }
  }, {})

  const sortedKeys = Object.keys(groupMap).sort((a, b) =>
    groupSortDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  )

  return sortedKeys.map(key => {
    const raw = groupMap[key]
    const sorted = levelSortDir
      ? [...raw].sort((a, b) =>
          levelSortDir === 'asc' ? a.level - b.level : b.level - a.level
        )
      : raw

    return {
      key,
      label: getYearMonthLabel(key),
      students: sorted,
      ...computeGroupStats(raw),
    }
  })
}

export function sortStudents(
  students: Student[],
  levelSortDir: 'asc' | 'desc' | null
): Student[] {
  if (!levelSortDir) return students
  return [...students].sort((a, b) =>
    levelSortDir === 'asc' ? a.level - b.level : b.level - a.level
  )
}

export function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatLevel(level: number): string {
  return level.toFixed(2)
}

const STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  bh: 'Black Hole',
  alumni: 'Alumni',
  finished: 'Finished',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

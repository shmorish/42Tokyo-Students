export interface Student {
  id: string
  name: string
  cohort: string
  status: 'running' | 'bh' | string
  curriculum: string
  progress: number
  circle: number
  circleLabel: string
  level: number
  commonCoreStartedAt: string
  seed: number
  blackholedAt?: string
  endedAt?: string
  daysToBlackhole?: number
  lastValidatedProject?: string
  currentProject?: string
  currentProjectStatus?: string
}

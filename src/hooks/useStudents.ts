import { useState, useEffect } from 'react'
import type { Student } from '../types'

const API_URL = 'https://common-core-hitchhikers.vercel.app/data/students.json'

interface UseStudentsResult {
  students: Student[]
  loading: boolean
  error: string | null
}

export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchStudents() {
      try {
        const response = await fetch(API_URL, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const json = await response.json()
        const data: Student[] = Array.isArray(json) ? json : (json.students ?? [])
        setStudents(data)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('データの取得に失敗しました')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
    return () => controller.abort()
  }, [])

  return { students, loading, error }
}

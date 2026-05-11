import type { Student } from '../types'
import { formatLevel, getStatusLabel, formatStartDate } from '../utils/students'

interface StudentRowProps {
  student: Student
  rank: number
  showStartDate?: boolean
}

export function StudentRow({ student, rank, showStartDate }: StudentRowProps) {
  const project = student.currentProject ?? student.lastValidatedProject ?? '—'

  return (
    <tr className="student-row">
      <td className="col-rank">{rank}</td>
      <td className="col-name">
        <a
          href={`https://profile.intra.42.fr/users/${student.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="student-link"
        >
          {student.name}
        </a>
      </td>
      <td className="col-level">{formatLevel(student.level)}</td>
      <td className="col-status">
        <span className={`status-badge status-${student.status}`}>
          {getStatusLabel(student.status)}
        </span>
      </td>
      <td className="col-circle">{student.circleLabel}</td>
      <td className="col-project">{project}</td>
      {showStartDate && (
        <td className="col-start-date">{formatStartDate(student.commonCoreStartedAt)}</td>
      )}
    </tr>
  )
}

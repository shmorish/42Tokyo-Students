import type { StudentGroup } from '../utils/students'
import { formatLevel } from '../utils/students'
import { StudentRow } from './StudentRow'

interface CohortGroupProps {
  group: StudentGroup
  isHidden: boolean
  onToggle: () => void
}

export function CohortGroup({ group, isHidden, onToggle }: CohortGroupProps) {
  return (
    <section className="cohort-group">
      <button
        type="button"
        className="cohort-header"
        onClick={onToggle}
        aria-expanded={!isHidden}
      >
        <div className="cohort-header-left">
          <span className="cohort-toggle-icon">{isHidden ? '▶' : '▼'}</span>
          <span className="cohort-label">{group.label}</span>
          <span className="cohort-count">{group.students.length} 人</span>
        </div>
        <div className="cohort-stats">
          <span className="cohort-stat">
            最高 <strong>{formatLevel(group.levelMax)}</strong>
          </span>
          <span className="cohort-stat">
            平均 <strong>{formatLevel(group.levelAvg)}</strong>
          </span>
        </div>
      </button>

      {!isHidden && (
        <div className="cohort-body">
          <table className="students-table">
            <thead>
              <tr>
                <th className="col-rank">#</th>
                <th className="col-name">名前</th>
                <th className="col-level">Level</th>
                <th className="col-status">ステータス</th>
                <th className="col-circle">Circle</th>
                <th className="col-project">プロジェクト</th>
              </tr>
            </thead>
            <tbody>
              {group.students.map((student, index) => (
                <StudentRow key={student.id} student={student} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

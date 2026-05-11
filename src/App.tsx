import { useState } from 'react'
import { useStudents } from './hooks/useStudents'
import { SearchBar } from './components/SearchBar'
import { SortControls } from './components/SortControls'
import { CohortGroup } from './components/CohortGroup'
import { StudentRow } from './components/StudentRow'
import {
  filterStudentsByName,
  groupStudentsByYearMonth,
  sortStudents,
} from './utils/students'
import './App.css'

function App() {
  const { students, loading, error } = useStudents()
  const [searchQuery, setSearchQuery] = useState('')
  const [isGrouped, setIsGrouped] = useState(true)
  const [groupSortDir, setGroupSortDir] = useState<'asc' | 'desc'>('desc')
  const [levelSortDir, setLevelSortDir] = useState<'asc' | 'desc' | null>(null)
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set())

  const filtered = filterStudentsByName(students, searchQuery)
  const filteredCount = filtered.length

  const groups = isGrouped
    ? groupStudentsByYearMonth(filtered, groupSortDir, levelSortDir)
    : []
  const flatStudents = isGrouped ? [] : sortStudents(filtered, levelSortDir)

  function toggleGroup(key: string) {
    setHiddenGroups(prev =>
      prev.has(key)
        ? new Set([...prev].filter(k => k !== key))
        : new Set([...prev, key])
    )
  }

  function toggleAll(hide: boolean) {
    setHiddenGroups(hide ? new Set(groups.map(g => g.key)) : new Set())
  }

  if (loading) {
    return (
      <div className="app-state">
        <div className="spinner" />
        <p>読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-state app-error">
        <p>{error}</p>
      </div>
    )
  }

  const allHidden = groups.length > 0 && groups.every(g => hiddenGroups.has(g.key))

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">42 Tokyo Students</h1>
        <p className="app-subtitle">{students.length.toLocaleString()} students</p>
      </header>

      <div className="controls">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          totalCount={students.length}
          filteredCount={filteredCount}
        />
        <SortControls
          isGrouped={isGrouped}
          onGroupedChange={setIsGrouped}
          groupSortDir={groupSortDir}
          onGroupSortChange={setGroupSortDir}
          levelSortDir={levelSortDir}
          onLevelSortChange={setLevelSortDir}
        />
        {isGrouped && (
          <div className="bulk-toggle">
            <button
              type="button"
              className="sort-btn"
              onClick={() => toggleAll(allHidden ? false : true)}
            >
              {allHidden ? 'すべて展開' : 'すべて折り畳む'}
            </button>
          </div>
        )}
      </div>

      <main className="groups-container">
        {filtered.length === 0 && (
          <div className="no-results">該当する学生が見つかりませんでした</div>
        )}

        {isGrouped && groups.map(group => (
          <CohortGroup
            key={group.key}
            group={group}
            isHidden={hiddenGroups.has(group.key)}
            onToggle={() => toggleGroup(group.key)}
          />
        ))}

        {!isGrouped && flatStudents.length > 0 && (
          <div className="cohort-group">
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
                    <th className="col-start-date">開始年月</th>
                  </tr>
                </thead>
                <tbody>
                  {flatStudents.map((student, index) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      rank={index + 1}
                      showStartDate
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

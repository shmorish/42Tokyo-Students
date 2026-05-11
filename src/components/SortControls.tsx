interface SortControlsProps {
  isGrouped: boolean
  onGroupedChange: (v: boolean) => void
  groupSortDir: 'asc' | 'desc'
  onGroupSortChange: (dir: 'asc' | 'desc') => void
  levelSortDir: 'asc' | 'desc' | null
  onLevelSortChange: (dir: 'asc' | 'desc' | null) => void
}

export function SortControls({
  isGrouped,
  onGroupedChange,
  groupSortDir,
  onGroupSortChange,
  levelSortDir,
  onLevelSortChange,
}: SortControlsProps) {
  function cycleLevelSort() {
    if (levelSortDir === null) onLevelSortChange('desc')
    else if (levelSortDir === 'desc') onLevelSortChange('asc')
    else onLevelSortChange(null)
  }

  const levelLabel =
    levelSortDir === 'desc' ? 'Level ↓ 高い順' :
    levelSortDir === 'asc'  ? 'Level ↑ 低い順' :
    'Level (未設定)'

  return (
    <div className="sort-controls">
      <div className="sort-group">
        <span className="sort-label">表示</span>
        <div className="sort-buttons">
          <button
            type="button"
            className={`sort-btn${isGrouped ? ' active' : ''}`}
            onClick={() => onGroupedChange(true)}
          >
            年月でグループ
          </button>
          <button
            type="button"
            className={`sort-btn${!isGrouped ? ' active' : ''}`}
            onClick={() => onGroupedChange(false)}
          >
            フラット
          </button>
        </div>
      </div>

      {isGrouped && (
        <div className="sort-group">
          <span className="sort-label">年月順</span>
          <div className="sort-buttons">
            <button
              type="button"
              className={`sort-btn${groupSortDir === 'desc' ? ' active' : ''}`}
              onClick={() => onGroupSortChange('desc')}
            >
              新しい順
            </button>
            <button
              type="button"
              className={`sort-btn${groupSortDir === 'asc' ? ' active' : ''}`}
              onClick={() => onGroupSortChange('asc')}
            >
              古い順
            </button>
          </div>
        </div>
      )}

      <div className="sort-group">
        <span className="sort-label">{isGrouped ? 'グループ内' : 'ソート'}</span>
        <button
          type="button"
          className={`sort-btn${levelSortDir !== null ? ' active' : ''}`}
          onClick={cycleLevelSort}
        >
          {levelLabel}
        </button>
      </div>
    </div>
  )
}

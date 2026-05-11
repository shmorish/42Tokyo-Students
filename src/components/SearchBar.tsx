interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  totalCount: number
  filteredCount: number
}

export function SearchBar({ value, onChange, totalCount, filteredCount }: SearchBarProps) {
  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          className="search-input"
          placeholder="名前で検索..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      {value.trim() && (
        <span className="search-count">
          {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} 件
        </span>
      )}
    </div>
  )
}

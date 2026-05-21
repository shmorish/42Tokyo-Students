import RankingTable from './components/RankingTable'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>42Tokyo Level Ranking</h1>
        <p className="subtitle">42cursus students sorted by level</p>
      </header>
      <main>
        <RankingTable />
      </main>
    </div>
  )
}

import Chip from './Chip';

function ResultsPanel({ results, score, expandedIndex, onToggleChip }) {
  return (
    <div className="results">
      <div className="score-row">
        <h2>Results — tap a chip for details</h2>
        {score !== null && (
          <span className={`score-badge ${score >= 70 ? 'good' : score >= 40 ? 'mid' : 'low'}`}>
            {score}% compatible
          </span>
        )}
      </div>
      <div className="chip-grid">
        {results.map((r, i) => (
          <Chip
            key={i}
            result={r}
            index={i}
            isExpanded={expandedIndex === i}
            onToggle={(idx) => onToggleChip(expandedIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  );
}

export default ResultsPanel;
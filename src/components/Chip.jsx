function Chip({ result, index, isExpanded, onToggle }) {
  const icon = result.status === 'flagged' ? '⚠️' : result.status === 'uncertain' ? '❔' : '✅';
  const clickable = result.status === 'flagged' || result.status === 'uncertain';

  return (
    <div
      className={`chip ${result.status} ${isExpanded ? 'expanded' : ''}`}
      style={{ animationDelay: `${index * 70}ms` }}
      onClick={() => clickable && onToggle(index)}
    >
      <div className="chip-main">
        <span className="icon">{icon}</span>
        <span className="ingredient-name">{result.ingredient}</span>
      </div>
      {clickable && isExpanded && (
        <div className="chip-detail">
          {result.status === 'flagged' ? 'matches known irritant' : 'possible partial match to'}{' '}
          <strong>{result.matchedTo}</strong> · confidence {result.confidence}
          {result.alternative && (
            <div className="alt-suggestion">💡 Try instead: {result.alternative}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Chip;
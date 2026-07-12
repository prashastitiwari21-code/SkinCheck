function SkinToggle({ profiles, activeType, onSelect }) {
  return (
    <div className="skin-toggle">
      {Object.entries(profiles).map(([key, profile]) => (
        <button
          key={key}
          type="button"
          className={`toggle-btn ${activeType === key ? 'active' : ''}`}
          onClick={() => onSelect(key)}
        >
          {profile.label}
        </button>
      ))}
    </div>
  );
}

export default SkinToggle;
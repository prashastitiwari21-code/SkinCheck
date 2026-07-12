function IngredientForm({ inputText, onChange, onSubmit, loading, modelReady }) {
  return (
    <>
      <textarea
        value={inputText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Water, Glycerin, Parfum, Coconut Oil, Niacinamide"
        rows={5}
      />

      <button onClick={onSubmit} disabled={loading}>
        {loading ? 'Checking...' : 'Check Ingredients'}
      </button>

      <p className="disclaimer">
        Informational tool only — not medical advice. Everyone's skin reacts differently; consult a dermatologist for persistent concerns.
      </p>

      {loading && !modelReady && (
        <p className="status-text">Loading AI model for the first time, this may take 10-20 seconds...</p>
      )}
    </>
  );
}

export default IngredientForm;
import { useState, useRef } from 'react';
import { pipeline, cos_sim } from '@huggingface/transformers';
import './App.css';
import Header from './components/Header';
import SkinToggle from './components/SkinToggle';
import IngredientForm from './components/IngredientForm';
import ResultsPanel from './components/ResultsPanel';

// Curated list of ingredients commonly flagged as comedogenic/irritating
// for acne-prone skin. Sourced from dermatology literature (Fulton
// comedogenicity ratings, CosIng, clinical studies). Rating 3+ ingredients
// included. This is an informational tool, not medical advice.
const ACNE_LIST = [
  "fragrance",
  "parfum",
  "d&c red dyes",
  "lanolin",
  "acetylated lanolin",
  "acetylated lanolin alcohol",
  "peg-16 lanolin",
  "ethoxylated lanolin",
  "isopropyl myristate",
  "isopropyl palmitate",
  "isopropyl isostearate",
  "myristyl myristate",
  "butyl stearate",
  "stearic acid",
  "lauric acid",
  "myristic acid",
  "oleic acid",
  "decyl oleate",
  "coconut oil",
  "coconut butter",
  "cocoa butter",
  "wheat germ oil",
  "algae extract",
  "hexadecyl alcohol",
  "oleyl alcohol",
  "denatured alcohol",
  "sodium lauryl sulfate",
  "sodium laureth sulfate",
  "isopropyl linoleate",
  "glyceryl stearate"
];

// Curated list of ingredients that commonly irritate or dry out
// sensitive skin — a different concern than pore-clogging. Sourced
// from dermatology-reviewed skincare guides. This is an informational
// tool, not medical advice.
const SENSITIVE_LIST = [
  "fragrance",
  "parfum",
  "essential oil",
  "lavender oil",
  "tea tree oil",
  "peppermint oil",
  "citrus oil",
  "bergamot oil",
  "limonene",
  "linalool",
  "geraniol",
  "hexyl cinnamal",
  "denatured alcohol",
  "sd alcohol",
  "isopropyl alcohol",
  "ethanol",
  "witch hazel",
  "sodium lauryl sulfate",
  "sodium laureth sulfate",
  "glycolic acid",
  "salicylic acid",
  "menthol",
  "camphor"
];

// Ingredients that strip moisture or worsen dryness — relevant for
// dry/dehydrated skin. Different mechanism than comedogenicity.
const DRY_LIST = [
  "denatured alcohol",
  "sd alcohol",
  "isopropyl alcohol",
  "ethanol",
  "sodium lauryl sulfate",
  "sodium laureth sulfate",
  "fragrance",
  "parfum",
  "salicylic acid",
  "benzoyl peroxide",
  "sodium chloride",
  "witch hazel"
];

// Heavy, occlusive, or comedogenic ingredients that feel too rich and
// contribute to congestion for oily/combination skin.
const OILY_LIST = [
  "coconut oil",
  "cocoa butter",
  "shea butter",
  "wheat germ oil",
  "lanolin",
  "acetylated lanolin alcohol",
  "petrolatum",
  "mineral oil",
  "paraffin oil",
  "paraffinum liquidum",
  "beeswax",
  "isopropyl myristate",
  "isopropyl palmitate",
  "algae extract",
  "carrageenan"
];

// Harsh, stripping, or barrier-damaging ingredients that are extra
// risky for mature skin, which is thinner and slower to repair itself.
const AGING_LIST = [
  "denatured alcohol",
  "sd alcohol",
  "fragrance",
  "parfum",
  "sodium lauryl sulfate",
  "sodium laureth sulfate",
  "witch hazel",
  "menthol",
  "camphor",
  "walnut shell powder",
  "microbeads"
];

const SKIN_PROFILES = {
  acne: { label: "Acne-prone", list: ACNE_LIST },
  sensitive: { label: "Sensitive", list: SENSITIVE_LIST },
  dry: { label: "Dry", list: DRY_LIST },
  oily: { label: "Oily", list: OILY_LIST },
  aging: { label: "Aging", list: AGING_LIST }
};

// Suggested gentler/non-comedogenic alternatives for commonly flagged
// ingredients. Not exhaustive — covers the most frequently flagged ones
// across all profiles. Sourced from dermatology-reviewed guides.
const ALTERNATIVES = {
  "fragrance": "fragrance-free formulations",
  "parfum": "fragrance-free formulations",
  "coconut oil": "squalane or jojoba oil",
  "cocoa butter": "shea butter (lighter) or squalane",
  "shea butter": "squalane or grapeseed oil",
  "lanolin": "ceramides or hyaluronic acid",
  "acetylated lanolin": "ceramides or hyaluronic acid",
  "acetylated lanolin alcohol": "ceramides or hyaluronic acid",
  "wheat germ oil": "rosehip oil or grapeseed oil",
  "isopropyl myristate": "squalane or dimethicone",
  "isopropyl palmitate": "squalane or dimethicone",
  "myristyl myristate": "jojoba oil",
  "denatured alcohol": "glycerin-based hydrating formulas",
  "sd alcohol": "glycerin-based hydrating formulas",
  "isopropyl alcohol": "glycerin-based hydrating formulas",
  "ethanol": "glycerin-based hydrating formulas",
  "sodium lauryl sulfate": "a sulfate-free cleanser",
  "sodium laureth sulfate": "a sulfate-free cleanser",
  "essential oil": "unscented or plant-extract-free formulas",
  "tea tree oil": "niacinamide (calms without irritation)",
  "witch hazel": "a fragrance-free, alcohol-free toner",
  "petrolatum": "squalane (lighter occlusive)",
  "mineral oil": "squalane (lighter occlusive)",
  "paraffin oil": "squalane (lighter occlusive)",
  "beeswax": "plant-based waxes like candelilla",
  "benzoyl peroxide": "azelaic acid (gentler option)",
  "salicylic acid": "PHA (polyhydroxy acid) for gentler exfoliation",
  "glycolic acid": "lactic acid or PHA (gentler acids)"
};

const SIMILARITY_THRESHOLD = 0.6;
const UNCERTAIN_THRESHOLD = 0.45;

function App() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [skinType, setSkinType] = useState('acne');
  const [score, setScore] = useState(null);

  const extractorRef = useRef(null);
  const irritantEmbeddingsCache = useRef({});

  async function loadModel() {
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    extractorRef.current = extractor;
    setModelReady(true);
  }

  async function getIrritantEmbeddings(profileKey) {
    if (irritantEmbeddingsCache.current[profileKey]) {
      return irritantEmbeddingsCache.current[profileKey];
    }

    const extractor = extractorRef.current;
    const list = SKIN_PROFILES[profileKey].list;
    const embeddings = [];

    for (const irritant of list) {
      const embedding = await extractor(irritant, { pooling: 'mean', normalize: true });
      embeddings.push({ name: irritant, embedding: embedding.data });
    }

    irritantEmbeddingsCache.current[profileKey] = embeddings;
    return embeddings;
  }

  async function checkIngredients(rawText, profileKey) {
    const extractor = extractorRef.current;
    const irritantEmbeddings = await getIrritantEmbeddings(profileKey);

    const ingredients = rawText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const output = [];

    for (const ingredient of ingredients) {
      const embedding = await extractor(ingredient, { pooling: 'mean', normalize: true });

      let bestMatch = null;
      let bestMatchScore = 0;

      for (const irritant of irritantEmbeddings) {
        const simScore = cos_sim(embedding.data, irritant.embedding);
        if (simScore > bestMatchScore) {
          bestMatchScore = simScore;
          bestMatch = irritant.name;
        }
      }

      const flagged = bestMatchScore >= SIMILARITY_THRESHOLD;
      const uncertain = !flagged && bestMatchScore >= UNCERTAIN_THRESHOLD;

      let status;
      if (flagged) status = 'flagged';
      else if (uncertain) status = 'uncertain';
      else status = 'safe';

      output.push({
        ingredient,
        status,
        matchedTo: (flagged || uncertain) ? bestMatch : null,
        confidence: bestMatchScore.toFixed(2),
        alternative: flagged ? (ALTERNATIVES[bestMatch] || null) : null
      });
    }

    return output;
  }

  async function handleSubmit() {
    if (!inputText.trim()) return;

    setLoading(true);

    if (!modelReady) {
      await loadModel();
    }

    const checked = await checkIngredients(inputText, skinType);
    setResults(checked);
    setExpandedIndex(null);
    setLoading(false);

    const total = checked.length;
    const safeCount = checked.filter(r => r.status === 'safe').length;
    const uncertainCount = checked.filter(r => r.status === 'uncertain').length;
    const rawScore = total > 0 ? ((safeCount + uncertainCount * 0.5) / total) * 100 : 0;
    setScore(Math.round(rawScore));
  }

  return (
    <div className="app-container">
      <Header />
      <SkinToggle profiles={SKIN_PROFILES} activeType={skinType} onSelect={setSkinType} />
      <IngredientForm
        inputText={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        loading={loading}
        modelReady={modelReady}
      />
      {results && (
        <ResultsPanel
          results={results}
          score={score}
          expandedIndex={expandedIndex}
          onToggleChip={setExpandedIndex}
        />
      )}
    </div>
  );
}

export default App;
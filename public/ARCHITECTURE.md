# SkinCheck — Architecture

## System Overview

SkinCheck is a fully client-side React application. There is no backend server — all logic, including AI inference, runs in the user's browser.

┌─────────────────────────────────────────────────┐
│                    Browser                        │
│                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌───────────┐ │
│  │  React    │──▶│ Transformers  │──▶│  Cosine   │ │
│  │  UI Layer │   │   .js Model   │   │Similarity │ │
│  │           │◀──│ (MiniLM-L6-v2)│◀──│ Matching  │ │
│  └──────────┘   └──────────────┘   └───────────┘ │
│                                                     │
└─────────────────────────────────────────────────┘
No network calls for AI inference

## Component Structure

App.jsx (state + logic)
├── Header.jsx            — title, subtitle
├── SkinToggle.jsx        — skin type selector (5 profiles)
├── IngredientForm.jsx    — textarea input + submit button
└── ResultsPanel.jsx      — score badge + chip grid
└── Chip.jsx         — individual ingredient result

`App.jsx` owns all state (input text, results, loading, model-ready flag, skin type, score) and passes data down to presentational components via props. Child components communicate back up via callback props (e.g., `onSelect`, `onToggle`).

## Data Flow

1. **User selects skin type** → sets `skinType` state (`acne`, `sensitive`, `dry`, `oily`, or `aging`)
2. **User pastes ingredient list** → comma-separated string stored in `inputText` state
3. **On submit:**
   - If the AI model isn't loaded yet, `loadModel()` fetches and initializes `Xenova/all-MiniLM-L6-v2` via Transformers.js (one-time download, cached by the browser afterward)
   - The ingredient list is split, trimmed, and filtered into an array
   - Each ingredient is converted into a vector embedding by the model
   - Each skin-type profile's irritant list is embedded once and cached in memory (`irritantEmbeddingsCache`) so switching between checks for the same profile doesn't require re-embedding
4. **Matching:** for every ingredient, cosine similarity (`cos_sim`) is computed against every irritant in the selected profile's reference list. The highest similarity score determines the match.
5. **Classification:** based on two thresholds:
   - `SIMILARITY_THRESHOLD = 0.6` → flagged
   - `UNCERTAIN_THRESHOLD = 0.45` → uncertain
   - below both → safe
6. **Alternatives:** flagged ingredients are looked up in a static `ALTERNATIVES` map to suggest a gentler substitute, where available.
7. **Score:** an overall compatibility percentage is computed as `(safeCount + uncertainCount * 0.5) / total * 100`.
8. **Render:** results are passed to `ResultsPanel`, which renders a `Chip` per ingredient with color-coded status and an expandable detail view.

## Local vs. Cloud Components

| Component | Runs where |
|---|---|
| UI rendering | Browser (React) |
| AI embedding model | Browser (Transformers.js, WASM/WebGPU backend) |
| Similarity matching | Browser (pure JS, `cos_sim`) |
| Irritant/alternative reference data | Bundled statically in the app — no database or API |
| Hosting (if deployed) | Static file host (e.g., Vercel/Netlify) — serves files only, no runtime logic |

**No backend server exists in this project.** The only network activity is the one-time download of the model weights from Hugging Face's CDN on first use; after that, the app is fully functional offline.

## Key Design Decisions

- **Semantic similarity over exact string matching** — ingredient names vary in formatting (e.g., "Fragrance" vs. "Parfum" vs. "Fragrance (Parfum)"), so embedding-based comparison catches variations that a simple string match would miss.
- **Two-tier threshold (flagged/uncertain/safe)** rather than a binary flag — reduces false positives from borderline similarity scores and gives the user a middle-ground signal to use their own judgment on.
- **Per-profile embedding cache** — avoids re-computing irritant embeddings on every check when the user re-checks the same skin type multiple times in a session.
- **No backend** — chosen deliberately to keep skincare/health-adjacent user input entirely private, in line with the project's core goal.



# SkinCheck 🧴✨

**On-device AI that tells you if a skincare product's ingredients actually match your skin type — entirely in your browser, with zero data leaving your device.**

Built for **OSDHack 2026** (theme: On-Device AI) by Prashasti Tiwari.

---

## What it does

Most of us buy skincare products without knowing whether the ingredients actually suit our skin. Researching every ingredient manually is slow and confusing — and what's fine for oily skin can be harmful for sensitive or acne-prone skin.

SkinCheck solves this instantly:
1. Select your skin type — Acne-prone, Sensitive, Dry, Oily, or Aging
2. Paste an ingredient list from any product label
3. Get instant, color-coded results for every ingredient — along with an overall compatibility score

## Why it matters

Skincare and health information is personal. SkinCheck was built to give people useful, skin-type-aware guidance **without sending any of their data to a server.** Everything — from ingredient analysis to similarity scoring — happens locally, in the browser, on your own device.

## How it works

SkinCheck runs a small AI embedding model — **Transformers.js** (`Xenova/all-MiniLM-L6-v2`) — entirely on-device. Here's the flow:

1. Each ingredient you enter is converted into a numerical "meaning" representation (an embedding)
2. The same is done for a curated list of ingredients known to be problematic for each skin type, sourced from dermatology literature and skincare guides
3. **Cosine similarity** is used to compare how close in meaning each ingredient is to known irritants for your selected skin type
4. Based on a two-tier threshold system, each ingredient is marked:
   - ✅ **Safe** — no meaningful match to known irritants
   - ❔ **Uncertain** — partial match, worth caution
   - ⚠️ **Flagged** — strong match to a known irritant for your skin type
5. Flagged ingredients also come with a suggested gentler alternative where available

## How it uses On-Device AI

- The embedding model (**Transformers.js**) loads and runs fully client-side — no API calls, no external inference servers
- All ingredient comparisons happen locally using **cosine similarity** computed in the browser
- No ingredient data, skin type selection, or any user input is ever transmitted anywhere — the entire analysis pipeline is offline-capable after the initial model download

## Tech stack

- **React** (Vite)
- **Transformers.js** (`Xenova/all-MiniLM-L6-v2`) for on-device embeddings
- **Vanilla CSS** — glassmorphic UI, Space Grotesk + IBM Plex Mono fonts

## How to run it locally

```bash
git clone https://github.com/Prashastitiwari21-code/skincheck.git
cd skincheck
npm install
npm run dev
```

Then open the local URL shown in your terminal (usually `http://localhost:5173`).

> Note: the first ingredient check will take 10–20 seconds while the AI model downloads and loads in your browser. Subsequent checks are instant.

## Limitations

- SkinCheck does not currently verify whether the text entered is a real cosmetic ingredient — this is a planned improvement
- The flagged-ingredient lists are curated from publicly available dermatology sources and are not exhaustive
- This is an **informational tool only, not medical advice**. Everyone's skin reacts differently — consult a dermatologist for persistent concerns

## Demo

📺 [Demo video link here]

## License

MIT — see [LICENSE](./LICENSE)

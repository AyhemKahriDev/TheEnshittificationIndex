# ▼ WorseWatch — the Enshittification Index

*"Did this product get worse?" — answered with receipts, not vibes.*

WorseWatch tracks consumer products and services over time and scores each one
on a single honest number, the **Enshittification Index (0–100)**, built from
three explainable components:

| Component | Range | What it measures |
| --- | --- | --- |
| **Price creep** | 0–30 | Flagship plan's % price change over the last 36 months |
| **Paywalls & cuts** | 0–50 | Logged "it got worse / it got better" events, weighted by impact, with 2-year full weight then a linear fade to zero at year six |
| **Reviews drifting** | 0–25 | App-store rating drift: last 15 months vs the 15 before |

Components sum to a theoretical 105; the index clamps to 0–100. No black box:
every point traces to a cited event or a date-stamped price point.

## Run it

Zero dependencies, no build step. Either:

```sh
cd worsewatch
python3 -m http.server 8000   # → http://localhost:8000
```

…or just double-click `index.html` (data is embedded as JS files, so `file://` works too).

## Pages

- **The Index** — all tracked services, score sparks, category filters, live search
- **Service pages** (`#/s/netflix`) — price history chart per plan, lifetime deltas per plan, app-rating sparkline, and the receipts timeline
- **The wire** (`#/feed`) — every logged event, newest first, filterable
- **Method** (`#/method`) — the formula, verdict bands, worked example computed live
- **Submit** (`#/submit`) — evidence form that generates a markdown entry (copy / download / draft autosave)

## Data honesty (v0.1)

This is a **hand-collected seed dataset**: prices US list, events flagged
`reported` (dated, widely covered) or `unverified` (editorial synthesis) — every
event renders a "receipts ↗" search link. Do not treat numbers as gospel;
treat the scoring engine and page shell as the product.

## The real-data roadmap

1. **Reviews**: Apple's public customer-reviews RSS feed gives per-app review
   dumps with no API key — a weekly cron replaces the editorial rating series.
2. **Prices**: a watchdog that diffs pricing pages weekly; Wayback Machine for history.
3. **Cuts & paywalls**: community submissions (the form already outputs repo-shaped
   markdown) + a review queue, all git-backed so every score change is auditable.

## Structure

```
worsewatch/
├── index.html          # shell + router target
├── assets/
│   ├── style.css       # dark editorial theme
│   ├── charts.js       # hand-rolled SVG line / sparkle charts (no deps)
│   └── app.js          # scoring engine + router + pages
└── data/
    └── services.js     # seed dataset: plans, prices, events, ratings
```

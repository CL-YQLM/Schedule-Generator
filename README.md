# Schedule Generator

A course schedule planner for **UIUC** (University of Illinois Urbana-Champaign). You pick the
courses you want to take, mark the times you must keep free, and dial in how much you care about
things like professor ratings and class difficulty. The app then searches every valid combination
of sections and returns the **top 10 conflict-free schedules**, ranked by your preferences.

> Built on a static snapshot of **Spring 2025** course data enriched with historical GPA
> distributions, RateMyProfessor scores, and ICES teaching-quality ratings.

---

## What it does

1. **Search courses** by department (e.g. `CS`, `MATH`, `ECE`).
2. **Block out time** on a weekly grid — mark slots as free, "prefer to avoid" (soft), or
   "must avoid" (hard).
3. **Set preferences** with sliders — how much professor quality, class difficulty, and grade
   history matter to you.
4. **Generate** — the backend runs a constraint solver over all section combinations, scores each
   valid schedule, and returns the 10 best.

---

## Architecture

```
┌─────────────────────────┐        HTTP (JSON)        ┌──────────────────────────────┐
│  Frontend (React/Vite)  │  ───────────────────────► │  Backend (Flask)             │
│  frontend/PageStyler    │   127.0.0.1:5001          │  data_processing/filter      │
│  - course search UI     │                           │  - /search/<dept>            │
│  - weekly time grid     │  ◄─────────────────────── │  - /preferences (POST)       │
│  - preference sliders   │      top-10 schedules     │  - constraint solver + score │
└─────────────────────────┘                           └───────────────┬──────────────┘
                                                                       │ reads
                                                       ┌───────────────▼──────────────┐
                                                       │  datasets/11-7-2025-sp.csv    │
                                                       │  UIUC Spring 2025 sections    │
                                                       │  + GPA / RMP / ICES data      │
                                                       └───────────────────────────────┘
```

The frontend calls the Flask backend **directly**. (There is also an Express server bundled with
the frontend — it is Replit scaffolding used to serve the static build in production; it is not the
scheduling API.)

### Repository layout

```
Schedule-Generator/
├── data_processing/filter/        # Flask backend — the scheduling engine
│   ├── app.py                     #   HTTP endpoints (/ping, /search, /preferences)
│   ├── scheduler.py               #   orchestrates filtering + scoring, returns top 10
│   ├── hard_filtering_code.py     #   DFS constraint solver (conflict-free section combos)
│   ├── soft_filtering_code.py     #   preference scoring (professor / GPA / soft breaks)
│   ├── location_code.py           #   walking-distance scoring between back-to-back classes
│   ├── buildings_coords.json      #   UIUC building -> lat/lon (real OpenStreetMap data)
│   └── requirements.txt
├── datasets/
│   └── 11-7-2025-sp.csv           # UIUC Spring 2025 course data (~7 MB)
├── frontend/PageStyler/           # React 19 + Vite + Tailwind + shadcn/ui
│   ├── client/                    #   the actual UI (pages, components, api client)
│   ├── server/                    #   Express static-serve wrapper (Replit scaffolding)
│   └── package.json
└── BACKEND_API_DOCUMENTATION.md   # full request/response reference
```

---

## How the scheduling engine works

**Hard filtering (`hard_filtering_code.py`)** — the core solver.
The week is modeled as a `5 × 90` grid: 5 weekdays (M, T, W, R, F) × 90 ten-minute slots
(7:00 AM → 10:00 PM). Each course section is projected onto this grid, and a depth-first search
walks every combination of sections. A combination is kept only if no two sections overlap and it
respects your hard time-blocks. Linked sections (lecture + lab/discussion) are handled together, and
there is a 30,000-schedule cap to keep the search bounded.

**Soft scoring (`soft_filtering_code.py` + `location_code.py`)** — ranks the survivors.
Each valid schedule gets a 0–100 score from four weighted components:
- **Professor quality** — RateMyProfessor score + ICES "Excellent"/"Outstanding" ratings.
- **Class difficulty** — historical average GPA (per professor and per class) and the % of students
  who earned at or above your target grade.
- **Soft breaks** — how well it avoids the times you'd *prefer* to keep free.
- **Location** — walking distance between back-to-back classes. For each consecutive pair on the
  same day it computes the real great-circle distance between the two buildings (Haversine over
  OpenStreetMap coordinates), converts it to a walking time (~84 m/min), and penalizes schedules
  that would make you late or force a longer walk than you're willing to do. Buildings without
  coordinate data are treated as neutral, never guessed.

Your slider values decide how much each component pulls on the final score. The top 10 are returned.

---

## Running locally

### Prerequisites
- Python 3.10+
- Node.js 20+

### 1. Start the backend (Flask, port 5001)

```bash
cd data_processing/filter
pip install -r requirements.txt
python app.py
```

Sanity check: open http://127.0.0.1:5001/ping — you should see a "server is working" message.

### 2. Start the frontend (Vite, port 5000)

```bash
cd frontend/PageStyler
npm install
npm run dev:client
```

Then open http://localhost:5000. The frontend expects the backend at `http://127.0.0.1:5001`
(configured in `frontend/PageStyler/client/src/lib/api.ts`).

> On Windows/PowerShell, use `npm run dev:client` (pure Vite). The `npm run dev` script uses
> Unix-style env vars and is intended for the Replit/Linux environment.

---

## API reference

See [`BACKEND_API_DOCUMENTATION.md`](./BACKEND_API_DOCUMENTATION.md) for full request/response
schemas. Quick summary:

| Method | Endpoint              | Purpose                                          |
| ------ | --------------------- | ------------------------------------------------ |
| `GET`  | `/ping`               | Health check                                     |
| `GET`  | `/search/<dept>`      | List all courses in a department                 |
| `POST` | `/preferences`        | Generate the top-10 ranked schedules             |

---

## Known limitations

- **Building coordinate coverage is ~88%.** 96 of the 109 buildings in the dataset have real
  OpenStreetMap coordinates; the rest are rare annexes or off-campus / remote sites, which are
  scored as neutral (never guessed). Walk-distance transitions involving those buildings are
  simply skipped.
- **Data is a static snapshot** (Spring 2025, `11-7-2025-sp.csv`). There is no live scraping or
  term selection.
- **Large search spaces are capped.** The hard filter aborts past 30,000 candidate schedules to
  bound computation, so selecting many high-section courses at once can return no results.
- The bundled Express server is Replit scaffolding, not the real API — the Flask app is the backend.

Contributions welcome.

---

## Tech stack

- **Backend:** Python, Flask, pandas, NumPy
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Wouter
- **Data:** UIUC course catalog + GPA history + RateMyProfessor + ICES ratings (Spring 2025)

## License

MIT

# Festival Schedule (static site)

A tiny, **read-only** schedule site that loads a CSV and renders day tabs, stage filters, and search.  
No frameworks. Deployed on Vercel (Output Dir: `public`, no build).

## Repo structure
public/
index.html
css/theme.css
js/app.js
data/schedule.csv
.github/workflows/validate-csv.yml
validate_schedule_csv.py
docs/DATA_RULES.md
PROMPTS.md


## Quickstart

1. **Add/replace the CSV**
   - Put your file at `public/data/schedule.csv` (schema in `docs/DATA_RULES.md`).
2. **Validate (local)**
   ```bash
   python validate_schedule_csv.py public/data/schedule.csv

   Commit & push
The GitHub Action (.github/workflows/validate-csv.yml) runs on CSV changes.

Deploy on Vercel

Import this repo → Framework: Other

Build Command: (empty)

Output Directory: public


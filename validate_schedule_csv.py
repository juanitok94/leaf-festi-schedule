#!/usr/bin/env python3
import sys, csv, re, pathlib

REQUIRED_HEADERS = ["id","day","date","start_time","end_time","stage","title","category"]
ALLOWED_DAYS = {"Thursday","Friday","Saturday","Sunday"}
ALLOWED_STAGES = {
  "Eden Field Main Stage","Eden Hall","Mike Compton Dance Hall","Big Barn",
  "Sunshine Stage","Ship Deck","Out & About","Lounging","Brookside","U-LEAF"
}
TIME_RE = re.compile(r"^\d{1,2}:\d{2}\s(AM|PM)$")

def err(msg): 
    print(f"ERROR: {msg}", file=sys.stderr)

def main(path):
    p = pathlib.Path(path)
    if not p.exists():
        err(f"{path} not found")
        return 2
    with p.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = [h.strip() for h in reader.fieldnames or []]
        missing = [h for h in REQUIRED_HEADERS if h not in headers]
        if missing:
            err(f"Missing required headers: {missing}")
            return 2
        ids = set()
        rownum = 1
        ok = True
        for row in reader:
            rownum += 1
            _id = (row.get("id") or "").strip()
            if not _id:
                err(f"Row {rownum}: empty id"); ok=False
            elif _id in ids:
                err(f"Row {rownum}: duplicate id '{_id}'"); ok=False
            else:
                ids.add(_id)
            day = (row.get("day") or "").strip()
            if day not in ALLOWED_DAYS:
                err(f"Row {rownum}: invalid day '{day}'"); ok=False
            date = (row.get("date") or "").strip()
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
                err(f"Row {rownum}: invalid date '{date}' (expected YYYY-MM-DD)"); ok=False
            st = (row.get("start_time") or "").strip()
            et = (row.get("end_time") or "").strip()
            if not TIME_RE.match(st): err(f"Row {rownum}: bad start_time '{st}'"); ok=False
            if not TIME_RE.match(et): err(f"Row {rownum}: bad end_time '{et}'"); ok=False
            stage = (row.get("stage") or "").strip()
            if stage not in ALLOWED_STAGES:
                err(f"Row {rownum}: invalid stage '{stage}'"); ok=False
            title = (row.get("title") or "").strip()
            if not title:
                err(f"Row {rownum}: empty title"); ok=False
            cat = (row.get("category") or "").strip()
            if cat not in {"Performance","Activity"}:
                err(f"Row {rownum}: invalid category '{cat}'"); ok=False
        if not ok:
            return 2
    print("CSV validation passed.")
    return 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_schedule_csv.py public/data/schedule.csv", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))

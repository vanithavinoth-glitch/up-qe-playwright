import csv
import sys
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: python scripts/parse_excel.py <path-to-excel-or-csv-file>")
    sys.exit(1)

input_path = Path(sys.argv[1])
if not input_path.exists():
    print(f"File not found: {input_path}")
    sys.exit(1)

suffix = input_path.suffix.lower()
SUPPORTED = {".xlsx", ".xlsm", ".csv", ".tsv"}
if suffix not in SUPPORTED:
    print(f"Unsupported file type '{suffix}'. Supported: {', '.join(sorted(SUPPORTED))}")
    sys.exit(1)


def clean(value):
    text = "" if value is None else str(value)
    return text.replace("\r", " ").replace("\n", " ").replace("|", "\\|").strip()


def read_csv_rows(path):
    # utf-8-sig strips a BOM; fall back to cp1252 for files saved by Excel on Windows
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            with open(path, newline="", encoding=encoding) as f:
                sample = f.read(4096)
                f.seek(0)
                if suffix == ".tsv":
                    dialect = csv.excel_tab
                else:
                    try:
                        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
                    except csv.Error:
                        dialect = csv.excel
                return list(csv.reader(f, dialect))
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode {path}")


def table_lines(rows):
    # drop fully empty rows
    rows = [r for r in rows if any(c is not None and str(c).strip() for c in r)]
    if not rows:
        return []
    headers = [clean(h) for h in rows[0]]
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows[1:]:
        cells = [clean(c) for c in row]
        # pad/trim to header width so the markdown table stays aligned
        cells = (cells + [""] * len(headers))[: len(headers)]
        out.append("| " + " | ".join(cells) + " |")
    return out


if suffix in (".csv", ".tsv"):
    lines = [f"# Extracted CSV Requirements: {input_path.name}\n"]
    body = table_lines(read_csv_rows(input_path))
    if body:
        lines.append(f"## Sheet: {input_path.stem}\n")
        lines.extend(body)
        lines.append("")
else:
    import openpyxl

    wb = openpyxl.load_workbook(input_path, data_only=True)
    lines = [f"# Extracted Excel Requirements: {input_path.name}\n"]
    for sheet_name in wb.sheetnames:
        rows = list(wb[sheet_name].iter_rows(values_only=True))
        body = table_lines(rows)
        if not body:
            continue
        lines.append(f"## Sheet: {sheet_name}\n")
        lines.extend(body)
        lines.append("")

out_path = Path(".qa-pipeline/extracted-excel.md")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text("\n".join(lines), encoding="utf-8")
print(f"Successfully extracted {suffix.lstrip('.').upper()} data to {out_path}")

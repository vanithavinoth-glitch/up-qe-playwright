import sys
from pathlib import Path
import openpyxl

if len(sys.argv) < 2:
    print("Usage: python scripts/parse_excel.py <path-to-excel-file>")
    sys.exit(1)

input_path = Path(sys.argv)
if not input_path.exists():
    print(f"File not found: {input_path}")
    sys.exit(1)

wb = openpyxl.load_workbook(input_path, data_only=True)
lines = [f"# Extracted Excel Requirements: {input_path.name}\n"]

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        continue

    lines.append(f"## Sheet: {sheet_name}\n")
    headers = [str(h or "").replace("\n", " ").strip() for h in rows]
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("| " + " | ".join(["---"] * len(headers)) + " |")

    for row in rows[1:]:
        cells = [str(c if c is not None else "").replace("\n", " ").strip() for c in row]
        lines.append("| " + " | ".join(cells) + " |")
    lines.append("")

out_path = Path(".qa-pipeline/extracted-excel.md")
out_path.write_text("\n".join(lines), encoding="utf-8")
print(f"Successfully extracted Excel data to {out_path}")

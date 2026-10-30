"""Inline local <script src="..."> files so each page ships as one self-contained HTML file.

    python3 build.py storyboard.src.html storyboard.html
"""
import pathlib
import re
import sys

src, out = map(pathlib.Path, sys.argv[1:3])
root = src.parent


def inline(m):
    path = root / m.group(1)
    return "<script>\n" + path.read_text(encoding="utf-8") + "\n</script>"


html = re.sub(r'<script src="((?!https?:)[^"]+)"></script>', inline, src.read_text(encoding="utf-8"))
out.write_text(html, encoding="utf-8")
print(f"wrote {out} ({len(html) // 1024} KB)")

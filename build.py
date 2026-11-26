"""Sinh index.html (mở trực tiếp / host web) và dist/ICT-offline.html (một file duy nhất, copy sang điện thoại)."""
import pathlib, re
root = pathlib.Path(__file__).parent
frag = (root / "page.html").read_text(encoding="utf-8")
head = '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
lines = frag.split("\n")
i = 0
while i < len(lines) and lines[i].startswith(("<title", "<meta", "<link")):
    i += 1
meta, body = "\n".join(lines[:i]), "\n".join(lines[i:])
(root / "index.html").write_text(head + meta + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n", encoding="utf-8")
print("index.html OK")

# --- bản offline một file ---
css = (root / "assets/style.css").read_text(encoding="utf-8")
meta2 = "\n".join(l for l in meta.split("\n") if "assets/style.css" not in l and "manifest" not in l)
def inline(m):
    js = (root / m.group(1)).read_text(encoding="utf-8").replace("</script", "<\\/script")
    return "<script>\n" + js + "\n</script>"
body2 = re.sub(r'<script src="((?:assets|live)/[^"]+)"></script>', inline, body)
out = head + meta2 + "\n<style>\n" + css + "\n</style>\n</head>\n<body>\n" + body2 + "\n</body>\n</html>\n"
(root / "dist").mkdir(exist_ok=True)
(root / "dist/ICT-offline.html").write_text(out, encoding="utf-8")
print("dist/ICT-offline.html OK", len(out) // 1024, "KB")

"""curriculums/ のディレクトリ構造から mkdocs.yml の nav: ブロックを生成する。

- 各セクション .md の見出し（H1）をそのままナビのラベルに使う
  （例: "# 1-1 この教材の全体像と進め方" → "1-1 この教材の全体像と進め方"）。
- Part / Chapter のラベルはディレクトリ名から復元する
  （"part-01_前提と開発環境を整える" → "Part 1 前提と開発環境を整える"。ハイフンはスペースに戻す）。

標準出力に nav: ブロックを書き出す。mkdocs.yml テンプレートの {{NAV}} 行を
この出力で置き換えて使う。セクションを増減したら再実行して差し替える。

このリポジトリ向けの調整点（github-pages スキルの同梱版からの差分）:
  - セクション番号は 2 連番（C-S 形式。例: 1-1, 3-2, 10-6）。

使い方:
  python scripts/generate_nav.py            # リポジトリ直下の scripts/ から実行
  python <skill>/scripts/generate_nav.py <repo-root>   # 別リポを指定して実行（検証用）
"""

import re
import sys
from pathlib import Path

ROOT = (
    Path(sys.argv[1]).resolve()
    if len(sys.argv) > 1
    else Path(__file__).resolve().parent.parent
)
CURRICULUMS_DIR = ROOT / "curriculums"


def title_from_dir(dirname: str, kind: str):
    """'part-01_前提と開発環境を整える' → ('1', '前提と開発環境を整える')。失敗時は ('', dirname)。"""
    m = re.match(rf"{kind}-(\d+)_(.*)", dirname)
    if not m:
        return "", dirname
    num = str(int(m.group(1)))  # ゼロ埋めを外す
    title = m.group(2).replace("-", " ")
    return num, title


def section_slug(filename: str) -> str:
    m = re.match(r"(\d+-\d+)", filename)
    return f"{m.group(1)}.md" if m else filename


def h1_label(md_path: Path) -> str:
    """ファイル中の最初の '# ' 見出しテキストを返す。無ければファイル名から復元。"""
    for line in md_path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    m = re.match(r"(\d+-\d+)_(.*)", md_path.stem)
    if m:
        return f"{m.group(1)} {m.group(2).replace('-', ' ')}"
    return md_path.stem


def yaml_key(label: str) -> str:
    """YAML マッピングキーとして安全な表記にする（必要なときだけダブルクオート）。"""
    if (
        ":" in label
        or label != label.strip()
        or label[:1] in "-?:[]{}#&*!|>%@`\"'"
    ):
        escaped = label.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return label


def build_nav() -> str:
    lines = ["nav:", "  - トップ: index.md"]
    for part_dir in sorted(p for p in CURRICULUMS_DIR.iterdir() if p.is_dir()):
        pnum, ptitle = title_from_dir(part_dir.name, "part")
        if not pnum:
            continue
        part_slug = re.match(r"(part-\d+)", part_dir.name).group(1)
        lines.append(f"  - {yaml_key(f'Part {pnum} {ptitle}')}:")
        for chapter_dir in sorted(c for c in part_dir.iterdir() if c.is_dir()):
            cnum, ctitle = title_from_dir(chapter_dir.name, "chapter")
            if not cnum:
                continue
            chap_slug = re.match(r"(chapter-\d+)", chapter_dir.name).group(1)
            lines.append(f"    - {yaml_key(f'Chapter {cnum} {ctitle}')}:")
            for md in sorted(chapter_dir.glob("*.md")):
                label = h1_label(md)
                path = f"{part_slug}/{chap_slug}/{section_slug(md.name)}"
                lines.append(f"      - {yaml_key(label)}: {path}")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    if not CURRICULUMS_DIR.is_dir():
        sys.exit(f"curriculums/ が見つかりません: {CURRICULUMS_DIR}")
    sys.stdout.write(build_nav())

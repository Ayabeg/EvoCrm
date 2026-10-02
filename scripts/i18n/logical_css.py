#!/usr/bin/env python3
"""Rewrite physical Tailwind left/right utilities to logical equivalents."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ROOTS = [
    ROOT / "resources/js/evo",
    ROOT / "resources/js/components",
    ROOT / "resources/js/pages",
    ROOT / "resources/js/ds",
    ROOT / "resources/js/layouts",
]
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".css"}


def transform(text: str) -> str:
    def margin(match: re.Match[str]) -> str:
        prefix, sign, which, rest = match.group(1), match.group(2), match.group(3), match.group(4)
        mapping = {"ml": "ms", "mr": "me", "pl": "ps", "pr": "pe"}

        return f"{prefix}{sign}{mapping[which]}-{rest}"

    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)(-?)(ml|mr|pl|pr)-([a-z0-9./\[\]]+)",
        margin,
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)text-left\b",
        r"\1text-start",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)text-right\b",
        r"\1text-end",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)float-left\b",
        r"\1float-start",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)float-right\b",
        r"\1float-end",
        text,
    )

    def inset(match: re.Match[str]) -> str:
        prefix, sign, which, rest = match.group(1), match.group(2), match.group(3), match.group(4)

        if rest.startswith("1/2"):
            return match.group(0)

        mapping = {"left": "start", "right": "end"}

        return f"{prefix}{sign}{mapping[which]}-{rest}"

    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)(-?)(left|right)-([a-z0-9./\[\]]+)",
        inset,
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)border-l(?=-|\b)",
        r"\1border-s",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)border-r(?=-|\b)",
        r"\1border-e",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)rounded-l(?=-|\b)(?!g\b)",
        r"\1rounded-s",
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)rounded-r(?=-|\b)",
        r"\1rounded-e",
        text,
    )
    corners = {"tl": "ss", "tr": "se", "bl": "es", "br": "ee"}

    def corner(match: re.Match[str]) -> str:
        prefix, which, rest = match.group(1), match.group(2), match.group(3)

        return f"{prefix}rounded-{corners[which]}{rest}"

    text = re.sub(
        r"(?<![A-Za-z0-9-])((?:[a-z0-9-]+:)*)rounded-(tl|tr|bl|br)(-[a-z0-9]+|\b)",
        corner,
        text,
    )

    return text


def main() -> None:
    changed = 0

    for root in ROOTS:
        if not root.exists():
            continue

        for path in root.rglob("*"):
            if path.suffix not in EXTENSIONS or not path.is_file():
                continue

            original = path.read_text()
            updated = transform(original)

            if updated != original:
                path.write_text(updated)
                changed += 1
                print(path.relative_to(ROOT))

    print(f"updated={changed}")


if __name__ == "__main__":
    main()

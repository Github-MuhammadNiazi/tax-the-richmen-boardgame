"""Rasterise the building-cost sheets so the site can show the real cards."""

from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "public" / "printables" / "cards" / "building-cost-cards-a4-duplex.pdf"
OUT = ROOT / "public" / "printables" / "cards" / "previews"


def mm(value: float) -> float:
    return value * 72 / 25.4


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    matrix = fitz.Matrix(140 / 72, 140 / 72)
    for index, page in enumerate(doc):
        page.get_pixmap(matrix=matrix, alpha=False).save(OUT / f"sheet-{index + 1}.png")
    doc[0].get_pixmap(matrix=matrix, clip=fitz.Rect(mm(8), mm(13.5), mm(98), mm(141.5)), alpha=False).save(OUT / "front-red.png")
    doc[1].get_pixmap(matrix=matrix, clip=fitz.Rect(mm(112), mm(13.5), mm(202), mm(141.5)), alpha=False).save(OUT / "back-red.png")
    doc[0].get_pixmap(matrix=matrix, clip=fitz.Rect(mm(112), mm(155.5), mm(202), mm(283.5)), alpha=False).save(OUT / "front-gold.png")
    print(f"pages {doc.page_count} mediabox {doc[0].rect}")


if __name__ == "__main__":
    main()

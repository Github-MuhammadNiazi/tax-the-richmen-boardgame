"""Replace the card entries in the complete-game archive without rebuilding the meshes."""

import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "public" / "printables" / "bundles" / "complete-game.zip"
CARDS = sorted((ROOT / "public" / "printables" / "cards").glob("*.pdf"))
TEMP = ARCHIVE.with_suffix(".zip.tmp")


def main() -> None:
    with zipfile.ZipFile(ARCHIVE) as source, zipfile.ZipFile(TEMP, "w", compression=zipfile.ZIP_DEFLATED) as dest:
        seen: set[str] = set()
        for item in source.infolist():
            if item.filename.startswith("cards/") or item.filename in seen:
                continue
            seen.add(item.filename)
            dest.writestr(item, source.read(item.filename))
        for card in CARDS:
            dest.write(card, f"cards/{card.name}")
    TEMP.replace(ARCHIVE)
    with zipfile.ZipFile(ARCHIVE) as check:
        bad = check.testzip()
        names = check.namelist()
        dupes = sorted({name for name in names if names.count(name) > 1})
        if bad or dupes:
            raise SystemExit(f"zip check failed: {bad} {dupes}")
        print(f"{len(names)} entries, {sum(name.startswith('cards/') for name in names)} cards")


if __name__ == "__main__":
    main()

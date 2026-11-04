"""Export, validate, render and package the Tax the Richmen printable models.

OpenSCAD is the geometry source. This script does not invent meshes.
A generic 3MF written here is a core-spec mesh package, not a Bambu Studio project.
"""

from __future__ import annotations

import json
import math
import re
import shutil
import subprocess
import sys
import zipfile
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from meshcheck import assess, fits_bed  # noqa: E402

CAD = ROOT / "printables" / "cad"
LIB = (CAD / "lib.scad").read_text(encoding="utf-8")
OPENSCAD = Path(r"C:\Program Files\OpenSCAD\openscad.exe")
PUBLIC = ROOT / "public" / "printables"
MODELS = PUBLIC / "models"
RENDERS = PUBLIC / "renders"
BUNDLES = PUBLIC / "bundles"

CONST = {
    name: float(value)
    for name, value in re.findall(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(-?[\d.]+)\s*;", LIB, re.M)
}


def C(name: str) -> float:
    if name not in CONST:
        raise SystemExit(f"missing constant {name} in lib.scad")
    return CONST[name]


FLAT = C("flat")
TOPPER = C("topper_flat")
ROAD_LEN = FLAT - 2 * C("center_keep")
COVER_OUTER = TOPPER + 2 * C("cover_clearance") + 2 * C("cover_wall")
HEX_X = lambda across: across / math.sqrt(3) * 2  # noqa: E731

JOBS: list[tuple[str, str, dict]] = [
    ("hex_base", "hex_base", {}),
    ("topper_artwork", "topper_artwork", {}),
    ("topper_city", "topper_city", {}),
    ("topper_village", "topper_village", {}),
    ("topper_mine", "topper_mine", {}),
    ("topper_port", "topper_port", {}),
    ("topper_oil", "topper_oil", {}),
    ("topper_mountain", "topper_mountain", {}),
    ("topper_water", "topper_water", {}),
    ("topper_tax", "topper_tax", {}),
    ("hidden_cover", "hidden_cover", {}),
    ("hex_clip", "hex_clip", {}),
    ("fit_calibration", "fit_calibration", {}),
    ("road_segment", "road_segment", {}),
    ("pipeline_straight", "pipeline_straight", {}),
    ("pipeline_coupling", "pipeline_coupling", {}),
    ("establishment", "establishment", {}),
    ("office", "office", {}),
    ("flag", "flag", {}),
    ("flag_ship", "flag_ship", {}),
    ("steel_vault", "steel_vault", {}),
    *[("number_chip_" + str(n), "number_chip", {"num": n}) for n in (3, 4, 5, 6, 8, 9, 10, 11)],
    ("steel_coin", "steel_coin", {}),
    ("market_wood", "market_wood", {}),
    ("market_metal", "market_metal", {}),
    ("market_fuel", "market_fuel", {}),
    ("market_stone", "market_stone", {}),
    ("lease_token", "lease_token", {}),
    ("bid_marker", "bid_marker", {}),
    ("tax_inspector", "tax_inspector", {}),
    ("inspector_hat", "inspector_hat", {}),
    ("inspector_ring", "inspector_ring", {}),
    ("upgrade_token", "upgrade_token", {}),
    ("winning_ship", "winning_ship", {}),
    ("resource_money", "resource_money", {}),
    ("resource_wood", "resource_wood", {}),
    ("resource_metal", "resource_metal", {}),
    ("resource_fuel", "resource_fuel", {}),
    ("resource_stone", "resource_stone", {}),
    ("dice", "dice", {}),
    ("card_holder", "card_holder", {}),
    ("token_tray", "token_tray", {}),
]

BUNDLE_FILES = {
    "base-and-terrain": [
        "hex_base",
        "topper_artwork",
        "topper_city",
        "topper_village",
        "topper_mine",
        "topper_port",
        "topper_oil",
        "topper_mountain",
        "topper_water",
        "topper_tax",
        "hidden_cover",
        "hex_clip",
        "fit_calibration",
    ],
    "roads-and-pipelines": ["road_segment", "pipeline_straight", "pipeline_coupling"],
    "buildings-and-markers": [
        "establishment",
        "office",
        "flag",
        "flag_ship",
        "steel_vault",
        "market_wood",
        "market_metal",
        "market_fuel",
        "market_stone",
        "lease_token",
        "bid_marker",
        "tax_inspector",
        "inspector_hat",
        "inspector_ring",
        "upgrade_token",
        "winning_ship",
    ],
    "currency-and-tokens": [
        *[f"number_chip_{n}" for n in (3, 4, 5, 6, 8, 9, 10, 11)],
        "steel_coin",
        "resource_money",
        "resource_wood",
        "resource_metal",
        "resource_fuel",
        "resource_stone",
        "dice",
        "card_holder",
        "token_tray",
    ],
}


def export_job(job: tuple[str, str, dict]) -> tuple[str, str]:
    model_id, part, defines = job
    out = MODELS / f"{model_id}.stl"
    cmd = [str(OPENSCAD), "-o", str(out), "-D", f'part="{part}"']
    for key, value in defines.items():
        cmd.extend(["-D", f"{key}={value}"])
    cmd.append(str(CAD / "kit.scad"))
    proc = subprocess.run(cmd, cwd=CAD, capture_output=True, text=True, timeout=180)
    log = (proc.stdout or "") + (proc.stderr or "")
    if proc.returncode != 0 or not out.exists() or out.stat().st_size < 200:
        raise RuntimeError(f"{model_id} failed\n{log[-2000:]}")
    if "ERROR:" in log or "Current top level object is empty" in log:
        raise RuntimeError(f"{model_id} empty or errored\n{log[-2000:]}")
    return model_id, log


def near(value: float, target: float, tol: float = 0.25) -> bool:
    return abs(value - target) <= tol


def dimension_errors(model_id: str, extents: list[float]) -> list[str]:
    x, y, z = extents
    errors: list[str] = []
    if model_id == "hex_base":
        if not (near(x, HEX_X(FLAT), 0.15) and near(y, FLAT, 0.15) and near(z, C("base_h"), 0.1)):
            errors.append(f"hex base extents {extents} != {HEX_X(FLAT):.3f} x {FLAT} x {C('base_h')}")
    elif model_id.startswith("topper_"):
        if not (near(x, HEX_X(TOPPER), 0.3) and near(y, TOPPER, 0.3)):
            errors.append(f"{model_id} footprint {x:.2f} x {y:.2f} is not a {TOPPER} mm topper")
        if z < C("plate_h") + C("peg_h") - 0.15:
            errors.append(f"{model_id} is shorter than the plate plus pegs")
    elif model_id == "hidden_cover":
        if not (near(x, HEX_X(COVER_OUTER), 0.35) and near(y, COVER_OUTER, 0.35)):
            errors.append(f"cover footprint {x:.2f} x {y:.2f}, expected flat {COVER_OUTER:.2f}")
        if COVER_OUTER >= FLAT:
            errors.append("cover is wider than the base")
    elif model_id == "road_segment":
        if not near(x, ROAD_LEN, 0.4):
            errors.append(f"road length {x:.2f} != {ROAD_LEN:.2f}")
        if y > C("road_w") + 1.2:
            errors.append(f"road is wider than designed: {y:.2f}")
    elif model_id == "pipeline_straight":
        if not near(max(x, y), ROAD_LEN, 0.6):
            errors.append(f"pipeline length {max(x, y):.2f} != {ROAD_LEN:.2f}")
    elif model_id.startswith("number_chip_"):
        if not near(max(x, y), C("chip_d"), 0.45):
            errors.append(f"chip diameter {max(x, y):.2f}")
        if z < C("chip_h") + 0.6:
            errors.append(f"chip has no raised numeral (height {z:.2f})")
    elif model_id == "steel_coin":
        if not near(max(x, y), 18, 0.4) or z < 2.1:
            errors.append(f"steel coin extents {extents}")
    elif model_id == "tax_inspector":
        if z < 28 or z > 42:
            errors.append(f"inspector height {z:.1f} is outside the miniature range")
    elif model_id == "winning_ship":
        if max(x, y) > FLAT:
            errors.append("ship does not fit on a hex")
    return errors


def write_3mf(mesh: trimesh.Trimesh, path: Path) -> str | None:
    mesh.export(path)
    with zipfile.ZipFile(path) as zf:
        names = set(zf.namelist())
        if "[Content_Types].xml" not in names or "3D/3dmodel.model" not in names:
            return "3MF archive is missing core parts"
        model = zf.read("3D/3dmodel.model").decode("utf-8", "replace")
        if "<vertex" not in model or "<triangle" not in model:
            return "3MF model has no geometry"
    return None


def render_preview(model_id: str, part: str, defines: dict, view: str) -> None:
    """OpenSCAD preview of the same geometry that was exported. The viewport background is removed."""
    camera = "0,0,0,62,0,38,0" if view == "iso" else "0,0,0,0,0,0,0"
    raw = RENDERS / f"_{model_id}-{view}.png"
    final = RENDERS / f"{model_id}-{view}.png"
    cmd = [
        str(OPENSCAD),
        "-o",
        str(raw),
        "--imgsize=800,640",
        "--viewall",
        "--projection=ortho",
        f"--camera={camera}",
        "-D",
        f'part="{part}"',
    ]
    for key, value in defines.items():
        cmd.extend(["-D", f"{key}={value}"])
    cmd.append(str(CAD / "kit.scad"))
    proc = subprocess.run(cmd, cwd=CAD, capture_output=True, text=True, timeout=180)
    if proc.returncode != 0 or not raw.exists():
        raise RuntimeError(f"preview {model_id} {view}\n{(proc.stderr or '')[-1000:]}")
    image = np.array(Image.open(raw).convert("RGBA"))
    background = image[2, 2, :3].astype(np.int16)
    diff = np.abs(image[:, :, :3].astype(np.int16) - background)
    image[np.all(diff < 22, axis=2), 3] = 0
    Image.fromarray(image).save(final)
    raw.unlink()


def placement_report() -> list[str]:
    """Check that the pieces the rules put on one hex can sit there without overlapping."""
    road_half = C("road_w") / 2
    corridors = [math.radians(30 + 60 * i) for i in range(6)]

    def nearest(x: float, y: float) -> float:
        return min(abs(x * math.sin(a) - y * math.cos(a)) for a in corridors)

    def inside(x: float, y: float, across: float) -> bool:
        limit = across / 2
        return all(
            x * math.cos(math.radians(30 + 60 * i)) + y * math.sin(math.radians(30 + 60 * i)) <= limit + 0.05
            for i in range(6)
        )

    def corners(angle: float, orbit: float, hx: float, hy: float) -> list[tuple[float, float]]:
        rad = (math.cos(angle), math.sin(angle))
        tan = (-math.sin(angle), math.cos(angle))
        cx, cy = orbit * rad[0], orbit * rad[1]
        return [
            (cx + tan[0] * sx + rad[0] * sy, cy + tan[1] * sx + rad[1] * sy)
            for sx in (-hx, hx)
            for sy in (-hy, hy)
        ]

    problems: list[str] = []
    chip_r = C("chip_d") / 2
    chip = (C("chip_orbit"), 0.0)
    chip_gap = nearest(*chip) - road_half - chip_r
    if chip_gap < 1.0:
        problems.append(f"number chip clears a road by only {chip_gap:.2f} mm")
    if not inside(chip[0] + chip_r, 0, TOPPER) or not inside(chip[0], chip_r, TOPPER):
        problems.append("number chip hangs off the topper")

    offices = []
    for deg in (120, 240):
        pts = corners(math.radians(deg), 25, 5.5, 4.5)
        offices.append(pts)
        gaps = [nearest(x, y) - road_half for x, y in pts]
        if min(gaps) < 0.8:
            problems.append(f"office at {deg}° meets a road corridor ({min(gaps):.2f} mm)")
        if any(not inside(x, y, TOPPER) for x, y in pts):
            problems.append(f"office at {deg}° leaves the topper")
    est = corners(math.radians(180), 27, 6.0, 4.8)
    if min(nearest(x, y) - road_half for x, y in est) < 0.8:
        problems.append("establishment meets a road corridor")
    if any(not inside(x, y, TOPPER) for x, y in est):
        problems.append("establishment leaves the topper")
    market = corners(math.radians(60), 27, 6.0, 5.0)
    if min(nearest(x, y) - road_half for x, y in market) < 0.8:
        problems.append("market meets a road corridor")
    if any(not inside(x, y, TOPPER) for x, y in market):
        problems.append("market leaves the topper")

    ring_r = 9.5
    if C("center_keep") - ring_r < 1.5:
        problems.append("inspector ring meets the inner end of a road")
    if COVER_OUTER >= FLAT - 0.2:
        problems.append("hidden cover does not sit inside the base")
    if TOPPER + 2 * C("cover_clearance") >= COVER_OUTER - 2 * 1.2:
        problems.append("hidden cover wall is under 1.2 mm")
    return problems


def pack(name: str, ids: list[str], extra: list[Path]) -> None:
    path = BUNDLES / f"{name}.zip"
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for model_id in ids:
            for ext in ("stl", "3mf"):
                file = MODELS / f"{model_id}.{ext}"
                zf.write(file, f"models/{file.name}")
        for src in (CAD / "lib.scad", CAD / "kit.scad"):
            zf.write(src, f"cad/{src.name}")
        for file in extra:
            if file.exists():
                zf.write(file, f"cards/{file.name}")
    with zipfile.ZipFile(path) as zf:
        bad = zf.testzip()
        if bad:
            raise SystemExit(f"{path.name} failed zip test at {bad}")


def main() -> int:
    if not OPENSCAD.exists():
        raise SystemExit(f"OpenSCAD not found at {OPENSCAD}")
    MODELS.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    BUNDLES.mkdir(parents=True, exist_ok=True)
    (PUBLIC / "cad").mkdir(parents=True, exist_ok=True)
    shutil.copy(CAD / "lib.scad", PUBLIC / "cad" / "lib.scad")
    shutil.copy(CAD / "kit.scad", PUBLIC / "cad" / "kit.scad")

    print(f"exporting {len(JOBS)} models")
    logs: dict[str, str] = {}
    with ProcessPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(export_job, job): job[0] for job in JOBS}
        for future in as_completed(futures):
            model_id = futures[future]
            model_id, log = future.result()
            logs[model_id] = log
            print(" exported", model_id)

    records = []
    failed = 0
    for model_id, part, defines in JOBS:
        stl = MODELS / f"{model_id}.stl"
        mesh = trimesh.load(stl, force="mesh")
        info = assess(mesh)
        errors = []
        if info["vertices"] < 4 or info["volume"] < 5:
            errors.append("mesh is empty")
        if not info["watertight"]:
            errors.append("not watertight")
        if not info["winding"]:
            errors.append("inconsistent winding")
        if info["bodies"] != 1:
            errors.append(f"{info['bodies']} disconnected shells")
        if info["volume"] <= 0:
            errors.append("non-positive volume")
        if not fits_bed(info["extents"], 180):
            errors.append(f"does not fit the 180 mm bed: {info['extents']}")
        errors.extend(dimension_errors(model_id, info["extents"]))
        mf_error = write_3mf(mesh, MODELS / f"{model_id}.3mf")
        if mf_error:
            errors.append(mf_error)
        for view in ("iso", "top"):
            render_preview(model_id, part, defines, view)
        record = {
            "id": model_id,
            "bytes": stl.stat().st_size,
            **info,
            "fitsCompact": fits_bed(info["extents"], 180),
            "fitsStandard": fits_bed(info["extents"], 256),
            "threeMf": (MODELS / f"{model_id}.3mf").name,
            "threeMfKind": "3MF core mesh, not a Bambu Studio project",
            "ok": not errors,
            "errors": errors,
        }
        records.append(record)
        if errors:
            failed += 1
            print(" FAIL", model_id, "; ".join(errors))
        else:
            print(" ok  ", model_id, [round(v, 2) for v in info["extents"]])

    fit = placement_report()
    if fit:
        failed += len(fit)
        print("FIT PROBLEMS")
        for line in fit:
            print(" -", line)

    openscad_version = subprocess.run([str(OPENSCAD), "--version"], capture_output=True, text=True).stderr.strip()
    report = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "openscad": openscad_version or "OpenSCAD 2021.01",
        "units": "mm",
        "bedCompactMm": 180,
        "bedStandardMm": 256,
        "threeMf": "Generic 3MF core files. They contain mesh geometry only. They are not Bambu Studio projects and were not opened in Bambu Studio.",
        "notVerified": [
            "No physical test print was made.",
            "Self-intersection was not exhaustively measured; watertightness, winding, a single shell and designed wall thickness were.",
            "Connector clearance is the design value in lib.scad. The fit calibration bar is how a printer checks it.",
        ],
        "fitProblems": fit,
        "passed": sum(1 for r in records if r["ok"]),
        "failed": sum(1 for r in records if not r["ok"]),
        "models": records,
    }
    (PUBLIC / "validation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (ROOT / "src" / "data" / "modelMeasurements.json").write_text(
        json.dumps(
            {
                "generatedAt": report["generatedAt"],
                "openscad": report["openscad"],
                "models": {
                    r["id"]: {
                        "extents": [round(v, 2) for v in r["extents"]],
                        "volume": round(r["volume"], 1),
                        "watertight": r["watertight"],
                        "bodies": r["bodies"],
                        "ok": r["ok"],
                    }
                    for r in records
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    cards = sorted((PUBLIC / "cards").glob("*.pdf")) if (PUBLIC / "cards").exists() else []
    for name, ids in BUNDLE_FILES.items():
        pack(name, ids, [])
    everything = [model_id for model_id, _part, _defines in JOBS]
    pack("complete-game", everything, cards)
    lines = [
        "# Print validation report",
        "",
        f"Generated {report['generatedAt']} with {report['openscad']}.",
        "Units are millimetres. Extents are the axis-aligned bounding box of the exported mesh.",
        "",
        "These 3MF files are generic 3MF core meshes. They are not Bambu Studio projects, they contain no printer profile, and they were not opened in Bambu Studio.",
        "",
        "No physical test print was made. Connector clearance is the design value in `printables/cad/lib.scad`. Use the fit calibration bar on your own machine.",
        "Self-intersection was not exhaustively measured. Each mesh was checked for a non-zero volume, watertightness, consistent winding, a single shell, and the dimensions listed below.",
        "",
        f"Models passed: {report['passed']}. Models failed: {report['failed']}.",
        "",
        "## Fit",
        "",
    ]
    lines += [f"- {item}" for item in fit] or ["- Number chip, two Offices, an Establishment, a Market and the road corridors can share a topper at the positions in ASSEMBLY_GUIDE.md."]
    lines += ["", "## Meshes", "", "| Model | Extents (mm) | Volume (mm³) | Watertight | Shells | Result |", "| --- | --- | ---: | --- | ---: | --- |"]
    for record in records:
        extents = " × ".join(f"{v:.2f}" for v in record["extents"])
        result = "pass" if record["ok"] else "; ".join(record["errors"])
        lines.append(
            f"| `{record['id']}` | {extents} | {record['volume']:.0f} | {'yes' if record['watertight'] else 'no'} | {record['bodies']} | {result} |"
        )
    (ROOT / "PRINT_VALIDATION_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{report['passed']} passed, {report['failed']} failed, fit problems: {len(fit)}")
    return failed


if __name__ == "__main__":
    raise SystemExit(main())

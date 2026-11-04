"""Mesh checks for the Tax the Richmen printable library.

Run `py -3 scripts/meshcheck.py --self-test` to confirm the checks can tell a solid
box from an open triangle and from two disconnected boxes.
"""

from __future__ import annotations

import argparse
import sys

import numpy as np
import trimesh


def assess(mesh: trimesh.Trimesh) -> dict:
    if not isinstance(mesh, trimesh.Trimesh):
        mesh = trimesh.util.concatenate(tuple(mesh.geometry.values())) if hasattr(mesh, "geometry") else mesh
    bodies = mesh.split(only_watertight=False)
    extents = [float(v) for v in mesh.extents] if len(mesh.vertices) else [0.0, 0.0, 0.0]
    return {
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "watertight": bool(mesh.is_watertight),
        "winding": bool(mesh.is_winding_consistent),
        "bodies": int(len(bodies)),
        "volume": float(mesh.volume) if mesh.is_watertight else 0.0,
        "extents": extents,
        "euler": int(mesh.euler_number) if len(mesh.faces) else 0,
    }


def fits_bed(extents: list[float], bed: float = 180.0) -> bool:
    return max(extents) <= bed + 0.05 and min(extents) > 0.2


def self_test() -> int:
    box = trimesh.creation.box(extents=(10, 8, 4))
    solid = assess(box)
    assert solid["watertight"] and solid["winding"] and solid["bodies"] == 1 and solid["volume"] > 0, solid

    triangle = trimesh.Trimesh(vertices=[[0, 0, 0], [2, 0, 0], [0, 2, 0]], faces=[[0, 1, 2]], process=False)
    broken = assess(triangle)
    assert not broken["watertight"], broken

    other = trimesh.creation.box(extents=(4, 4, 4))
    other.apply_translation([20, 0, 0])
    pair = trimesh.util.concatenate([box, other])
    split = assess(pair)
    assert split["bodies"] == 2, split

    assert fits_bed([70, 80, 4]) and not fits_bed([200, 10, 10])
    print("meshcheck self-test passed")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    sys.exit(self_test() if args.self_test else 0)

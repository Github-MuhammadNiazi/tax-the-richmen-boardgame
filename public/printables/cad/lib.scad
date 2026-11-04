// Tax the Richmen — shared physical constants (millimetres).
// Edit these, then rebuild with scripts/build-printables.py.
// Clearances are provisional FDM allowances, not measured fit tolerances.

flat = 70;                 // hex across flats; also the centre-to-centre pitch
base_h = 4.0;
topper_flat = 66;          // leaves a 2 mm lip on the base
plate_h = 2.2;
peg_d = 3.0;
peg_h = 2.4;
hole_clearance = 0.30;     // diametral: hole = peg + this
hole_d = peg_d + hole_clearance;
hole_depth = 2.6;
peg_orbit = 16;
key_scale = 1.35;          // one peg is elongated so toppers cannot rotate

cover_clearance = 0.35;    // per side, around the topper
cover_wall = 1.3;
cover_inner_flat = topper_flat + 2 * cover_clearance;
cover_outer_flat = cover_inner_flat + 2 * cover_wall;
cover_inner_h = 5.8;
cover_roof = 1.4;
cover_h = cover_inner_h + cover_roof;

notch_width = 8.6;
notch_reach = 3.2;
notch_depth = 1.6;
clip_w = 8.2;
clip_d = 6.0;
clip_h = 1.35;

center_keep = 13;          // roads and pipes stop this far from each hex centre
road_len = flat - 2 * center_keep;
road_w = 9;
road_h = 2.3;
pipe_d = 5.0;
pipe_clearance = 0.35;     // diametral, coupling bore

flag_peg_d = 3.2;
flag_clearance = 0.30;
flag_hole_d = flag_peg_d + flag_clearance;
flag_peg_h = 4.0;
hat_peg_d = 2.6;
hat_hole_d = 2.95;

chip_d = 13.2;
chip_h = 2.0;
chip_orbit = 28;           // sits on a vertex axis, clear of the road corridors
chip_recess = 0.45;

eps = 0.08;

function circumradius(across_flats) = across_flats / sqrt(3);

module hex(across, h) {
    cylinder(h = h, r = circumradius(across), center = false, $fn = 6);
}

// Flat normals of this hex point at 30°, 90°, 150°… (neighbour / road directions).
module road_corridors(width, h = 30) {
    for (a = [30:60:330])
        rotate([0, 0, a])
            translate([-circumradius(flat) - 2, -width / 2, -2])
                cube([2 * circumradius(flat) + 4, width, h]);
}

module peg_at(x, y, key = false) {
    translate([x, y, -peg_h])
        scale([key ? key_scale : 1, 1, 1])
            cylinder(h = peg_h + 0.2, d = peg_d, $fn = 16);
}

module hole_at(x, y, key = false) {
    translate([x, y, -eps])
        scale([key ? key_scale : 1, 1, 1])
            cylinder(h = hole_depth + eps, d = hole_d, $fn = 16);
}

module topper_pegs() {
    peg_at(0, peg_orbit, true);
    peg_at(peg_orbit * cos(210), peg_orbit * sin(210), false);
    peg_at(peg_orbit * cos(330), peg_orbit * sin(330), false);
}

module base_holes() {
    hole_at(0, peg_orbit, true);
    hole_at(peg_orbit * cos(210), peg_orbit * sin(210), false);
    hole_at(peg_orbit * cos(330), peg_orbit * sin(330), false);
}

module edge_notches() {
    for (a = [30:60:330])
        rotate([0, 0, a - 90])
            translate([-notch_width / 2, flat / 2 - notch_reach, -eps])
                cube([notch_width, notch_reach + 0.6, notch_depth + eps]);
}

module chip_seat() {
    translate([chip_orbit, 0, plate_h - chip_recess])
        cylinder(h = chip_recess + eps, d = chip_d + 0.50, $fn = 32);
}

module raised_text(label, size = 4.2, h = 0.6) {
    linear_extrude(h)
        text(str(label), size = size, font = "Liberation Sans:style=Bold", halign = "center", valign = "center", $fn = 12);
}

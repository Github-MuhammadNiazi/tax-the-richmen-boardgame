// Tax the Richmen — printable component kit.
// Open in OpenSCAD and set `part` (and `num` for number chips), or pass -D from the build script.
// Every part is one reusable geometry. Player colour is filament, not a separate file.

include <lib.scad>

part = "hex_base";
num = 5;

module hex_base() {
    difference() {
        hex(flat, base_h);
        base_holes();
        edge_notches();
    }
}

module topper_blank(seat = true) {
    difference() {
        hex(topper_flat, plate_h);
        if (seat) chip_seat();
    }
    topper_pegs();
}

module topper_artwork() {
    difference() {
        hex(topper_flat, plate_h);
        // Paper-insert rebate, stopped short of the lip and the chip seat.
        translate([0, 0, plate_h - 0.35]) hex(topper_flat - 3.2, 0.35 + eps);
        chip_seat();
    }
    topper_pegs();
}

// Keeps relief out of the six road corridors and the number-chip seat.
module relief_mask(h = 12) {
    difference() {
        translate([0, 0, plate_h - 0.45]) hex(topper_flat, h);
        road_corridors(road_w + 2.4, h + 4);
        translate([chip_orbit, 0, plate_h - 1])
            cylinder(h = h + 4, d = chip_d + 3.2, $fn = 28);
    }
}

module clip_relief(feature_h = 8) {
    intersection() {
        translate([0, 0, -0.25]) children();
        relief_mask(feature_h);
    }
}

module topper_city() {
    topper_blank();
    clip_relief() {
        for (a = [60, 180, 300])
            rotate([0, 0, a])
                translate([16, -3.2, plate_h])
                    cube([9, 6.4, 1.5]);
        for (a = [60, 180, 300])
            rotate([0, 0, a])
                translate([22, -2.2, plate_h])
                    cube([5.2, 4.4, 2.6]);
    }
}

module topper_village() {
    topper_blank();
    clip_relief() {
        for (a = [60, 300]) {
            rotate([0, 0, a]) {
                translate([16, -2.6, plate_h]) cube([6.5, 5.2, 1.6]);
                hull() {
                    translate([15.4, -3.0, plate_h + 1.5]) cube([7.6, 6.0, 0.4]);
                    translate([18.6, -3.0, plate_h + 3.3]) cube([1.0, 6.0, 0.4]);
                }
            }
        }
        rotate([0, 0, 180])
            translate([18, 0, plate_h])
                cylinder(h = 2.4, d = 3.4, $fn = 12);
    }
}

module topper_mine() {
    topper_blank();
    clip_relief() {
        rotate([0, 0, 180]) {
            translate([14, -5, plate_h]) cube([12, 10, 1.3]);
            difference() {
                translate([16, -3.2, plate_h]) cube([6, 6.4, 2.4]);
                translate([15.2, -1.8, plate_h + 0.4]) cube([4, 3.6, 2.4]);
            }
        }
        for (a = [60, 300])
            rotate([0, 0, a])
                translate([20, 0, plate_h])
                    cylinder(h = 2.2, d1 = 7, d2 = 1.2, $fn = 8);
    }
}

module topper_port() {
    topper_blank();
    clip_relief() {
        for (a = [60, 180, 300])
            rotate([0, 0, a])
                translate([14, -1.1, plate_h])
                    cube([12, 2.2, 1.15]);
        rotate([0, 0, 180])
            translate([20, -2.4, plate_h])
                cube([4.5, 4.8, 2.2]);
    }
}

module topper_oil() {
    topper_blank();
    clip_relief() {
        rotate([0, 0, 180]) {
            translate([15, -4, plate_h]) cube([8, 8, 0.9]);
            translate([18.2, -0.5, plate_h]) cube([1.0, 1.0, 3.4]);
            translate([16.2, 2.4, plate_h]) cube([1.0, 1.0, 3.4]);
            translate([16.0, -0.8, plate_h + 3.0]) cube([4.6, 4.2, 0.7]);
        }
        for (a = [60, 300])
            rotate([0, 0, a])
                translate([20, 0, plate_h])
                    cylinder(h = 1.6, d = 4.2, $fn = 16);
    }
}

module topper_mountain() {
    topper_blank();
    clip_relief() {
        for (a = [60, 180, 300])
            rotate([0, 0, a])
                translate([19, 0, plate_h])
                    cylinder(h = 2.8, d1 = 8.5, d2 = 0.6, $fn = 7);
    }
}

// Water and the Tax Office are inaccessible, so relief may use the centre.
module topper_water() {
    difference() {
        hex(topper_flat, plate_h);
        for (y = [-12, -4, 4, 12])
            translate([-circumradius(topper_flat), y, plate_h - 0.35])
                cube([2 * circumradius(topper_flat), 1.1, 0.5]);
    }
    topper_pegs();
    for (y = [-8, 0, 8])
        translate([0, y, plate_h - 0.2])
            scale([1.6, 0.35, 0.25])
                cylinder(h = 2.4, d = 10, $fn = 20);
}

module topper_tax() {
    difference() {
        hex(topper_flat, plate_h);
    }
    topper_pegs();
    translate([-6, -5, plate_h]) cube([12, 10, 1.2]);
    translate([-4.2, -3.6, plate_h + 1.0]) cube([8.4, 7.2, 2.2]);
    translate([-5.2, -4.2, plate_h + 3.0]) cube([10.4, 2.0, 0.7]);
    for (x = [-3, 0, 3])
        translate([x - 0.45, -4.4, plate_h + 1.0])
            cube([0.9, 0.8, 2.2]);
}

module hidden_cover() {
    difference() {
        hex(cover_outer_flat, cover_h);
        translate([0, 0, -eps]) hex(cover_inner_flat, cover_inner_h + eps);
        // Identical finger scoop on every cover. It does not reveal the tile beneath.
        rotate([0, 0, 90])
            translate([-6, circumradius(cover_outer_flat) - 2.2, -eps])
                cube([12, 4, 2.2]);
    }
    // Shared centre rivet, the same on all eight covers.
    translate([0, 0, cover_h - 0.12]) cylinder(h = 0.85, d = 4.2, $fn = 16);
}

module hex_clip() {
    translate([-clip_w / 2, -clip_d / 2, 0]) cube([clip_w, clip_d, clip_h]);
}

module fit_calibration() {
    translate([-46, -10, 0]) cube([92, 20, 4.2]);
    // Production pegs. The bar is labelled beside the matching holes.
    translate([-36, 5, 4.2]) cylinder(h = peg_h, d = peg_d, $fn = 20);
    translate([-36, -5, 4.2])
        scale([key_scale, 1, 1])
            cylinder(h = peg_h, d = peg_d, $fn = 16);
    translate([-24, 0, 4.2]) cylinder(h = flag_peg_h, d = flag_peg_d, $fn = 20);
    // Topper-peg holes at three diametral clearances. The middle one is the design value.
    for (i = [0:2]) {
        c = [0.20, hole_clearance, 0.45][i];
        translate([-8 + i * 10, 5, -eps]) cylinder(h = 2.8 + eps, d = peg_d + c, $fn = 20);
        translate([-8 + i * 10, -1.2, 4.2]) raised_text([20, 30, 45][i], 2.6, 0.55);
    }
    for (i = [0:2]) {
        c = [0.20, flag_clearance, 0.45][i];
        translate([24 + i * 8, -5, -eps]) cylinder(h = 2.8 + eps, d = flag_peg_d + c, $fn = 20);
    }
    translate([-36, 0, 4.2]) raised_text("PEGS", 2.4, 0.5);
    translate([28, 2.2, 4.2]) raised_text("FLAG", 2.4, 0.5);
}

module road_segment() {
    translate([-road_len / 2, -road_w / 2, 0]) cube([road_len, road_w, road_h]);
    translate([-road_len / 2, -road_w / 2, 0]) cube([road_len, 0.9, road_h + 0.45]);
    translate([-road_len / 2, road_w / 2 - 0.9, 0]) cube([road_len, 0.9, road_h + 0.45]);
    for (x = [-18:3.6:18])
        for (y = [-2.4, 0, 2.4])
            translate([x, y, road_h - 0.25])
                cube([2.5, 2.2, 0.75], center = true);
    difference() {
        translate([road_len / 2 - 7, 0, road_h - 0.15]) cylinder(h = 1.3, d = 6.6, $fn = 20);
        translate([road_len / 2 - 7, 0, road_h - 0.7]) cylinder(h = 2.2, d = flag_hole_d, $fn = 16);
    }
}

module pipeline_straight() {
    translate([-road_len / 2, -4, 0]) cube([road_len, 8, 1.5]);
    translate([-road_len / 2, 0, 3.5]) rotate([0, 90, 0]) cylinder(h = road_len, d = pipe_d, $fn = 24);
    for (x = [-16:8:16])
        translate([x, 0, 3.5]) rotate([0, 90, 0]) cylinder(h = 1.3, d = pipe_d + 1.3, center = true, $fn = 20);
    // Valve fin, standing in the pipe so the piece prints without support.
    translate([0, 0, 3.2]) rotate([0, 90, 0]) cylinder(h = 1.2, d = 6.4, center = true, $fn = 16);
    translate([0, 0, 5.6]) cube([1.2, 1.2, 2.2], center = true);
}

module pipeline_coupling() {
    difference() {
        union() {
            translate([0, 0, 4]) rotate([0, 90, 0]) cylinder(h = 16, d = pipe_d + 2 * 1.45, center = true, $fn = 24);
            translate([-8, -4.2, 0]) cube([16, 8.4, 2.4]);
        }
        translate([0, 0, 4]) rotate([0, 90, 0]) cylinder(h = 18, d = pipe_d + pipe_clearance, center = true, $fn = 24);
    }
}

module flag_socket_block() {
    difference() {
        children();
        translate([0, 0, -eps]) cylinder(h = flag_peg_h + eps, d = flag_hole_d, $fn = 16);
    }
}

module establishment() {
    translate([-6, -4.5, 0]) cube([12, 9, 1.6]);
    translate([-4.2, -3.2, 1.4]) cube([8.4, 6.4, 2.8]);
    hull() {
        translate([-4.8, -3.6, 4.0]) cube([9.6, 7.2, 0.35]);
        translate([-0.45, -3.6, 5.8]) cube([0.9, 7.2, 0.35]);
    }
    difference() {
        translate([0, 0, 5.7]) cylinder(h = 1.6, d = 6.0, $fn = 20);
        translate([0, 0, 3.4]) cylinder(h = 4.2, d = flag_hole_d, $fn = 16);
    }
    translate([-1.3, -4.7, 1.4]) cube([2.6, 1.0, 2.0]);
}

module office() {
    difference() {
        union() {
            translate([-5.5, -4.5, 0]) cube([11, 9, 1.4]);
            translate([-4.6, -3.6, 1.2]) cube([9.2, 7.2, 10.5]);
            translate([-5.2, -4.0, 11.4]) cube([10.4, 8.0, 1.0]);
        }
        // Door and window recesses. They do not pierce the walls.
        translate([-1.3, -4.0, 1.2]) cube([2.6, 1.0, 3.6]);
        for (x = [-2.6, 1.2])
            translate([x, -4.0, 6.2]) cube([1.8, 0.7, 2.4]);
        for (z = [3.4:2.4:9.5])
            translate([-3.6, -3.85, z]) cube([7.2, 0.6, 0.4]);
    }
    difference() {
        translate([-2.2, -2.2, 12.2]) cube([4.4, 4.4, 1.6]);
        translate([0, 0, 9.6]) cylinder(h = 4.4, d = flag_hole_d, $fn = 16);
    }
}

module flag() {
    translate([-1.6, -0.9, 0]) cube([3.2, 1.8, flag_peg_h + 0.4]);
    translate([0, 0, flag_peg_h]) cylinder(h = 11, d = flag_peg_d, $fn = 16);
    hull() {
        translate([-0.8, -0.7, flag_peg_h + 3.0]) cube([1.6, 1.4, 6.4]);
        translate([7.6, -0.65, flag_peg_h + 6.2]) cube([1.3, 1.3, 1.4]);
    }
}

module flag_ship() {
    translate([-1.8, -1.0, 0]) cube([3.6, 2.0, flag_peg_h + 0.4]);
    translate([0, 0, flag_peg_h]) cylinder(h = 15, d = flag_peg_d, $fn = 16);
    hull() {
        translate([-0.9, -0.75, flag_peg_h + 3.6]) cube([1.8, 1.5, 8.6]);
        translate([11, -0.7, flag_peg_h + 8.0]) cube([1.5, 1.4, 1.6]);
    }
}

module steel_vault() {
    difference() {
        translate([-10, -8, 0]) cube([20, 16, 14]);
        // Engraved door, wheel and hinge leaves. Nothing projects past the faces.
        translate([-7.2, 6.5, 1.6]) cube([14.4, 2, 10.6]);
        translate([0, 9, 7.2]) rotate([90, 0, 0]) cylinder(h = 3, d = 5.4, $fn = 20);
        translate([0, 9, 7.2]) rotate([90, 0, 0]) cylinder(h = 3.4, d = 2.2, $fn = 16);
        for (z = [3.4, 10.2])
            translate([-8.6, 6.2, z]) cube([1.6, 2.2, 2.4]);
    }
    for (x = [-6, 6])
        for (y = [-5, 5])
            translate([x, y, 14]) cylinder(h = 0.6, d = 1.5, $fn = 10);
}

module number_chip(n) {
    cylinder(h = chip_h, d = chip_d, $fn = 40);
    translate([0, 0, chip_h - 0.02])
        raised_text(n, n >= 10 ? 5.0 : 6.0, 0.7);
    difference() {
        translate([0, 0, chip_h - 0.02]) cylinder(h = 0.55, d = chip_d, $fn = 40);
        translate([0, 0, chip_h - 0.2]) cylinder(h = 1, d = chip_d - 1.6, $fn = 40);
    }
}

module steel_coin() {
    cylinder(h = 1.7, d = 18, $fn = 48);
    difference() {
        translate([0, 0, 1.55]) cylinder(h = 0.6, d = 18, $fn = 48);
        translate([0, 0, 1.4]) cylinder(h = 1, d = 15.4, $fn = 40);
    }
    translate([0, 0, 1.6]) raised_text("1", 6.2, 0.65);
    for (a = [0:45:315])
        rotate([0, 0, a])
            translate([0, 6.6, 1.6])
                cylinder(h = 0.45, d = 1.3, $fn = 8);
}

module market_plinth() {
    translate([-6, -5, 0]) cube([12, 10, 1.6]);
}

module market_wood() {
    market_plinth();
    translate([-4.2, -3.2, 1.4]) cube([8.4, 6.4, 3.6]);
    hull() {
        translate([-4.8, -3.6, 4.8]) cube([9.6, 7.2, 0.35]);
        translate([-0.4, -3.6, 7.6]) cube([0.8, 7.2, 0.35]);
    }
    translate([0, -3.2, 3.4]) rotate([90, 0, 0]) cylinder(h = 1.2, d = 3.4, center = true, $fn = 16);
}

module market_metal() {
    market_plinth();
    translate([-4.4, -3.4, 1.4]) cube([7.2, 6.8, 4.2]);
    translate([1.6, -0.2, 5.4]) cylinder(h = 4.4, d = 3.0, $fn = 12);
    translate([-1.2, -3.6, 1.5]) cube([2.4, 0.8, 2.2]);
}

module market_fuel() {
    market_plinth();
    translate([-2.4, 0.4, 1.4]) cylinder(h = 6.6, d = 4.0, $fn = 16);
    translate([2.2, 0.6, 1.4]) cylinder(h = 5.2, d = 3.4, $fn = 16);
    translate([-0.7, -4.8, 1.4]) cube([1.5, 2.6, 3.6]);
    translate([-1.5, -4.9, 4.6]) cube([3.0, 1.2, 0.5]);
}

module market_stone() {
    market_plinth();
    translate([-5, -3.2, 1.4]) cube([5.5, 6.4, 3.4]);
    translate([0.8, -3.4, 1.4]) cube([4.4, 6.8, 1.0]);
    hull() {
        translate([1.2, -2.6, 2.3]) cube([3.6, 1.0, 2.4]);
        translate([1.2, 1.6, 2.3]) cube([0.5, 1.0, 0.7]);
    }
}

module lease_token() {
    translate([-10, -7, 0]) cube([20, 14, 1.7]);
    translate([-0.7, -0.65, 1.45]) cube([1.4, 1.3, 5.0]);
    translate([-2.6, -0.65, 4.7]) cube([5.2, 1.3, 0.9]);
    hull() {
        translate([-0.8, -0.7, 1.45]) cube([1.5, 1.4, 1.3]);
        translate([-3.5, -0.7, 1.45]) cube([1.4, 1.4, 1.0]);
    }
    hull() {
        translate([-0.8, -0.7, 1.45]) cube([1.5, 1.4, 1.3]);
        translate([2.2, -0.7, 1.45]) cube([1.4, 1.4, 1.0]);
    }
}

module bid_marker() {
    difference() {
        translate([-12, -8, 0]) cube([24, 16, 2.5]);
        translate([2, 0, 1.5]) cylinder(h = 1.2, d = 15.7, $fn = 32);
    }
    translate([-8, 0, 2.5]) raised_text("BID", 3.2, 0.55);
}

module tax_inspector() {
    cylinder(h = 2.2, d = 18, $fn = 32);
    translate([-2.4, -1.4, 1.7]) cube([2.7, 5.4, 2.3]);
    translate([0.3, -1.4, 1.7]) cube([2.7, 5.4, 2.3]);
    translate([-2.0, -0.7, 3.2]) cube([2.3, 3.5, 7.6]);
    translate([0.2, -0.7, 3.2]) cube([2.3, 3.5, 7.6]);
    translate([-4.3, -2.3, 9.8]) cube([8.8, 5.4, 9.2]);
    translate([-1.0, -2.6, 11.4]) cube([2.0, 0.9, 6.4]);
    translate([-2.3, -2.1, 18.2]) cube([4.6, 4.6, 1.5]);
    translate([0, 0.2, 19.2]) cylinder(h = 3.2, d = 3.3, $fn = 16);
    translate([0, 0.2, 21.6]) cylinder(h = 5.4, d = 5.6, $fn = 24);
    translate([0, 0.2, 26.6]) cylinder(h = 3.3, d = hat_peg_d, $fn = 16);
    translate([-5.5, -1.5, 14.2]) cube([2.1, 3.2, 6.2]);
    translate([-6.7, -2.5, 12.2]) cube([1.5, 4.8, 6.4]);
    translate([3.3, -1.5, 13.6]) cube([2.2, 3.2, 6.6]);
    translate([4.0, -3.5, 2.0]) cube([3.8, 2.6, 10.2]);
    translate([4.4, -3.8, 11.4]) cube([2.8, 0.9, 1.5]);
}

module inspector_hat() {
    difference() {
        union() {
            cylinder(h = 1.35, d = 13.4, $fn = 36);
            translate([0, 0, 0.9]) cylinder(h = 4.6, d = 7.3, $fn = 28);
            translate([0, 0, 5.1]) sphere(d = 7.1, $fn = 24);
        }
        translate([0, 0, -eps]) cylinder(h = 3.5, d = hat_hole_d, $fn = 16);
    }
}

module inspector_ring() {
    difference() {
        cylinder(h = 2.0, d = 19, $fn = 40);
        translate([0, 0, -eps]) cylinder(h = 2.3, d = 13.5, $fn = 36);
    }
}

module upgrade_token() {
    difference() {
        union() {
            cylinder(h = 2.0, d = 12, $fn = 28);
            for (a = [0:30:330])
                rotate([0, 0, a])
                    translate([5.2, -1.15, 0])
                        cube([2.8, 2.3, 2.0]);
        }
        translate([0, 0, -eps]) cylinder(h = 2.4, d = 3.6, $fn = 16);
    }
}

module winning_ship() {
    hull() {
        translate([-16, -5, 0]) cube([22, 10, 3.4]);
        translate([4, -3.4, 0]) cube([10, 6.8, 4.4]);
        translate([14, -1.2, 0]) cube([5, 2.4, 2.6]);
    }
    translate([-6, -2.2, 3.2]) cube([7.2, 4.4, 2.6]);
    translate([-2.2, -1.6, 3.4]) cube([3.2, 3.2, 0.8]);
    translate([-1.4, 0, 5.4]) cylinder(h = 4.0, d = 2.8, $fn = 14);
    translate([1.6, 0, 5.4]) cylinder(h = 3.2, d = 2.4, $fn = 14);
    difference() {
        translate([-17.2, -3.2, 2.6]) cube([6.6, 6.4, 3.6]);
        translate([-13.9, 0, 2.8]) cylinder(h = 3.8, d = flag_hole_d, $fn = 16);
    }
}

module resource_money() {
    cylinder(h = 1.7, d = 15, $fn = 40);
    difference() {
        translate([0, 0, 1.5]) cylinder(h = 0.5, d = 15, $fn = 40);
        translate([0, 0, 1.35]) cylinder(h = 0.9, d = 11.6, $fn = 32);
    }
    translate([0, 0, 1.55]) cylinder(h = 0.5, d = 5.2, $fn = 20);
    for (a = [0:45:315])
        rotate([0, 0, a])
            translate([0, 5.6, 1.55])
                cylinder(h = 0.4, d = 1.15, $fn = 8);
}

module resource_wood() {
    for (y = [-2.3, 0, 2.3])
        translate([-8, y, 1.9]) rotate([0, 90, 0]) cylinder(h = 16, d = 3.8, $fn = 14);
    translate([-1.2, -3.4, 1.2]) cube([2.4, 6.8, 1.2]);
}

module resource_metal() {
    hull() {
        translate([-7.5, -3.2, 0]) cube([15, 6.4, 2.0]);
        translate([-5.5, -2.2, 1.7]) cube([11, 4.4, 1.5]);
    }
}

module resource_fuel() {
    cylinder(h = 12, d = 8, $fn = 24);
    translate([0, 0, 1.6]) cylinder(h = 1.15, d = 8.8, $fn = 24);
    translate([0, 0, 9.2]) cylinder(h = 1.15, d = 8.8, $fn = 24);
    translate([0, 0, 12]) cylinder(h = 0.8, d = 2.4, $fn = 12);
}

module resource_stone() {
    difference() {
        translate([-6, -5, 0]) cube([12, 10, 8]);
        translate([-7, -0.45, 3.6]) cube([14, 0.9, 1.3]);
    }
}

module pip_at(x, y, z, nx, ny, nz) {
    translate([x, y, z])
        translate([nx, ny, nz] * 0.15)
            sphere(d = 2.35, $fn = 10);
}

module dice_d6() {
    s = 16;
    difference() {
        cube([s, s, s]);
        // +Z : 1    -Z : 6
        pip_at(s / 2, s / 2, s, 0, 0, 1);
        for (ix = [0:1])
            for (iy = [0:2])
                pip_at(4.2 + ix * 7.6, 3.2 + iy * 4.8, 0, 0, 0, -1);
        // +Y : 2    -Y : 5
        for (p = [[5.2, 5.2], [10.8, 10.8]])
            pip_at(p[0], s, p[1], 0, 1, 0);
        for (ix = [-1:1])
            for (iy = [-1:1])
                if (abs(ix) + abs(iy) != 1 || (ix == 0 && iy == 0))
                    pip_at(s / 2 + ix * 4.6, 0, s / 2 + iy * 4.6, 0, -1, 0);
        // +X : 3    -X : 4
        for (p = [[4.6, 4.6], [8, 8], [11.4, 11.4]])
            pip_at(s, p[0], p[1], 1, 0, 0);
        for (p = [[4.4, 4.4], [4.4, 11.6], [11.6, 4.4], [11.6, 11.6]])
            pip_at(0, p[0], p[1], -1, 0, 0);
    }
}

module card_holder() {
    difference() {
        translate([0, 0, 0]) cube([68, 20, 18]);
        translate([3.5, 4.5, 3.2]) cube([61, 11, 16]);
    }
}

module token_tray() {
    difference() {
        cube([96, 28, 10]);
        for (i = [0:4])
            translate([3.2 + i * 18.4, 2.6, 2.0]) cube([16.2, 22.8, 9]);
    }
}

color([0.62, 0.61, 0.58]) {
if (part == "hex_base") hex_base();
else if (part == "topper_artwork") topper_artwork();
else if (part == "topper_city") topper_city();
else if (part == "topper_village") topper_village();
else if (part == "topper_mine") topper_mine();
else if (part == "topper_port") topper_port();
else if (part == "topper_oil") topper_oil();
else if (part == "topper_mountain") topper_mountain();
else if (part == "topper_water") topper_water();
else if (part == "topper_tax") topper_tax();
else if (part == "hidden_cover") hidden_cover();
else if (part == "hex_clip") hex_clip();
else if (part == "fit_calibration") fit_calibration();
else if (part == "road_segment") road_segment();
else if (part == "pipeline_straight") pipeline_straight();
else if (part == "pipeline_coupling") pipeline_coupling();
else if (part == "establishment") establishment();
else if (part == "office") office();
else if (part == "flag") flag();
else if (part == "flag_ship") flag_ship();
else if (part == "steel_vault") steel_vault();
else if (part == "number_chip") number_chip(num);
else if (part == "steel_coin") steel_coin();
else if (part == "market_wood") market_wood();
else if (part == "market_metal") market_metal();
else if (part == "market_fuel") market_fuel();
else if (part == "market_stone") market_stone();
else if (part == "lease_token") lease_token();
else if (part == "bid_marker") bid_marker();
else if (part == "tax_inspector") tax_inspector();
else if (part == "inspector_hat") inspector_hat();
else if (part == "inspector_ring") inspector_ring();
else if (part == "upgrade_token") upgrade_token();
else if (part == "winning_ship") winning_ship();
else if (part == "resource_money") resource_money();
else if (part == "resource_wood") resource_wood();
else if (part == "resource_metal") resource_metal();
else if (part == "resource_fuel") resource_fuel();
else if (part == "resource_stone") resource_stone();
else if (part == "dice") dice_d6();
else if (part == "card_holder") card_holder();
else if (part == "token_tray") token_tray();
else echo("Unknown part", part);
}

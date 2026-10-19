// ====================================================================
// PARAMETRISCHES WOHNMOBIL-GEHÄUSE FÜR ESP32-S3 & MMC5603
// v3.3: Halterung für Neigungssensor Murata SCL3300-D01-PCB
// v3.2: Einbauvarianten "laengs" und "quer" (Parameter einbau),
//       zweiter Deckel mit Pfeil "FRONT" zur langen Seite
// v3.1: Sensor quer (X-Pfeil in Gehäuselängsrichtung)
// v3: Sensor-Halterung (Messing-Einschmelzmuttern), Befestigungs-
//     flansch, Lüftungsschlitze, Fahrtrichtungspfeil,
//     verschraubter Deckel (4x M3 in Ecksäulen)
// Einbaulage: Boden (mit Flansch) an die Schrankdecke, Deckel unten
// ====================================================================

$fn = 60; // Rundung der Bohrungen

// --------------------------------------------------------------------
// Gehäuse
// --------------------------------------------------------------------
innen_laenge = 130; // 13cm für maximalen Sensor-Abstand
innen_breite = 45;  // Genug Platz für Kabel an den Seiten
innen_hoehe  = 28;  // Passend für ESP32 + USB-Rundbuchse

wandstaerke  = 2.5; // Stabile Wandung für PETG/ASA
bohrung_durchmesser = 12.0; // Für die runde USB-Buchse (ESP-Seite, X = 0)

// --------------------------------------------------------------------
// Adafruit MMC5603 (#5579) – 1.0" x 0.7", vier Löcher 2,5 mm
// Lochabstände VOR dem Druck mit dem Messschieber prüfen!
// --------------------------------------------------------------------
pcb_laenge  = 25.4;
pcb_breite  = 17.8;
loch_abst_l = 20.32;   // Lochmitte zu Lochmitte, entlang der Längsseite
loch_abst_b = 12.7;    // Lochmitte zu Lochmitte, entlang der Schmalseite

// --------------------------------------------------------------------
// EINBAUVARIANTE
//   "laengs" = Gehäuse-Längsachse in Fahrtrichtung (Stirnseite nach vorne)
//   "quer"   = Gehäuse quer zur Fahrtrichtung (lange Seite nach vorne);
//              die lange Anschlagkante erleichtert die genaue Ausrichtung
// Steuert die Lage der Sensorplatine und den Deckel (Pfeil "FRONT").
// --------------------------------------------------------------------
einbau = "laengs";

// Auf dem Adafruit #5579 steht der X-Pfeil quer zur langen Platinenkante.
// Der X-Pfeil muss immer zur Fahrzeugfront zeigen, daher:
//   laengs -> Platine quer im Gehäuse (90°), X entlang der Gehäuselänge
//   quer   -> Platine längs im Gehäuse (0°),  X entlang der Gehäusebreite
sensor_drehung  = (einbau == "quer") ? 0 : 90;
abstand_endwand = (einbau == "quer") ? 5 : 8;   // Platz zur Stirnwand (Kabelbogen)

standoff_hoehe = 5;
standoff_d     = 7;

// "insert" = Messing-Einschmelzmutter M2,5 (empfohlen)
// "mutter" = Durchgangsloch + Sechskanttasche von unten für Nylon-/Messingmutter
befestigung  = "insert";
insert_d     = 3.6;    // je nach Insert-Hersteller anpassen (Datenblatt)
insert_tiefe = 4.5;
durchgang_d  = 2.8;
mutter_sw    = 5.2;    // Schlüsselweite M2,5 + Spiel
mutter_h     = 2.0;

// --------------------------------------------------------------------
// Neigungssensor Murata SCL3300-D01-PCB (42,9 × 27,4 mm, Stiftleisten nach unten)
// Liegt quer im Gehäuse direkt vor dem Magnetometer.
// Lochabstände aus Produktfoto vermessen (±0,5 mm) – bei Lieferung mit dem
// Messschieber prüfen. M2-Schrauben lassen in den Platinenlöchern Spiel.
// --------------------------------------------------------------------
scl_einbauen      = true;
scl_laenge        = 42.9;   // lange Kante (liegt quer zum Gehäuse)
scl_breite        = 27.4;
scl_loch_abst_l   = 36.2;   // Lochmitte–Lochmitte entlang der langen Kante
scl_loch_abst_b   = 20.0;   // Lochmitte–Lochmitte entlang der kurzen Kante
scl_abstand_mmc   = 4;      // Luft zwischen SCL-Platine und Magnetometer-Platine
scl_standoff_hoehe = 16;    // Platz unter der Platine für Dupont-Stecker auf den Stiftleisten
scl_standoff_d    = 6;
scl_insert_d      = 3.2;    // Einschmelzmutter M2 (Datenblatt prüfen)
scl_insert_tiefe  = 4;

// --------------------------------------------------------------------
// Befestigung am Möbel (Laschen an beiden Längsseiten)
// Am Sensor-Ende Messing-/Nylonschrauben verwenden!
// --------------------------------------------------------------------
flansch_breite    = 10;
flansch_dicke     = 3;
flansch_loch_d    = 4.5;
flansch_loch_rand = 12;   // Abstand Lochmitte zur Stirnseite

// --------------------------------------------------------------------
// Deckel verschraubt: 4 Ecksäulen mit Messing-Einschmelzmuttern M3,
// Deckel mit Senkbohrungen für M3-Senkkopfschrauben (Messing/Nylon/A2)
// --------------------------------------------------------------------
saeule          = 7;      // Kantenlänge der Ecksäulen
insert_m3_d     = 4.0;    // je nach Insert-Hersteller (Datenblatt)
insert_m3_tiefe = 5.7;
deckel_loch_d   = 3.4;    // Durchgang M3
senkkopf_d      = 6.5;    // M3-Senkkopf (ISO 10642/DIN 7991) + Spiel

// --------------------------------------------------------------------
// Lüftung, Markierung
// --------------------------------------------------------------------
schlitz_b       = 2;
schlitz_l       = 18;
schlitze_je_ende = 3;

// Nur Variante "laengs":
// true  = Sensor-Ende (gegenüber USB) zeigt zur Fahrzeugfront
// false = USB-/ESP-Ende zeigt zur Fahrzeugfront
// (Variante "quer": Pfeil zeigt zu einer Längsseite; Deckel und Sensor
//  lassen sich um 180° gedreht montieren.)
vorne_ist_sensorseite = false;

// --------------------------------------------------------------------
// Abgeleitete Maße
// --------------------------------------------------------------------
aussen_laenge = innen_laenge + (2 * wandstaerke);
aussen_breite = innen_breite + (2 * wandstaerke);
aussen_hoehe  = innen_hoehe + wandstaerke; // Ohne Deckel

fuss_x  = (sensor_drehung == 0) ? pcb_laenge  : pcb_breite;
loch_dx = ((sensor_drehung == 0) ? loch_abst_l : loch_abst_b) / 2;
loch_dy = ((sensor_drehung == 0) ? loch_abst_b : loch_abst_l) / 2;

sensor_cx = wandstaerke + innen_laenge - abstand_endwand - fuss_x / 2;
sensor_cy = aussen_breite / 2;

mmc_start_x = sensor_cx - fuss_x / 2;
scl_cx = mmc_start_x - scl_abstand_mmc - scl_breite / 2;
scl_cy = aussen_breite / 2;
scl_loecher = [
    for (sx = [-1, 1]) for (sy = [-1, 1])
        [scl_cx + sx * scl_loch_abst_b / 2, scl_cy + sy * scl_loch_abst_l / 2]
];
esp_platz = scl_cx - scl_breite / 2 - wandstaerke;
echo(str("Freie Länge für den ESP32 ab Stirnwand (USB-Seite): ", esp_platz, " mm"));
echo(str("Abstand SCL3300-Chip zu MMC5603-Chip ca. ", sensor_cx - scl_cx, " mm"));
assert(!scl_einbauen || scl_laenge <= innen_breite - 1, "SCL3300-Platine passt nicht in die Innenbreite");

// Mittelpunkte der Deckelschrauben (Ecksäulen)
deckel_schrauben = [
    for (x = [wandstaerke + saeule / 2, wandstaerke + innen_laenge - saeule / 2])
        for (y = [wandstaerke + saeule / 2, wandstaerke + innen_breite - saeule / 2])
            [x, y]
];

sensor_loecher = [
    [sensor_cx - loch_dx, sensor_cy - loch_dy],
    [sensor_cx + loch_dx, sensor_cy - loch_dy],
    [sensor_cx - loch_dx, sensor_cy + loch_dy],
    [sensor_cx + loch_dx, sensor_cy + loch_dy]
];

// --------------------------------------------------------------------
module hauptgehaeuse() {
    difference() {
        union() {
            difference() {
                // Außenbox
                cube([aussen_laenge, aussen_breite, aussen_hoehe]);
                // Innenausschnitt
                translate([wandstaerke, wandstaerke, wandstaerke])
                    cube([innen_laenge, innen_breite, innen_hoehe + 1]);
            }

            // Abstandshalter für den Sensor
            for (p = sensor_loecher)
                translate([p[0], p[1], wandstaerke - 0.01])
                    cylinder(d = standoff_d, h = standoff_hoehe + 0.01);

            // Abstandshalter für den Neigungssensor
            if (scl_einbauen)
                for (p = scl_loecher)
                    translate([p[0], p[1], wandstaerke - 0.01])
                        cylinder(d = scl_standoff_d, h = scl_standoff_hoehe + 0.01);

            // Befestigungsflansch
            translate([0, -flansch_breite, 0])
                cube([aussen_laenge, aussen_breite + 2 * flansch_breite, flansch_dicke]);

            // Ecksäulen für die Deckelschrauben (bis Oberkante Rand)
            for (p = deckel_schrauben)
                translate([p[0] - saeule / 2, p[1] - saeule / 2, wandstaerke - 0.01])
                    cube([saeule, saeule, innen_hoehe + 0.01]);
        }

        // Einschmelzmuttern M3 in den Ecksäulen
        for (p = deckel_schrauben)
            translate([p[0], p[1], aussen_hoehe - insert_m3_tiefe])
                cylinder(d = insert_m3_d, h = insert_m3_tiefe + 1);

        // 12mm Bohrung an der vorderen Stirnseite (X = 0)
        translate([-0.5, aussen_breite / 2, wandstaerke + (innen_hoehe / 2)])
            rotate([0, 90, 0])
                cylinder(d = bohrung_durchmesser, h = wandstaerke + 1);

        // Bohrungen in den Abstandshaltern
        for (p = sensor_loecher) {
            if (befestigung == "insert") {
                translate([p[0], p[1], wandstaerke + standoff_hoehe - insert_tiefe])
                    cylinder(d = insert_d, h = insert_tiefe + 1);
            } else {
                translate([p[0], p[1], -1])
                    cylinder(d = durchgang_d, h = wandstaerke + standoff_hoehe + 2);
                translate([p[0], p[1], -0.01])
                    cylinder(d = mutter_sw / cos(30), h = mutter_h, $fn = 6);
            }
        }

        // Einschmelzmuttern M2 für den Neigungssensor
        if (scl_einbauen)
            for (p = scl_loecher)
                translate([p[0], p[1], wandstaerke + scl_standoff_hoehe - scl_insert_tiefe])
                    cylinder(d = scl_insert_d, h = scl_insert_tiefe + 1);

        // Löcher im Flansch
        for (x = [flansch_loch_rand, aussen_laenge - flansch_loch_rand])
            for (y = [-flansch_breite / 2, aussen_breite + flansch_breite / 2])
                translate([x, y, -1])
                    cylinder(d = flansch_loch_d, h = flansch_dicke + 2);
    }
}

// --------------------------------------------------------------------
module pfeil() {
    // Pfeil zeigt in +X; Länge 40 mm
    union() {
        translate([-20, -2.5]) square([28, 5]);
        polygon([[8, -8], [20, 0], [8, 8]]);
    }
}

module deckel(variante = einbau) {
    difference() {
        // Deckelplatte (Außenseite liegt auf dem Druckbett, z = 0)
        cube([aussen_laenge, aussen_breite, wandstaerke]);

        // Schraublöcher mit Senkung auf der Außenseite
        for (p = deckel_schrauben) {
            translate([p[0], p[1], -1])
                cylinder(d = deckel_loch_d, h = wandstaerke + 2);
// Keine Senkung, da Nylonschrauben mit Flachkopf vorhanden
//            translate([p[0], p[1], -0.01])
//                cylinder(d1 = senkkopf_d, d2 = deckel_loch_d,
//                         h = (senkkopf_d - deckel_loch_d) / 2);
        }

        // Lüftungsschlitze an beiden Enden (gegen Kondenswasser)
        for (i = [0 : schlitze_je_ende - 1]) {
            for (x = [12 + i * 5, aussen_laenge - 12 - i * 5])
                translate([x - schlitz_b / 2, (aussen_breite - schlitz_l) / 2, -1])
                    cube([schlitz_b, schlitz_l, wandstaerke + 2]);
        }

        // Fahrtrichtungspfeil + "FRONT" auf der Außenseite eingraviert
        // (von außen lesbar, daher gespiegelt)
        translate([aussen_laenge / 2, aussen_breite / 2, -0.01])
            linear_extrude(height = 0.8)
                mirror([0, 1, 0])
                    pfeil_markierung(variante);
    }
}

// Markierung je Einbauvariante (2D, Ursprung = Deckelmitte)
module pfeil_markierung(variante) {
    if (variante == "quer") {
        // Pfeil zeigt zur langen Seite (quer über den Deckel), Schrift daneben
        translate([14, 0]) rotate([0, 0, 90]) scale(0.7) pfeil();
        translate([-14, 0])
            text("FRONT", size = 6, halign = "center", valign = "center",
                 font = "Liberation Sans:style=Bold");
    } else {
        // Pfeil zeigt zur Stirnseite (entlang des Deckels)
        rotate([0, 0, vorne_ist_sensorseite ? 0 : 180]) {
            translate([+15, 0]) pfeil();
            translate([-23, 0])
                text("FRONT", size = 6, halign = "center", valign = "center",
                     font = "Liberation Sans:style=Bold");
        }
    }
}

// --------------------------------------------------------------------
// Rendert Gehäuse und passenden Deckel nebeneinander im Slicer.
// Variante oben über "einbau" wählen ("laengs" oder "quer").
// Gehäuse und Deckel unterscheiden sich nur in Platinenlage bzw. Pfeil.
// --------------------------------------------------------------------
hauptgehaeuse();

translate([0, aussen_breite + flansch_breite + 10, 0])
    deckel(einbau);

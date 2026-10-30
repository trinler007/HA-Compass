# HA-Compass – digitaler Kompass für das Wohnmobil

Ein ESP32-basierter Kompass für die **Enterprise NX-01** (IVECO Magirus 90-16 AW), eingebunden in Home Assistant über ESPHome.
Der Kompass liefert die Ausrichtung des Fahrzeugs in Grad – magnetisch und geografisch – als Grundlage für die Abstimmung mit Sonnen- und Mondstand.

## Projektziele

1. **Sensor & Einbindung in HA** – Hardware, Gehäuse, ESPHome-Firmware *(dieser Stand)*
2. **Dashboard** – Draufsicht des Fahrzeugs, Ausrichtung, Sonnen- und Mondverlauf für die aktuelle Position
3. **Erweiterungen** – z. B. Empfehlung zur Aufstellung und Ausrichtung der mobilen Solarpanels

## Funktionen (Stand Ziel 1)

| Funktion | Umsetzung |
| --- | --- |
| Magnetfeldmessung | Memsic MMC5603 (20 Bit, Auto-Set/Reset gegen Restmagnetisierung) |
| Hard-Iron-Kalibrierung | Kreisfahrt per Start-/Stopp-Button in HA, Plausibilitätsprüfung mit Rollback |
| Neigungskompensation | Nicken/Rollen vom SCL3300 im Gehäuse (alternativ Wasserwaagen-Sensor aus HA) |
| Z-Offset | Einmalig per Button auf ebenem Grund |
| Missweisung & Einbauwinkel | **Automatischer GPS-Abgleich** während der Fahrt (Kurs aus dem RUTX50 über [HA-Teltonika](https://github.com/trinler007/HA-Teltonika), NMEA-Stream) |
| Ausgabe | `Ausrichtung magnetisch`, `Ausrichtung geografisch` (0° = Nord, 90° = Ost) |
| Diagnose | Horizontalfeld (Störungserkennung), Korrekturwinkel, Anzahl GPS-Messpunkte |

## Repository-Struktur

```
├── custom_components/ha_compass/   HA-Integration: Sonne, Mond, Schattenseite, Ansicht + Lovelace-Karte
├── openhasp/                       openHASP-Seite 480 × 480
├── dashboard/                      Fahrzeuggrafik, Konzept
├── esphome/
│   ├── kompass.yaml               Gerätedatei für den ESPHome Builder (lädt die Pakete von GitHub)
│   ├── packages/                  kompass-basis.yaml (Kompass-Logik), Neigung: SCL3300 oder Wasserwaage aus HA
│   ├── components/scl3300/        ESPHome-Komponente für den Murata SCL3300
│   └── secrets.example.yaml       Vorlage für secrets.yaml
├── hardware/
│   ├── schaltplan.svg             Verdrahtung
│   └── gehaeuse/
│       └── camper-kompass-gehaeuse.scad   Parametrisches Gehäuse (OpenSCAD)
└── docs/
    ├── hardware.md                Bauteile, Verdrahtung, Gehäuse, Montage
    ├── inbetriebnahme.md          Schritt-für-Schritt-Anleitung, Tests, Fehlersuche
    └── funktionsweise.md          Koordinatensystem, Kalibrierung, Neigung, GPS-Abgleich
```

## Schnellstart

1. Hardware nach [docs/hardware.md](docs/hardware.md) aufbauen.
2. Die Einträge aus `esphome/secrets.example.yaml` in die `secrets.yaml` des ESPHome Builders übernehmen.
3. Inhalt von `esphome/kompass.yaml` als Gerät im ESPHome Builder anlegen, Einstellwerte unter `substitutions:` anpassen, flashen.
   Die gesamte Logik (Pakete und die Komponente `scl3300`) lädt ESPHome beim Kompilieren direkt aus diesem Repository (`ref: main`, Aktualisierung täglich).
   Änderungen im Repo landen also mit dem nächsten Kompilieren auf dem Gerät – für einen festen Stand `ref` auf einen Tag oder Commit setzen.
4. Inbetriebnahme nach [docs/inbetriebnahme.md](docs/inbetriebnahme.md) – Reihenfolge einhalten.

## Integration HA Compass

Über HACS als benutzerdefiniertes Repository (Typ *Integration*) hinzufügen, installieren, HA neu starten,
dann *Einstellungen → Geräte & Dienste → Integration hinzufügen → HA Compass*. Abgefragt wird nur die Entität der Ausrichtung.

Gerechnet wird mit der HA-Heimatposition (im Fahrzeug per GPS nachgeführt).

| Entität | Inhalt |
| --- | --- |
| `sensor.ha_compass_sonne_azimut` / `_hoehe` | Sonnenposition |
| `sensor.ha_compass_daemmerung_beginn`, `_sonnenaufgang`, `_sonnenmittag`, `_sonnenuntergang`, `_daemmerung_ende` | Zeiten des Tages; Auf-/Untergang mit Attribut `azimut` |
| `sensor.ha_compass_mond_azimut` / `_hoehe` / `_beleuchtung` / `_phase` | Mondposition und -phase |
| `sensor.ha_compass_mondaufgang` / `_monduntergang` | Mondzeiten des Tages |
| `sensor.ha_compass_sonne_relativ` | Sonnenwinkel zum Bug, −180…180°, + = rechts |
| `sensor.ha_compass_schattenseite` | `links`, `rechts`, `front`, `heck`, `keine` |
| `select.ha_compass_ansicht` | `fahrzeug_dreht` / `ring_dreht` |

## Voraussetzungen in Home Assistant

| Entität | Zweck |
| --- | --- |
| `sensor.technik_wasserwaage_truck_pitch` | Nicken: + = Front höher |
| `sensor.technik_wasserwaage_truck_roll` | Rollen: + = Fahrerseite (links) höher |
| `sensor.nx_01_position_gps_course` | GPS-Kurs über Grund |
| `sensor.nx_01_position_gps_speed` | Geschwindigkeit in km/h |
| `sensor.technik_nx01_gw01_gps_genauigkeit_hdop` | GPS-Genauigkeit |
| `binary_sensor.technik_nx01_gw01_nmea_tcp_status` | NMEA-Livestream aktiv |

## Status

- [x] Hardware aufgebaut, Firmware kompiliert und geflasht
- [x] Gehäuse konstruiert
- [x] Werkbanktests (Einheit µT, Gesamtfeld ≈ 45–55 µT, Rauschen ±0,25 µT, Kalibrierlogik inkl. Rollback)
- [x] Schaltung fertig, Gehäuse montiert (SCL3300-Kabel vorbereitet)
- [ ] Achsen-Vorzeichen in Einbaulage geprüft
- [x] ESPHome-Komponente SCL3300 + Paket (Nicken, Rollen, Höhendifferenzen, Hinweis, Nullpunkt)
- [ ] SCL3300 aufstecken, Achsen bestimmen, Nullpunkt setzen
- [ ] Z-Offset, Kreisfahrt-Kalibrierung, erste Fahrt mit GPS-Abgleich
- [x] Integration HA Compass (Sonne, Mond, Schattenseite, Ansicht)
- [x] openHASP-Seite
- [x] Lovelace-Karte `ha-compass-card` (ersetzt Horizon Card)
- [ ] Test in HA (Integration, Karte, openHASP)

## Lizenz

Apache License 2.0 – siehe [LICENSE](LICENSE).
Die Sonnen- und Mondberechnung basiert auf [SunCalc](https://github.com/mourner/suncalc) (BSD-2-Clause, © Vladimir Agafonkin) – siehe [NOTICE](NOTICE).

# Dashboard (Ziel 2)

## Fahrzeuggrafik

| Datei | Verwendung |
| --- | --- |
| `assets/nx01-top.svg` | Vektor-Draufsicht, Front oben, Maßstab 1 px = 10 mm, Drehpunkt (122.5, 349.5) – für Lovelace (Smartphone, Tablet, PC) |
| `assets/nx01-top-{120,180,240,360}.png` | transparente PNG-Exporte in fester Höhe – für openHASP (`img`-Objekt, Drehung über `angle`) |

Nachgezeichnet nach Drohnenaufnahmen (Tunesien) und den Fahrzeugmaßen (6990 × 2450 mm): Fahrerhaus mit Dachluke, Wohnkoffer mit 6 Solarmodulen (2 × 3), Dachfenster und zwei Lüftern im Heck.

## Konzept

![Konzept](konzept.png)

- Kompassring mit Himmelsrichtungen, Fahrzeug dreht mit `Ausrichtung geografisch`
- Sonnenbahn des Tages (Aufgang → Untergang) mit aktueller Sonnenposition
- Mondposition und -phase
- Text: Ausrichtung, Sonnen-/Mondstand, Sonne relativ zum Fahrzeug („Fahrerseite im Schatten“)

Die Mockup-Werte sind Beispielwerte.

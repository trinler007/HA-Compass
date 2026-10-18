# Funktionsweise

## Koordinatensystem

Intern rechnet die Firmware im Fahrzeugsystem **X = vorne, Y = rechts, Z = unten**.
Die Rohachsen des Sensors werden über `y_sign` und `z_sign` darauf abgebildet; X zeigt durch die Montage immer nach vorne.

Ausrichtung (Kurs) im Uhrzeigersinn ab Nord: `ψ = atan2(−Hy, Hx)`.

## Hard-Iron- und Skalierungskalibrierung (X/Y)

Bei der Kreisfahrt werden Minimum und Maximum von X und Y erfasst.
- **Offset** = Mittelpunkt (min + max) / 2 – entfernt das konstante Störfeld des Fahrzeugs
- **Skalierung** = mittlerer Radius / Achsenradius – macht aus der Ellipse einen Kreis

Ungültige Fahrten (Radius < 10 µT oder Achsenverhältnis außerhalb 0,7–1,4) werden verworfen; die vorherigen Werte bleiben erhalten.
Alle Kalibrierwerte liegen persistent im Flash (`restore_value`, sofortiges `sync()`).

## Z-Offset

Auf ebenem Grund misst die Z-Achse die Vertikalkomponente des Erdfelds plus den Fahrzeug-Offset:
`Z-Offset = Z gemessen − Z erwartet` (Kempten ≈ 43,5 µT).
Der Z-Offset wird nur für die Neigungskompensation gebraucht.

## Neigungskompensation

Nicken θ (Front hoch +) und Rollen φ (rechte Seite tief +) kommen vom Wasserwaagen-Sensor in HA:

```
Hx = X·cos θ + Y·sin θ·sin φ + Z·sin θ·cos φ
Hy = Y·cos φ − Z·sin φ
```

Weil das Erdfeld bei uns ca. 64° steil steht, bewirkt 1° Neigung ohne Kompensation rund 2° Kursfehler.
Ohne gültige Neigungswerte (oder > 30°) rechnet die Firmware ohne Kompensation weiter.

## Glättung

Rohwerte: Median über 5 Messungen (5 Hz).
Ausrichtung: gleitender Mittelwert über Sinus und Kosinus – dadurch kein Sprung beim Übergang 359° → 0°.

## GPS-Abgleich

Der magnetische Kurs weicht vom geografischen um die **Missweisung** (ortsabhängig) und den **Einbauwinkel** ab.
Beides zusammen lernt die Firmware während der Fahrt aus dem GPS-Kurs des RUTX50:

- Bedingungen: NMEA aktiv, ≥ 30 km/h, HDOP ≤ 2, GPS-Kurs und Kompass seit ≥ 5 s ruhig (echte Geradeausfahrt)
- Differenz GPS-Kurs − Kompass wird als Einheitsvektor gemittelt; anfangs schnell, später träge (min. 1 % pro Messpunkt)
- Nach 30 Messpunkten werden Ausreißer (> 20° Abweichung) verworfen
- Ergebnis wird persistent gespeichert und folgt auf langen Reisen der sich ändernden Missweisung

`Ausrichtung geografisch = Ausrichtung magnetisch + Korrektur` – dieser Wert ist direkt mit dem Sonnenazimut aus `sun.sun` vergleichbar.

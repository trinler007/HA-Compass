# Inbetriebnahme

Reihenfolge einhalten – jeder Schritt baut auf dem vorherigen auf.

## 1. Werkbanktests

Ziel: Hardware, Einheiten und Datenfluss prüfen, bevor etwas fest eingebaut ist.
Für diese Tests die Diagnose-Entitäten **Magnetfeld X/Y/Z roh** in HA aktivieren (standardmäßig deaktiviert).

| Test | Erwartung |
| --- | --- |
| I²C-Scan im Log | Gerät an `0x30` gefunden |
| Einheit | Gesamtfeld √(x²+y²+z²) ≈ 48 (µT). Liegt der Wert bei ≈ 0,48, liefert der Sensor Gauss – dann Schwellwerte in der YAML anpassen. |
| Rauschen | Sensor ruhig liegen lassen: Rohwerte schwanken um weniger als ±0,5 µT |
| Störungen am Tisch | ESP-Last (z. B. OTA-Update) und USB-Netzteil ein/aus: Rohwerte ändern sich nicht sprunghaft |
| X-Achse | Platine flach, X-Pfeil nach Norden (Handykompass): X roh ist maximal |
| HA-Werte im ESP | Im Log keine Warnungen zu den `homeassistant`-Sensoren; Neigungskompensation liefert plausible Werte |
| Buttons | „Kalibrierung starten“ → Binärsensor „Kalibrierung läuft“ an; „beenden“ ohne Drehung → Log meldet *Kalibrierung verworfen*, alte Werte bleiben aktiv |
| Mini-Kalibrierung | Start drücken, Platine flach mehrmals um 360° drehen, Stopp: Log meldet *Kalibrierung OK*, Ausrichtung folgt dem Handykompass grob (ohne Fahrzeug-Offsets) |

Die Achsen-Vorzeichen werden **nicht** am Tisch festgelegt, sondern in Einbaulage (Schritt 2).

## 2. Einbau und Achsen-Vorzeichen

Einbau nach [hardware.md](hardware.md#montage-im-fahrzeug). Danach in Einbaulage:

**`z_sign`** – Das Erdfeld zeigt bei uns steil nach unten.
Ist *Magnetfeld Z roh* deutlich **positiv** → `z_sign: "1.0"`, sonst `"-1.0"`.

**`y_sign`** – Im internen System zeigt Y nach rechts. Steht das Fahrzeug Richtung Osten, liegt Nord links, Y muss also negativ sein.
Praktisch: Y roh in zwei Fahrzeugrichtungen vergleichen (z. B. Nord und Ost). Wird Y beim Drehen im Uhrzeigersinn (Nord → Ost) **kleiner** → `y_sign: "1.0"`, sonst `"-1.0"`.

Wegen der Kopfüber-Montage landen voraussichtlich beide Werte bei `-1.0`.
Nach Änderung neu flashen.

## 3. Störtest am Einbauort

Sensor **Horizontalfeld** beobachten und jeweils ca. 1 Minute schalten:
Router an/aus · Schranktür auf/zu · Multiplus unter Last (z. B. Wasserkocher) · Funkgerät sendet.
Ziel: Ausrichtung schwankt um weniger als ±1°.

## 4. Z-Offset

Zu Hause auf ebenem Grund (Wasserwaage: Nicken und Rollen jeweils < 1,5°): Button **Kompass Z-Offset ermitteln**.
Die Messung dauert 10 s; das Ergebnis steht im Log.
`vertical_field_ut` (Standard 43,5 µT) ist die Vertikalkomponente des Erdfelds am Messort – genauer Wert über den NOAA Magnetic Field Calculator.

## 5. Kreisfahrt-Kalibrierung

Auf einer möglichst ebenen, freien Fläche:
1. **Kompass Kalibrierung starten**
2. Langsam **etwas mehr als einen vollen Kreis** fahren (Wendekreis 15,6 m → ca. 50 m Strecke)
3. **Kompass Kalibrierung beenden** (Sicherheits-Timeout: 3 min)

Der ESP prüft die Messung (beide Radien > 10 µT, Verhältnis 0,7–1,4) und verwirft unvollständige Kreise automatisch.

## 6. Erste Fahrt – GPS-Abgleich

Voraussetzung: NMEA-Stream des RUTX50 aktiv.
Bei Geradeausfahrt ab 30 km/h, HDOP < 2 und ruhigem Kurs sammelt der ESP Messpunkte (Sensor **GPS-Abgleich Messpunkte**).
**Kompass Korrektur** pendelt sich bei *Missweisung (ca. +4° im Allgäu) + Einbauwinkel* ein und wandert auf Reisen automatisch mit.

Kontrolle: Nach der Fahrt auf gerader Straße anhalten und **Ausrichtung geografisch** mit dem letzten GPS-Kurs vergleichen.
Größere Abweichungen im Stand deuten auf Störungen, die nur während der Fahrt auftreten (z. B. B2B-Lader).

## Fehlersuche

| Symptom | Ursache / Abhilfe |
| --- | --- |
| Ausrichtung um ~180° falsch | X-Pfeil zeigt nach hinten – Sensor um 180° drehen |
| Ost und West vertauscht | `y_sign` falsch |
| Fehler wächst mit Schräglage | `z_sign`, Z-Offset oder Gehäuse nicht parallel zur Wasserwaage |
| Ausrichtung springt bei Verbrauchern | Störquelle in Sensornähe – Horizontalfeld prüfen |
| GPS-Messpunkte steigen nicht | NMEA-Status, Geschwindigkeit, HDOP prüfen; Schalter „GPS-Abgleich“ an? |
| Kalibrierung verworfen | Kreis unvollständig oder Fahrt zu schnell – wiederholen |

## Bedienelemente in HA

| Entität | Typ | Zweck |
| --- | --- | --- |
| Ausrichtung magnetisch / geografisch | Sensor | Ergebnis (°) |
| Kompass Kalibrierung starten / beenden | Button | Kreisfahrt |
| Kompass Kalibrierung läuft | Binärsensor | Status |
| Kompass Z-Offset ermitteln | Button (Konfiguration) | einmalig auf ebenem Grund |
| GPS-Abgleich zurücksetzen | Button (Konfiguration) | Korrektur auf Startwert |
| Neigungskompensation, GPS-Abgleich | Schalter (Konfiguration) | Funktionen ein/aus |
| Kompass Korrektur, GPS-Abgleich Messpunkte, Horizontalfeld | Diagnose | Überwachung |

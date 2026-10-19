# Dashboard (Ziel 2)

## Fahrzeuggrafik

| Datei | Verwendung |
| --- | --- |
| `assets/nx01-top.svg` | Vektor-Draufsicht, Front oben, Maßstab 1 px = 10 mm, Drehpunkt (122.5, 349.5) – für Lovelace (Smartphone, Tablet, PC) |
| `assets/nx01-top-{120,180,240,360}.png` | transparente PNG-Exporte in fester Höhe – für openHASP (`img`-Objekt, Drehung über `angle`) |

Nachgezeichnet nach Drohnenaufnahmen (Tunesien), der Dachkamera und den Fahrzeugmaßen (6990 × 2450 mm):

- Fahrerhaus mit mittiger Dachprofilierung (Sicken)
- Wohnkoffer mit 6 Solarmodulen (2 × 3) und Dachfenster
- rechts in einer Flucht, von vorn nach hinten: 5G-Antenne (weiß), WiFi-Antenne (weiß), Kathrein HDZ 100 Kabel-Dachdurchführung
- Heck rechts: LoRa-Magnetfußantenne auf weißem Blech 35 × 35 cm, links daneben Starlink Mini

## Konzept

![Konzept](konzept.png)

- Kompassring mit Himmelsrichtungen; konfigurierbar: **Fahrzeug dreht** (Nord oben) oder **Ring dreht** (Fahrzeug fix, Fahrtrichtung oben)
- helles und dunkles Design (folgt dem HA-Theme)
- Horizontstreifen mit Sonnenhöhe über den Tag, Dämmerung, Auf-/Untergang, Mittag (ersetzt die Horizon Card)
- Sonnenbahn des Tages (Aufgang → Untergang) mit aktueller Sonnenposition
- Mondposition und -phase
- Text: Ausrichtung, Sonnen-/Mondstand, Sonne relativ zum Fahrzeug („Fahrerseite im Schatten“)

Die Mockup-Werte sind Beispielwerte.

## Architektur

```
HA-Compass (HACS-Integration, Domain ha_compass)
├── Sensoren für die aktuelle GPS-Position (nicht die HA-Heimatposition):
│   Sonne: Azimut, Höhe, Dämmerung, Aufgang, Mittag, Untergang
│   Mond:  Azimut, Höhe, Phase, Beleuchtung, Auf-/Untergang
│   relativ zum Fahrzeug: Sonnenwinkel zum Bug, beschattete Seite
├── Lovelace-Karte ha-compass-card (wird von der Integration mitgeliefert und registriert)
└── openHASP-Seite 480 × 480 (Vorlage)
```

Eine eigene Integration ist nötig, weil die HA-Integrationen `sun` und `moon` mit der festen Heimatposition rechnen
und keine Mondposition liefern. Im Wohnmobil muss mit der GPS-Position gerechnet werden.

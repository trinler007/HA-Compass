"""Konstanten für HA Compass."""

DOMAIN = "ha_compass"
CONF_HEADING = "heading_entity"
DEFAULT_HEADING = "sensor.camper_kompass_ausrichtung_geografisch"
UPDATE_SECONDS = 60

VIEW_VEHICLE = "fahrzeug_dreht"
VIEW_RING = "ring_dreht"
VIEW_OPTIONS = [VIEW_VEHICLE, VIEW_RING]

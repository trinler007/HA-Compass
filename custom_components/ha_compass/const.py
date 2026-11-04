"""Konstanten für HA Compass."""

DOMAIN = "ha_compass"
CONF_HEADING = "heading_entity"
DEFAULT_HEADING = "sensor.kompass_ausrichtung_geografisch"
UPDATE_SECONDS = 60

VIEW_VEHICLE = "fahrzeug_dreht"
VIEW_RING = "ring_dreht"
VIEW_OPTIONS = [VIEW_VEHICLE, VIEW_RING]

# Solar
CONF_PITCH = "pitch_entity"
CONF_ROLL = "roll_entity"
CONF_ROOF_WP = "roof_wp"
CONF_ROOF_POWER = "roof_power_entity"
CONF_MOBILE_WP = "mobile_wp"
CONF_MOBILE_POWER = "mobile_power_entity"
CONF_TEMPERATURE = "temperature_entity"
CONF_WEATHER = "weather_entity"
CONF_SYSTEM = "system_factor"

# Startwerte (NX-01)
DEFAULTS = {
    CONF_HEADING: DEFAULT_HEADING,
    CONF_PITCH: "sensor.kompass_neigung_langs",
    CONF_ROLL: "sensor.kompass_neigung_seitlich",
    CONF_ROOF_WP: 1140,
    CONF_ROOF_POWER: "sensor.victron_mqtt_solarcharger_278_solarcharger_yield_power",
    CONF_MOBILE_WP: 600,
    CONF_MOBILE_POWER: "sensor.victron_mqtt_solarcharger_277_solarcharger_yield_power",
    CONF_TEMPERATURE: "sensor.klima_aussen_temperature",
    CONF_WEATHER: "weather.forecast_home",
    CONF_SYSTEM: 85,
}
ENTITY_KEYS = (CONF_PITCH, CONF_ROLL, CONF_ROOF_POWER, CONF_MOBILE_POWER, CONF_TEMPERATURE, CONF_WEATHER)

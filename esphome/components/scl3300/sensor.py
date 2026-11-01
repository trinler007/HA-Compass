"""ESPHome-Plattform für den Murata SCL3300 (SCL3300-D01).

Liefert Nicken und Rollen im Fahrzeugsystem (über `orientation` zugeordnet),
optional die Rohbeschleunigungen der Sensorachsen und die Chiptemperatur.
"""
import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import sensor, spi
from esphome.const import (
    CONF_ACCELERATION_X,
    CONF_ACCELERATION_Y,
    CONF_ACCELERATION_Z,
    CONF_ID,
    CONF_MODE,
    CONF_TEMPERATURE,
    DEVICE_CLASS_TEMPERATURE,
    ICON_ACCELERATION_X,
    ICON_ACCELERATION_Y,
    ICON_ACCELERATION_Z,
    STATE_CLASS_MEASUREMENT,
    UNIT_CELSIUS,
    UNIT_DEGREES,
    UNIT_G,
)

DEPENDENCIES = ["spi"]

CONF_PITCH = "pitch"
CONF_ROLL = "roll"
CONF_ORIENTATION = "orientation"
CONF_FORWARD = "forward"
CONF_LEFT = "left"
CONF_UP = "up"

scl3300_ns = cg.esphome_ns.namespace("scl3300")
SCL3300Component = scl3300_ns.class_("SCL3300Component", cg.PollingComponent, spi.SPIDevice)

AXES = {"+x": (0, 1), "-x": (0, -1), "+y": (1, 1), "-y": (1, -1), "+z": (2, 1), "-z": (2, -1)}


def _axis(value):
    value = cv.string(value).lower().replace(" ", "")
    if value in ("x", "y", "z"):
        value = "+" + value
    if value not in AXES:
        raise cv.Invalid("Achse muss +x, -x, +y, -y, +z oder -z sein")
    return value


def _vec(axis):
    idx, sign = AXES[axis]
    v = [0, 0, 0]
    v[idx] = sign
    return v


def _validate_orientation(cfg):
    # Keine Prüfung auf Rechtshändigkeit: Die Vorzeichen werden empirisch bestimmt
    # (Achse oben misst +1 g, Anheben vorne/links erhöht den Wert) – das ist maßgeblich.
    if len({AXES[cfg[k]][0] for k in (CONF_FORWARD, CONF_LEFT, CONF_UP)}) != 3:
        raise cv.Invalid("forward, left und up müssen drei verschiedene Sensorachsen sein")
    return cfg


ORIENTATION_SCHEMA = cv.All(
    cv.Schema(
        {
            cv.Optional(CONF_FORWARD, default="+x"): _axis,
            cv.Optional(CONF_LEFT, default="+y"): _axis,
            cv.Optional(CONF_UP, default="+z"): _axis,
        }
    ),
    _validate_orientation,
)


def _accel(icon):
    return sensor.sensor_schema(
        unit_of_measurement=UNIT_G, icon=icon, accuracy_decimals=5, state_class=STATE_CLASS_MEASUREMENT
    )


def _angle(icon):
    return sensor.sensor_schema(
        unit_of_measurement=UNIT_DEGREES, icon=icon, accuracy_decimals=3, state_class=STATE_CLASS_MEASUREMENT
    )


CONFIG_SCHEMA = (
    cv.Schema(
        {
            cv.GenerateID(): cv.declare_id(SCL3300Component),
            # 1: ±1,2 g, 40 Hz (voller Winkelbereich) · 2: ±2,4 g, 70 Hz
            # 3/4: Neigungsmodus 10 Hz, nur bis ±10° gültig (4 = geringstes Rauschen)
            cv.Optional(CONF_MODE, default=1): cv.int_range(min=1, max=4),
            cv.Optional(CONF_ORIENTATION, default={}): ORIENTATION_SCHEMA,
            cv.Optional(CONF_PITCH): _angle("mdi:angle-acute"),
            cv.Optional(CONF_ROLL): _angle("mdi:angle-acute"),
            cv.Optional(CONF_ACCELERATION_X): _accel(ICON_ACCELERATION_X),
            cv.Optional(CONF_ACCELERATION_Y): _accel(ICON_ACCELERATION_Y),
            cv.Optional(CONF_ACCELERATION_Z): _accel(ICON_ACCELERATION_Z),
            cv.Optional(CONF_TEMPERATURE): sensor.sensor_schema(
                unit_of_measurement=UNIT_CELSIUS,
                accuracy_decimals=1,
                device_class=DEVICE_CLASS_TEMPERATURE,
                state_class=STATE_CLASS_MEASUREMENT,
            ),
        }
    )
    .extend(cv.polling_component_schema("100ms"))
    .extend(spi.spi_device_schema(cs_pin_required=True))
)


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    await spi.register_spi_device(var, config)

    cg.add(var.set_mode(config[CONF_MODE]))
    o = config[CONF_ORIENTATION]
    for key, setter in ((CONF_FORWARD, var.set_forward), (CONF_LEFT, var.set_left), (CONF_UP, var.set_up)):
        idx, sign = AXES[o[key]]
        cg.add(setter(idx, sign))

    for key, setter in (
        (CONF_PITCH, var.set_pitch_sensor),
        (CONF_ROLL, var.set_roll_sensor),
        (CONF_ACCELERATION_X, var.set_accel_x_sensor),
        (CONF_ACCELERATION_Y, var.set_accel_y_sensor),
        (CONF_ACCELERATION_Z, var.set_accel_z_sensor),
        (CONF_TEMPERATURE, var.set_temperature_sensor),
    ):
        if key in config:
            sens = await sensor.new_sensor(config[key])
            cg.add(setter(sens))

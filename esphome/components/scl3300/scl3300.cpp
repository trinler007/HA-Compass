#include "scl3300.h"
#include "esphome/core/hal.h"
#include "esphome/core/log.h"

#include <cmath>

namespace esphome {
namespace scl3300 {

static const char *const TAG = "scl3300";

// Befehlswörter inkl. CRC laut Datenblatt SCL3300-D01
static const uint32_t CMD_READ_ACC_X = 0x040000F7;
static const uint32_t CMD_READ_ACC_Y = 0x080000FD;
static const uint32_t CMD_READ_ACC_Z = 0x0C0000FB;
static const uint32_t CMD_READ_TEMP = 0x140000EF;
static const uint32_t CMD_READ_STATUS = 0x180000E5;
static const uint32_t CMD_READ_WHOAMI = 0x40000091;
static const uint32_t CMD_ENABLE_ANGLES = 0xB0001F6F;
static const uint32_t CMD_SW_RESET = 0xB4002098;
static const uint32_t CMD_MODE[4] = {0xB400001F, 0xB4000102, 0xB4000225, 0xB4000338};

static const uint8_t RS_NORMAL = 0x01;
static const uint8_t RS_ERROR = 0x03;
static const uint8_t WHOAMI_SCL3300 = 0xC1;
static const float K_RAD_TO_DEG = 57.29577951308232f;

uint8_t SCL3300Component::crc8(uint32_t frame) {
  uint8_t crc = 0xFF;
  for (int bit = 31; bit > 7; bit--) {
    uint8_t value = (frame >> bit) & 0x01;
    uint8_t temp = crc & 0x80;
    if (value)
      temp ^= 0x80;
    crc <<= 1;
    if (temp)
      crc ^= 0x1D;
  }
  return static_cast<uint8_t>(~crc);
}

uint32_t SCL3300Component::transfer_(uint32_t command) {
  uint8_t buf[4] = {static_cast<uint8_t>(command >> 24), static_cast<uint8_t>(command >> 16),
                    static_cast<uint8_t>(command >> 8), static_cast<uint8_t>(command)};
  this->enable();
  this->transfer_array(buf, 4);
  this->disable();
  delayMicroseconds(12);  // CSB mindestens 10 µs high zwischen zwei Rahmen
  return (static_cast<uint32_t>(buf[0]) << 24) | (static_cast<uint32_t>(buf[1]) << 16) |
         (static_cast<uint32_t>(buf[2]) << 8) | buf[3];
}

bool SCL3300Component::decode_(uint32_t response, uint16_t *data, uint8_t *rs) {
  if (crc8(response) != (response & 0xFF)) {
    this->crc_errors_++;
    return false;
  }
  *rs = (response >> 24) & 0x03;
  *data = (response >> 8) & 0xFFFF;
  return true;
}

float SCL3300Component::sensitivity_() const {
  switch (this->mode_) {
    case 2:
      return 3000.0f;
    case 3:
    case 4:
      return 12000.0f;
    default:
      return 6000.0f;
  }
}

bool SCL3300Component::init_sensor_() {
  this->transfer_(CMD_SW_RESET);
  delay(2);
  this->transfer_(CMD_MODE[this->mode_ - 1]);
  delay(this->mode_ >= 3 ? 100 : 30);
  this->transfer_(CMD_ENABLE_ANGLES);
  // Status dreimal lesen, um Startmeldungen zu löschen (Antwort kommt jeweils im nächsten Rahmen)
  this->transfer_(CMD_READ_STATUS);
  this->transfer_(CMD_READ_STATUS);
  this->transfer_(CMD_READ_STATUS);
  uint32_t status_resp = this->transfer_(CMD_READ_WHOAMI);
  uint32_t whoami_resp = this->transfer_(CMD_READ_STATUS);

  uint16_t data;
  uint8_t rs;
  if (!this->decode_(whoami_resp, &data, &rs)) {
    ESP_LOGE(TAG, "Keine gültige Antwort (CRC) – Verdrahtung/SPI prüfen");
    return false;
  }
  this->whoami_ = data & 0xFF;
  if (this->whoami_ != WHOAMI_SCL3300) {
    ESP_LOGE(TAG, "Kennung 0x%02X statt 0x%02X – kein SCL3300 oder falsch verdrahtet", this->whoami_,
             WHOAMI_SCL3300);
    return false;
  }
  if (this->decode_(status_resp, &data, &rs) && rs != RS_NORMAL)
    ESP_LOGW(TAG, "Status nach Start: RS=%u, STATUS=0x%04X", rs, data);
  return true;
}

void SCL3300Component::setup() {
  this->spi_setup();
  delay(2);
  if (!this->init_sensor_()) {
    this->mark_failed();
    return;
  }
  ESP_LOGI(TAG, "SCL3300 erkannt (WHOAMI 0x%02X), Modus %u", this->whoami_, this->mode_);
}

void SCL3300Component::update() {
  this->transfer_(CMD_READ_ACC_X);
  uint32_t r_x = this->transfer_(CMD_READ_ACC_Y);
  uint32_t r_y = this->transfer_(CMD_READ_ACC_Z);
  uint32_t r_z = this->transfer_(CMD_READ_TEMP);
  uint32_t r_t = this->transfer_(CMD_READ_STATUS);
  uint32_t r_s = this->transfer_(CMD_READ_WHOAMI);

  uint16_t d[4], status;
  uint8_t rs[4], rs_status;
  bool ok = this->decode_(r_x, &d[0], &rs[0]) && this->decode_(r_y, &d[1], &rs[1]) &&
            this->decode_(r_z, &d[2], &rs[2]) && this->decode_(r_t, &d[3], &rs[3]) &&
            this->decode_(r_s, &status, &rs_status);
  bool error = !ok;
  for (int i = 0; ok && i < 4; i++)
    if (rs[i] == RS_ERROR)
      error = true;

  if (error) {
    this->status_errors_++;
    if (++this->consecutive_errors_ >= 10) {
      ESP_LOGW(TAG, "Wiederholte Fehler (STATUS=0x%04X, CRC-Fehler %u) – Sensor wird neu initialisiert", status,
               (unsigned) this->crc_errors_);
      this->consecutive_errors_ = 0;
      this->init_sensor_();
    }
    this->status_set_warning();
    return;
  }
  this->consecutive_errors_ = 0;
  this->status_clear_warning();

  const float sens = this->sensitivity_();
  float acc[3];
  for (int i = 0; i < 3; i++) {
    acc[i] = static_cast<int16_t>(d[i]) / sens;
    if (this->accel_sensor_[i] != nullptr)
      this->accel_sensor_[i]->publish_state(acc[i]);
  }
  if (this->temperature_sensor_ != nullptr)
    this->temperature_sensor_->publish_state(-273.0f + d[3] / 18.9f);

  // Fahrzeugsystem: vorne, links, oben. In Ruhe zeigt die Beschleunigung +1 g nach oben.
  const float a_f = this->sign_[0] * acc[this->axis_[0]];
  const float a_l = this->sign_[1] * acc[this->axis_[1]];
  const float a_u = this->sign_[2] * acc[this->axis_[2]];
  if (!this->up_warned_ && a_u < 0.5f) {
    ESP_LOGW(TAG, "Achse 'up' misst %.2f g statt ~+1 g – orientation prüfen (Sensor kopfüber?)", a_u);
    this->up_warned_ = true;
  }
  if (this->pitch_sensor_ != nullptr)
    this->pitch_sensor_->publish_state(std::atan2(a_f, std::sqrt(a_l * a_l + a_u * a_u)) * K_RAD_TO_DEG);
  if (this->roll_sensor_ != nullptr)
    this->roll_sensor_->publish_state(std::atan2(a_l, std::sqrt(a_f * a_f + a_u * a_u)) * K_RAD_TO_DEG);
}

void SCL3300Component::dump_config() {
  static const char *const NAMES[3] = {"x", "y", "z"};
  ESP_LOGCONFIG(TAG, "SCL3300:");
  LOG_SPI_DEVICE(this);
  ESP_LOGCONFIG(TAG, "  Kennung: 0x%02X, Modus: %u", this->whoami_, this->mode_);
  ESP_LOGCONFIG(TAG, "  Achsen: vorne=%c%s links=%c%s oben=%c%s", this->sign_[0] > 0 ? '+' : '-',
                NAMES[this->axis_[0]], this->sign_[1] > 0 ? '+' : '-', NAMES[this->axis_[1]],
                this->sign_[2] > 0 ? '+' : '-', NAMES[this->axis_[2]]);
  if (this->is_failed())
    ESP_LOGE(TAG, "  Kommunikation fehlgeschlagen");
  LOG_UPDATE_INTERVAL(this);
  LOG_SENSOR("  ", "Nicken", this->pitch_sensor_);
  LOG_SENSOR("  ", "Rollen", this->roll_sensor_);
  LOG_SENSOR("  ", "Temperatur", this->temperature_sensor_);
}

}  // namespace scl3300
}  // namespace esphome

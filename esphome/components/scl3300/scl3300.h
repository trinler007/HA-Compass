#pragma once

#include "esphome/core/component.h"
#include "esphome/components/sensor/sensor.h"
#include "esphome/components/spi/spi.h"

namespace esphome {
namespace scl3300 {

/// Murata SCL3300: 32-Bit-SPI-Rahmen (Mode 0), Antwort jeweils im folgenden Rahmen ("off-frame").
class SCL3300Component : public PollingComponent,
                         public spi::SPIDevice<spi::BIT_ORDER_MSB_FIRST, spi::CLOCK_POLARITY_LOW,
                                               spi::CLOCK_PHASE_LEADING, spi::DATA_RATE_2MHZ> {
 public:
  void setup() override;
  void update() override;
  void dump_config() override;
  float get_setup_priority() const override { return setup_priority::DATA; }

  void set_mode(uint8_t mode) { this->mode_ = mode; }
  void set_forward(uint8_t idx, int8_t sign) { this->axis_[0] = idx; this->sign_[0] = sign; }
  void set_left(uint8_t idx, int8_t sign) { this->axis_[1] = idx; this->sign_[1] = sign; }
  void set_up(uint8_t idx, int8_t sign) { this->axis_[2] = idx; this->sign_[2] = sign; }

  void set_pitch_sensor(sensor::Sensor *s) { this->pitch_sensor_ = s; }
  void set_roll_sensor(sensor::Sensor *s) { this->roll_sensor_ = s; }
  void set_accel_x_sensor(sensor::Sensor *s) { this->accel_sensor_[0] = s; }
  void set_accel_y_sensor(sensor::Sensor *s) { this->accel_sensor_[1] = s; }
  void set_accel_z_sensor(sensor::Sensor *s) { this->accel_sensor_[2] = s; }
  void set_temperature_sensor(sensor::Sensor *s) { this->temperature_sensor_ = s; }

  static uint8_t crc8(uint32_t frame);

 protected:
  bool init_sensor_();
  uint32_t transfer_(uint32_t command);
  bool decode_(uint32_t response, uint16_t *data, uint8_t *rs);
  float sensitivity_() const;

  uint8_t mode_{1};
  uint8_t axis_[3]{0, 1, 2};
  int8_t sign_[3]{1, 1, 1};
  uint8_t whoami_{0};
  uint32_t crc_errors_{0};
  uint32_t status_errors_{0};
  uint8_t consecutive_errors_{0};
  bool up_warned_{false};

  sensor::Sensor *pitch_sensor_{nullptr};
  sensor::Sensor *roll_sensor_{nullptr};
  sensor::Sensor *accel_sensor_[3]{nullptr, nullptr, nullptr};
  sensor::Sensor *temperature_sensor_{nullptr};
};

}  // namespace scl3300
}  // namespace esphome

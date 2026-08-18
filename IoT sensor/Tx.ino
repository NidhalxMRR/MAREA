#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#include <OneWire.h>
#include <DallasTemperature.h>

#include <TinyGPS++.h>

// =====================================================
// DEVICE CONFIGURATION
// =====================================================

#define NODE_NAME "NODE1"

// =====================================================
// SENSOR PINS (TTGO LORA32 V1.3 SX1276)
// =====================================================

#define I2C_SDA          21
#define I2C_SCL          22

#define DS18B20_PIN      13

// GPS TX -> ESP32 GPIO34
#define GPS_RX_PIN       34

// ESP32 GPIO12 -> GPS RX
#define GPS_TX_PIN       12

#define OLED_RST         16

// TTGO LoRa SPI PINS
#define LORA_SCK         5
#define LORA_MISO        19
#define LORA_MOSI        27

#define LORA_SS          18
#define LORA_RST         14
#define LORA_DIO0        26

// =====================================================
// LORA SETTINGS
// =====================================================

#define LORA_FREQ        868.8E6
#define LORA_TX_POWER    10

#define LORA_BANDWIDTH   125E3
#define LORA_SF          7
#define LORA_CR          5
#define LORA_SYNC_WORD   0x12

// Sensor display/update every 2 seconds
#define SENSOR_INTERVAL  2000UL

// LoRa transmission every 32 seconds
#define SEND_INTERVAL    32000UL

// Retry MPU every 5 seconds if missing
#define MPU_RETRY_INTERVAL 5000UL

// =====================================================
// OLED DISPLAY
// =====================================================

#define SCREEN_WIDTH     128
#define SCREEN_HEIGHT    64

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  OLED_RST
);

bool oledOK = false;

// =====================================================
// MPU6050 IMU
// =====================================================

Adafruit_MPU6050 mpu;

bool mpuOK = false;
uint8_t mpuAddress = 0;

unsigned long lastMPURetry = 0;

// =====================================================
// DS18B20 TEMPERATURE SENSOR
// =====================================================

OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

// =====================================================
// GPS MODULE
// =====================================================

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

// =====================================================
// TELEMETRY DATA STRUCTURE
// =====================================================

struct TelemetryData {
  bool tempOK;
  float temperature;

  bool mpuOK;
  float ax;
  float ay;
  float az;
  float gx;
  float gy;
  float gz;

  bool gpsOK;
  double latitude;
  double longitude;
  uint32_t satellites;
  float altitude;
  float hdop;
};

TelemetryData data;

// =====================================================
// TIMING & STATE VARIABLES
// =====================================================

unsigned long lastSensorUpdate = 0;
unsigned long lastSend = 0;

uint32_t sequenceNumber = 0;
uint8_t displayPage = 0;

bool loraOK = false;

// =====================================================
// I2C SCANNER DIAGNOSTIC
// =====================================================

void scanI2C() {
  Serial.println();
  Serial.println("[I2C] Scanning bus...");

  int found = 0;
  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    uint8_t error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("[I2C] Device found at 0x%02X\n", address);
      found++;
    }
  }

  if (found == 0) {
    Serial.println("[I2C] NO DEVICES FOUND!");
  } else {
    Serial.printf("[I2C] %d device(s) found\n", found);
  }
  Serial.println();
}

// =====================================================
// INITIALIZE MPU6050 WITH AUTO-RETRY & ALTERNATE ADDR
// =====================================================

bool initializeMPU() {
  Serial.println("[MPU] Searching for MPU6050...");

  // Try standard address 0x68
  if (mpu.begin(0x68, &Wire)) {
    mpuAddress = 0x68;
    mpuOK = true;
  }
  // Try alternate address 0x69
  else if (mpu.begin(0x69, &Wire)) {
    mpuAddress = 0x69;
    mpuOK = true;
  }
  else {
    mpuOK = false;
    mpuAddress = 0;
    Serial.println("[-] MPU6050 not found at 0x68 or 0x69");
    return false;
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.printf("[+] MPU6050 initialized at 0x%02X\n", mpuAddress);
  return true;
}

// =====================================================
// SETUP
// =====================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==========================================");
  Serial.println(" TTGO SENSOR + GPS + LORA TRANSMITTER (TX)");
  Serial.println("==========================================");

  // 1. I2C Bus Initialization (100 kHz for stability)
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);

  // Run diagnostic scan
  scanI2C();

  // 2. OLED Initialization
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("[-] OLED failed to initialize");
  } else {
    oledOK = true;
    Serial.println("[+] OLED OK");
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("SENSOR NODE");
    display.println("Starting...");
    display.display();
  }

  // 3. MPU6050 IMU Initialization
  initializeMPU();

  // 4. DS18B20 Temp Sensor Initialization
  ds18b20.begin();
  Serial.println("[+] DS18B20 initialized");

  // 5. GPS Hardware Serial Initialization
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[+] GPS Serial started @ 9600 baud");

  // 6. LoRa Transceiver Initialization
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  Serial.println("[*] Starting LoRa...");
  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("[-] LoRa initialization FAILED!");
    loraOK = false;
  } else {
    loraOK = true;
    LoRa.setTxPower(LORA_TX_POWER);
    LoRa.setSignalBandwidth(LORA_BANDWIDTH);
    LoRa.setSpreadingFactor(LORA_SF);
    LoRa.setCodingRate4(LORA_CR);
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.enableCrc();

    Serial.println("[+] LoRa initialized successfully");
    Serial.println("[+] Frequency : 868.8 MHz");
    Serial.println("[+] TX Power  : 10 dBm");
    Serial.println("[+] TX every  : 32 seconds");
  }

  Serial.println("==========================================");

  // Send first packet ~5s after boot
  lastSend = millis() - SEND_INTERVAL + 5000;
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {
  // Continuously feed incoming GPS sentences
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Retry MPU detection periodically if missing
  if (!mpuOK && (millis() - lastMPURetry >= MPU_RETRY_INTERVAL)) {
    lastMPURetry = millis();
    Serial.println("\n[MPU] Retrying detection...");
    initializeMPU();
  }

  // Sensor reading update every 2 seconds
  if (millis() - lastSensorUpdate >= SENSOR_INTERVAL) {
    lastSensorUpdate = millis();
    readSensors();
    printSensors();
    updateOLED();
  }

  // LoRa transmission every 32 seconds
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendLoRaPacket();
  }
}

// =====================================================
// READ SENSORS
// =====================================================

void readSensors() {
  // 1. DS18B20 Water Temperature
  ds18b20.requestTemperatures();
  float temp = ds18b20.getTempCByIndex(0);

  data.tempOK = (temp != DEVICE_DISCONNECTED_C && temp > -100.0f && temp < 125.0f);
  data.temperature = data.tempOK ? temp : 0.0f;

  // 2. MPU6050 Motion Data
  data.mpuOK = mpuOK;
  if (mpuOK) {
    sensors_event_t a, g, tempMPU;
    mpu.getEvent(&a, &g, &tempMPU);

    data.ax = a.acceleration.x;
    data.ay = a.acceleration.y;
    data.az = a.acceleration.z;
    data.gx = g.gyro.x;
    data.gy = g.gyro.y;
    data.gz = g.gyro.z;
  } else {
    data.ax = 0.0f; data.ay = 0.0f; data.az = 0.0f;
    data.gx = 0.0f; data.gy = 0.0f; data.gz = 0.0f;
  }

  // 3. GPS Position & Fix Stats
  data.gpsOK = gps.location.isValid() && (gps.location.age() < 5000);

  data.satellites = gps.satellites.isValid() ? gps.satellites.value() : 0;

  if (data.gpsOK) {
    data.latitude = gps.location.lat();
    data.longitude = gps.location.lng();
    data.altitude = gps.altitude.isValid() ? gps.altitude.meters() : 0.0f;
    data.hdop = gps.hdop.isValid() ? gps.hdop.hdop() : 0.0f;
  } else {
    data.latitude = 0.0;
    data.longitude = 0.0;
    data.altitude = 0.0f;
    data.hdop = 0.0f;
  }
}

// =====================================================
// PRINT SENSOR DATA TO SERIAL CONSOLE
// =====================================================

void printSensors() {
  Serial.println();
  Serial.println("==========================================");
  Serial.println("LOCAL SENSOR DATA");
  Serial.println("------------------------------------------");
  Serial.printf("Temperature : %.2f C [%s]\n", data.temperature, data.tempOK ? "OK" : "ERROR");

  if (data.mpuOK) {
    Serial.printf("Accel X     : %.2f m/s2\n", data.ax);
    Serial.printf("Accel Y     : %.2f m/s2\n", data.ay);
    Serial.printf("Accel Z     : %.2f m/s2\n", data.az);
    Serial.printf("Gyro X      : %.3f rad/s\n", data.gx);
    Serial.printf("Gyro Y      : %.3f rad/s\n", data.gy);
    Serial.printf("Gyro Z      : %.3f rad/s\n", data.gz);
  } else {
    Serial.println("MPU6050     : NOT DETECTED");
  }

  if (data.gpsOK) {
    Serial.printf("Latitude    : %.6f\n", data.latitude);
    Serial.printf("Longitude   : %.6f\n", data.longitude);
    Serial.printf("Satellites  : %lu\n", (unsigned long)data.satellites);
    Serial.printf("Altitude    : %.1f m\n", data.altitude);
    Serial.printf("HDOP        : %.2f\n", data.hdop);
  } else {
    Serial.println("GPS Fix     : NO");
    Serial.printf("Satellites  : %lu\n", (unsigned long)data.satellites);
  }
  Serial.println("==========================================");
}

// =====================================================
// TRANSMIT LORA PACKET (17 FIELDS WITH HEALTH FLAGS)
// =====================================================

void sendLoRaPacket() {
  if (!loraOK) {
    Serial.println("[-] LoRa unavailable - packet not sent");
    return;
  }

  sequenceNumber++;

  char packet[240];
  snprintf(packet, sizeof(packet),
    "%s,%lu,"
    "%d,%.2f,"
    "%d,%.2f,%.2f,%.2f,"
    "%.3f,%.3f,%.3f,"
    "%d,%.6f,%.6f,"
    "%lu,%.1f,%.2f",
    NODE_NAME,
    (unsigned long)sequenceNumber,
    data.tempOK ? 1 : 0,
    data.temperature,
    data.mpuOK ? 1 : 0,
    data.ax, data.ay, data.az,
    data.gx, data.gy, data.gz,
    data.gpsOK ? 1 : 0,
    data.latitude, data.longitude,
    (unsigned long)data.satellites,
    data.altitude,
    data.hdop
  );

  Serial.println();
  Serial.println("******************************************");
  Serial.printf("LORA TRANSMISSION #%lu\n", (unsigned long)sequenceNumber);
  Serial.print("TX >> ");
  Serial.println(packet);

  LoRa.beginPacket();
  LoRa.print(packet);
  int result = LoRa.endPacket();

  if (result == 1) {
    Serial.println("[+] PACKET SENT");
  } else {
    Serial.println("[-] PACKET SEND FAILED");
  }
  Serial.println("******************************************");
}

// =====================================================
// UPDATE OLED DISPLAY
// =====================================================

void updateOLED() {
  if (!oledOK) return;

  display.clearDisplay();
  display.setCursor(0, 0);

  if (displayPage == 0) {
    display.println("--- SENSORS ---");
    display.printf("Temp: %.2f C\n", data.temperature);

    if (data.mpuOK) {
      display.printf("AX: %.2f\n", data.ax);
      display.printf("AY: %.2f\n", data.ay);
      display.printf("AZ: %.2f\n", data.az);
      display.println("MPU: OK");
    } else {
      display.println();
      display.println("MPU: NOT FOUND");
    }
    displayPage = 1;
  } else {
    display.println("--- GPS / LORA ---");
    if (data.gpsOK) {
      display.printf("Lat: %.5f\n", data.latitude);
      display.printf("Lon: %.5f\n", data.longitude);
      display.printf("Sats: %lu\n", (unsigned long)data.satellites);
      display.println("GPS: FIX");
    } else {
      display.println("GPS: SEARCHING");
      display.printf("Sats: %lu\n", (unsigned long)data.satellites);
    }
    display.printf("TX Seq: %lu\n", (unsigned long)sequenceNumber);
    displayPage = 0;
  }

  display.display();
}

#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// =====================================================
// OLED PINS & CONFIG (TTGO LORA32 V1.3)
// =====================================================

#define I2C_SDA          21
#define I2C_SCL          22
#define OLED_RST         16

#define SCREEN_WIDTH     128
#define SCREEN_HEIGHT    64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RST);
bool oledOK = false;

// =====================================================
// LORA PINS & SETTINGS (TTGO LORA32 V1.3 SX1276)
// =====================================================

#define LORA_SCK         5
#define LORA_MISO        19
#define LORA_MOSI        27
#define LORA_SS          18
#define LORA_RST         14
#define LORA_DIO0        26

// RF Configuration (Matches TX)
#define LORA_FREQ        868.8E6
#define LORA_BANDWIDTH   125E3
#define LORA_SF          7
#define LORA_CR          5
#define LORA_SYNC_WORD   0x12

// =====================================================
// RECEIVED TELEMETRY STRUCTURE (17-FIELD PACKET MATCH)
// =====================================================

struct RxData {
  char nodeName[16];
  uint32_t seq;
  
  bool tempOK;
  float temp;
  
  bool mpuOK;
  float ax, ay, az;
  float gx, gy, gz;
  
  bool gpsOK;
  double lat, lon;
  uint32_t sats;
  float alt, hdop;
  
  int rssi;
  float snr;
} rxData;

uint32_t packetCount = 0;

// =====================================================
// SETUP
// =====================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==========================================");
  Serial.println(" TTGO LORA RECEIVER (RX) - MAREA GATEWAY");
  Serial.println("==========================================");

  // Initialize OLED
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("[-] OLED initialization failed!"));
  } else {
    oledOK = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("MAREA Gateway");
    display.println("LoRa Receiver Ready");
    display.println("Listening on 868.8MHz");
    display.display();
  }

  // Initialize LoRa Radio
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("[-] LoRa radio initialization failed!");
    while (1);
  }

  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setCodingRate4(LORA_CR);
  LoRa.setSyncWord(LORA_SYNC_WORD);
  LoRa.enableCrc();

  Serial.println("[+] LoRa receiver listening on 868.8 MHz...\n");
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String incoming = "";
    while (LoRa.available()) {
      incoming += (char)LoRa.read();
    }

    packetCount++;
    rxData.rssi = LoRa.packetRssi();
    rxData.snr = LoRa.packetSnr();

    if (parsePacket(incoming)) {
      printReceivedData(incoming);
      updateOLED();
    } else {
      Serial.println("[-] Malformed packet received: " + incoming);
    }
  }
}

// =====================================================
// DATA PARSING (17-FIELD CSV TELEMETRY)
// =====================================================

bool parsePacket(String msg) {
  int tempOKInt = 0;
  int mpuOKInt = 0;
  int gpsOKInt = 0;

  int parsed = sscanf(msg.c_str(),
         "%15[^,],%lu,%d,%f,%d,%f,%f,%f,%f,%f,%f,%d,%lf,%lf,%lu,%f,%f",
         rxData.nodeName,
         &rxData.seq,
         &tempOKInt,
         &rxData.temp,
         &mpuOKInt,
         &rxData.ax, &rxData.ay, &rxData.az,
         &rxData.gx, &rxData.gy, &rxData.gz,
         &gpsOKInt,
         &rxData.lat, &rxData.lon,
         &rxData.sats,
         &rxData.alt,
         &rxData.hdop);

  if (parsed >= 12) {
    rxData.tempOK = (tempOKInt == 1);
    rxData.mpuOK  = (mpuOKInt == 1);
    rxData.gpsOK  = (gpsOKInt == 1);
    return true;
  }
  return false;
}

// =====================================================
// PRINT TELEMETRY TO SERIAL CONSOLE
// =====================================================

void printReceivedData(String rawMsg) {
  Serial.println("******************************************");
  Serial.printf("PACKET #%lu RECEIVED | RSSI: %d dBm | SNR: %.2f dB\n", packetCount, rxData.rssi, rxData.snr);
  Serial.println("Payload: " + rawMsg);
  Serial.println("------------------------------------------");
  Serial.printf("Node       : %s | Packet Seq: %lu\n", rxData.nodeName, (unsigned long)rxData.seq);
  Serial.printf("Temperature: %.2f C [%s]\n", rxData.temp, rxData.tempOK ? "OK" : "SENSOR_ERROR");
  
  if (rxData.mpuOK) {
    Serial.printf("Accel      : X=%.2f Y=%.2f Z=%.2f m/s2\n", rxData.ax, rxData.ay, rxData.az);
    Serial.printf("Gyro       : X=%.3f Y=%.3f Z=%.3f rad/s\n", rxData.gx, rxData.gy, rxData.gz);
  } else {
    Serial.println("MPU6050    : NOT DETECTED");
  }

  if (rxData.gpsOK) {
    Serial.printf("GPS        : Lat=%.6f, Lon=%.6f\n", rxData.lat, rxData.lon);
    Serial.printf("GPS Fix    : Sats=%lu | Alt=%.1f m | HDOP=%.2f\n", (unsigned long)rxData.sats, rxData.alt, rxData.hdop);
  } else {
    Serial.printf("GPS        : NO FIX (Sats seen: %lu)\n", (unsigned long)rxData.sats);
  }
  Serial.println("******************************************\n");
}

// =====================================================
// UPDATE OLED DISPLAY
// =====================================================

void updateOLED() {
  if (!oledOK) return;

  display.clearDisplay();
  display.setCursor(0, 0);

  display.printf("%s #%lu\n", rxData.nodeName, (unsigned long)rxData.seq);
  display.printf("RSSI:%ddBm S:%.1f\n", rxData.rssi, rxData.snr);
  
  if (rxData.tempOK) {
    display.printf("Temp: %.2f C\n", rxData.temp);
  } else {
    display.println("Temp: ERROR");
  }

  if (rxData.gpsOK) {
    display.printf("La:%.4f Lo:%.4f\n", rxData.lat, rxData.lon);
  } else {
    display.println("GPS: SEARCHING");
  }
  display.printf("Sats:%lu Alt:%.0fm", (unsigned long)rxData.sats, rxData.alt);

  display.display();
}

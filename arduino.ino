// ============================================================
//  Smart Gas Booking System — ESP32
//  HX711 + Load Cell + 16x2 I2C LCD + Firebase RTDB
//
//  Calibration (via Serial Monitor at 115200 baud):
//    1. Place EMPTY cylinder → send 'e'  → saves empty weight
//    2. Place FULL cylinder  → send 'f'  → saves full weight + capacity
//    3. Send 'r' anytime     → reset calibration
//    4. Send 's'             → show current saved values
//
//  Libraries needed (Arduino Library Manager):
//    - Firebase ESP Client  by mobizt
//    - HX711                by bogde
//    - LiquidCrystal I2C    by Frank de Brabander
// ============================================================

#include <WiFi.h>
#include "HX711.h"
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>

// ── Pins ────────────────────────────────────────────────────
#define HX711_DOUT  18
#define HX711_SCK   19
#define SDA_PIN     21
#define SCL_PIN     22

// ── LCD ─────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);  // change to 0x3F if blank

// ── Persistent storage ──────────────────────────────────────
Preferences prefs;

// ── WiFi ────────────────────────────────────────────────────
#define WIFI_SSID     "Wifi Name"
#define WIFI_PASSWORD "Wifi Password"

// ── Firebase ────────────────────────────────────────────────
#define API_KEY      "ypur Api key"
#define DATABASE_URL "Your Database URL"

FirebaseData    fbdo;
FirebaseAuth    auth;
FirebaseConfig  config;

// ── HX711 ───────────────────────────────────────────────────
HX711 scale;

// Scale factor: adjust until a known weight reads correctly.
// Start with -150.0; if readings are inverted try +150.0.
// Fine-tune: place 1 kg weight, run, adjust until LCD shows ~1000 g.
#define SCALE_FACTOR  -150.0

// ── Calibration values (loaded from flash) ──────────────────
float emptyWeight = 0;   // raw reading with empty cylinder
float fullWeight  = 0;   // raw reading with full cylinder
float capacity    = 0;   // fullWeight - emptyWeight  (= gas capacity)
bool  calibrated  = false;

// ── Runtime state ───────────────────────────────────────────
float   lastWeight  = 0;
bool    autoBooked  = false;
unsigned long firebaseTimer = 0;
unsigned long lcdTimer      = 0;

// ── Calibration state machine ────────────────────────────────
enum CalibState { IDLE, WAITING_EMPTY, WAITING_FULL };
CalibState calibState = IDLE;

// ============================================================
//  Helper: print 2-line message on LCD
// ============================================================
void lcdPrint(const char* line1, const char* line2 = "") {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(line1);
  lcd.setCursor(0, 1); lcd.print(line2);
}

// ============================================================
//  WiFi connect (non-blocking with timeout)
// ============================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lcdPrint("Connecting WiFi", "...");
  Serial.print("[WiFi] Connecting");

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.print("[WiFi] IP: "); Serial.println(WiFi.localIP());
    lcdPrint("WiFi Connected", WiFi.localIP().toString().c_str());
    delay(1500);
  } else {
    Serial.println(" FAILED (offline mode)");
    lcdPrint("WiFi Failed", "Offline mode");
    delay(2000);
  }
}

// ============================================================
//  Load calibration from flash
// ============================================================
void loadCalibration() {
  prefs.begin("calib", true);   // read-only
  emptyWeight = prefs.getFloat("empty", 0);
  fullWeight  = prefs.getFloat("full",  0);
  capacity    = prefs.getFloat("cap",   0);
  prefs.end();

  calibrated = (capacity > 0);

  Serial.println("=== Calibration Loaded ===");
  Serial.print("Empty weight : "); Serial.println(emptyWeight);
  Serial.print("Full weight  : "); Serial.println(fullWeight);
  Serial.print("Capacity     : "); Serial.println(capacity);
  Serial.print("Status       : "); Serial.println(calibrated ? "OK" : "NOT SET");
}

// ============================================================
//  Save a calibration value to flash
// ============================================================
void saveCalibration() {
  prefs.begin("calib", false);  // read-write
  prefs.putFloat("empty", emptyWeight);
  prefs.putFloat("full",  fullWeight);
  prefs.putFloat("cap",   capacity);
  prefs.end();
}

// ============================================================
//  Reset calibration
// ============================================================
void resetCalibration() {
  emptyWeight = 0;
  fullWeight  = 0;
  capacity    = 0;
  calibrated  = false;
  saveCalibration();
  Serial.println("[Calib] Reset done");
  lcdPrint("Calibration", "Reset!");
  delay(1500);
}

// ============================================================
//  Read stable weight (average of N samples)
// ============================================================
float readWeight(int samples = 10) {
  if (!scale.is_ready()) return lastWeight;
  float w = scale.get_units(samples);
  if (w < 0) w = 0;
  // Simple low-pass filter (50/50 blend)
  w = (w + lastWeight) / 2.0;
  lastWeight = w;
  return w;
}

// ============================================================
//  Calculate gas percentage from raw weight
// ============================================================
float calcPercent(float weight) {
  if (capacity <= 0) return 0;
  float pct = ((weight - emptyWeight) / capacity) * 100.0;
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

// ============================================================
//  Update LCD every 500 ms
// ============================================================
void updateLCD(float weight, float percent) {
  lcd.clear();

  if (calibState == WAITING_EMPTY) {
    // Prompt user to confirm empty cylinder
    lcd.setCursor(0, 0); lcd.print("EMPTY cylinder");
    lcd.setCursor(0, 1); lcd.print("Send 'e' = "); lcd.print(weight, 0); lcd.print("g");
    return;
  }

  if (calibState == WAITING_FULL) {
    // Prompt user to confirm full cylinder
    lcd.setCursor(0, 0); lcd.print("FULL cylinder");
    lcd.setCursor(0, 1); lcd.print("Send 'f' = "); lcd.print(weight, 0); lcd.print("g");
    return;
  }

  if (!calibrated) {
    // Not calibrated yet
    lcd.setCursor(0, 0); lcd.print("Not Calibrated");
    lcd.setCursor(0, 1); lcd.print("Wt:"); lcd.print(weight, 0); lcd.print("g e/f");
    return;
  }

  // Normal display
  lcd.setCursor(0, 0);
  lcd.print("Gas:");
  lcd.print(percent, 0);
  lcd.print("% ");

  // Show status on row 0 right side
  if (percent <= 20) {
    lcd.print(" LOW!");
  } else if (percent <= 40) {
    lcd.print(" OK ");
  } else {
    lcd.print(" GOOD");
  }

  lcd.setCursor(0, 1);
  lcd.print("Wt:");
  lcd.print(weight, 0);
  lcd.print("g");

  if (autoBooked) {
    lcd.print(" BOOKED");
  }
}

// ============================================================
//  Push data to Firebase
// ============================================================
void pushToFirebase(float weight, float percent) {
  if (!Firebase.ready()) return;

  Firebase.RTDB.setFloat(&fbdo,  "gasData/weight",     weight);
  Firebase.RTDB.setFloat(&fbdo,  "gasData/percentage", percent);
  Firebase.RTDB.setString(&fbdo, "gasData/lowGas",     percent <= 20 ? "YES" : "NO");

  Serial.print("[FB] weight="); Serial.print(weight);
  Serial.print("  percent=");   Serial.print(percent, 1);
  Serial.println("%");

  // Auto booking when gas is low
  if (percent <= 20 && !autoBooked) {
    FirebaseJson json;
    json.set("userId",    "ESP32-Auto");
    json.set("date",      "Auto");
    json.set("status",    "Pending");
    json.set("type",      "Auto");
    json.set("timestamp", (int)(millis() / 1000));

    if (Firebase.RTDB.pushJSON(&fbdo, "bookings", &json)) {
      Serial.println("[FB] Auto booking pushed ✅");
      lcdPrint("AUTO BOOKING", "Triggered!");
      delay(2000);
      autoBooked = true;
    } else {
      Serial.print("[FB] Auto booking FAILED: ");
      Serial.println(fbdo.errorReason());
    }
  }

  // Reset booking flag when refilled
  if (percent > 60) autoBooked = false;
}

// ============================================================
//  Handle serial commands
// ============================================================
void handleSerial(float currentWeight) {
  if (!Serial.available()) return;
  char cmd = Serial.read();

  switch (cmd) {

    // ── Set EMPTY weight ─────────────────────────────────────
    case 'e':
    case 'E':
      emptyWeight = currentWeight;
      calibState  = WAITING_EMPTY;
      saveCalibration();
      Serial.print("[Calib] Empty weight set: ");
      Serial.println(emptyWeight);
      lcdPrint("Empty saved!", String(emptyWeight, 1).c_str());
      delay(1500);
      calibState = IDLE;
      // Recalculate capacity if full weight already set
      if (fullWeight > emptyWeight) {
        capacity   = fullWeight - emptyWeight;
        calibrated = true;
        saveCalibration();
        Serial.print("[Calib] Capacity updated: ");
        Serial.println(capacity);
      }
      break;

    // ── Set FULL weight ──────────────────────────────────────
    case 'f':
    case 'F':
      if (emptyWeight == 0) {
        Serial.println("[Calib] Set empty weight first! Send 'e'");
        lcdPrint("Set empty", "first! (e)");
        delay(1500);
        break;
      }
      fullWeight = currentWeight;
      capacity   = fullWeight - emptyWeight;
      calibrated = (capacity > 0);
      calibState = WAITING_FULL;
      saveCalibration();
      Serial.print("[Calib] Full weight set: ");  Serial.println(fullWeight);
      Serial.print("[Calib] Capacity: ");          Serial.println(capacity);
      lcdPrint("Full saved!", ("Cap:" + String(capacity, 0) + "g").c_str());
      delay(2000);
      calibState = IDLE;
      break;

    // ── Reset calibration ────────────────────────────────────
    case 'r':
    case 'R':
      resetCalibration();
      break;

    // ── Tare (zero the scale) ────────────────────────────────
    case 't':
    case 'T':
      scale.tare();
      lastWeight = 0;
      Serial.println("[Scale] Tared (zeroed)");
      lcdPrint("Scale zeroed", "OK");
      delay(1500);
      break;

    // ── Show current saved values ────────────────────────────
    case 's':
    case 'S':
      Serial.println("=== Saved Calibration ===");
      Serial.print("Empty : "); Serial.println(emptyWeight);
      Serial.print("Full  : "); Serial.println(fullWeight);
      Serial.print("Cap   : "); Serial.println(capacity);
      Serial.print("Status: "); Serial.println(calibrated ? "Calibrated ✅" : "Not calibrated ❌");
      break;

    // ── Help ─────────────────────────────────────────────────
    case 'h':
    case 'H':
    case '?':
      Serial.println("========= COMMANDS =========");
      Serial.println("e = set EMPTY cylinder weight");
      Serial.println("f = set FULL  cylinder weight");
      Serial.println("t = tare/zero the scale");
      Serial.println("r = reset calibration");
      Serial.println("s = show saved values");
      Serial.println("h = this help");
      Serial.println("============================");
      break;

    default:
      break;
  }
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=== Smart Gas System Starting ===");

  // LCD
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcdPrint("Smart Gas", "Booting...");
  delay(1500);

  // Load saved calibration
  loadCalibration();

  // HX711
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(SCALE_FACTOR);
  scale.tare();
  Serial.println("[Scale] HX711 ready, tared");

  // WiFi + Firebase
  connectWiFi();

  config.api_key      = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email     = "test@test.com";
  auth.user.password  = "123456";

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Show calibration status
  if (calibrated) {
    lcdPrint("Calibrated OK", ("Cap:" + String(capacity, 0) + "g").c_str());
    delay(2000);
  } else {
    lcdPrint("Not Calibrated", "Send e/f");
    delay(2000);
  }

  // Print help
  Serial.println("\nSend 'h' for command list");
  Serial.println("=================================\n");
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }

  // Read weight
  float weight  = readWeight(10);
  float percent = calibrated ? calcPercent(weight) : 0;

  // Handle serial commands
  handleSerial(weight);

  // Update LCD every 500 ms
  if (millis() - lcdTimer > 500) {
    lcdTimer = millis();
    updateLCD(weight, percent);
  }

  // Push to Firebase every 3 seconds
  if (calibrated && Firebase.ready() && millis() - firebaseTimer > 3000) {
    firebaseTimer = millis();
    pushToFirebase(weight, percent);
  }

  delay(100);
}

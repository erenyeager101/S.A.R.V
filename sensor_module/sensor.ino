#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <math.h>

// --- CONFIGURATION ---
const char* SSID     = "Your_SSID";
const char* PASS     = "Your_PASSWORD";
const char* ENDPOINT = "your_endpoint_here"; // e.g., "https://example.com/api/temperature"

static const uint8_t SDA_PIN = D1;
static const uint8_t SCL_PIN = D2;

const uint8_t AMB_BUFF = 20;
const uint8_t OBJ_BUFF = 10;
const float TEMP_DELTA_THRESHOLD = 1.0;
const float LOGISTIC_K            = 4.0;
const uint16_t DEBOUNCE_MS        = 500;

Adafruit_MLX90614 mlx;
float ambBuf[AMB_BUFF], objBuf[OBJ_BUFF];
uint8_t ambIdx = 0, objIdx = 0;

bool presenceState = false;
uint32_t stateTimer   = 0;
uint32_t lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!mlx.begin()) {
    Serial.println("MLX90614 not found! Halting.");
    while (1) delay(10);
  }

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected!");

  // Pre-fill ambient buffer
  Serial.println("Calibrating ambient…");
  float sum = 0;
  for (uint8_t i = 0; i < AMB_BUFF; i++) {
    ambBuf[i] = mlx.readAmbientTempC();
    sum += ambBuf[i];
    delay(100);
  }
  Serial.printf("Ambient baseline: %.2f°C\n", sum / AMB_BUFF);
}

float logistic(float x) {
  return 1.0 / (1.0 + exp(-LOGISTIC_K * x));
}

void loop() {
  // 1) Rolling ambient
  float rawAmb = mlx.readAmbientTempC();
  ambBuf[ambIdx] = rawAmb;
  ambIdx = (ambIdx + 1) % AMB_BUFF;
  float ambient = 0;
  for (auto &v : ambBuf) ambient += v;
  ambient /= AMB_BUFF;

  // 2) Rolling object
  float rawObj = mlx.readObjectTempC();
  objBuf[objIdx] = rawObj;
  objIdx = (objIdx + 1) % OBJ_BUFF;
  float objAvg = 0;
  for (auto &v : objBuf) objAvg += v;
  objAvg /= OBJ_BUFF;

  // 3) Compute delta, probability & debounce
  float delta = objAvg - ambient;
  float prob  = constrain(logistic(delta - TEMP_DELTA_THRESHOLD), 0.0, 1.0);
  bool over = delta >= TEMP_DELTA_THRESHOLD;

  if (!presenceState) {
    if (over) {
      if (!stateTimer) stateTimer = millis();
      else if (millis() - stateTimer >= DEBOUNCE_MS) presenceState = true;
    } else stateTimer = 0;
  } else {
    if (!over) {
      if (!stateTimer) stateTimer = millis();
      else if (millis() - stateTimer >= DEBOUNCE_MS) presenceState = false;
    } else stateTimer = 0;
  }

  Serial.printf("Ambient: %.2f°C, Object: %.2f°C, Δ: %.2f, Prob: %.2f, Human Signature: %s\n",
                ambient, objAvg, delta, prob, presenceState ? "YES":"NO");

  // 4) Send every 10s
  if (millis() - lastSendTime >= 2000) {
    lastSendTime = millis();
    sendToServer(objAvg, prob, presenceState);
  }

  delay(50);
}

void sendToServer(float tempC, float prob, bool isHuman) {
  // Build JSON payload
  String body = "{";
  body += "\"temperature\":" + String(tempC, 2) + ",";
  body += "\"humanProb\":"   + String(prob, 3) + ",";
  body += "\"isHuman\":";
  body += (isHuman ? "true" : "false");
  body += "}";

  Serial.println("[HTTP] Sending:");
  Serial.println(body);

  // HTTPS client
  WiFiClientSecure client;
  client.setInsecure();  // skip cert check

  HTTPClient https;
  if (https.begin(client, ENDPOINT)) {
    https.addHeader("Content-Type", "application/json");
    int code = https.POST(body);
    String resp = https.getString();
    Serial.printf("[HTTP] Code: %d (%s)\n",
                  code, https.errorToString(code).c_str());
    Serial.println("[HTTP] Response:");
    Serial.println(resp);
    https.end();
  } else {
    Serial.println("[HTTP] Connection failed");
  }
}

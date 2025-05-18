#define BLYNK_TEMPLATE_NAME "SARV"
#define BLYNK_AUTH_TOKEN  "lH5CsFqUODVt_seXQkxqij9hYutGhCzf"
#define BLYNK_TEMPLATE_ID "TMPL3xa3M2get"
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>

// Motor Driver Pins
#define IN1  D3
#define IN2  D4
#define IN3  D6
#define IN4  D7
#define ENA  D2   // PWM pin for Motor A
#define ENB  D8   // PWM pin for Motor B

// Ultrasonic sensor pins
#define TRIG D1
#define ECHO D0

// Distance thresholds (cm)
const int STOP_DISTANCE    = 15;
const int RELEASE_DISTANCE = 20;

// WiFi credentials
char ssid[] = "Your_SSID";
char pass[] = "Your_PASSWORD";

// Motor Speed (0–1023)
int motorSpeedA = 800;
int motorSpeedB = 800;

// Control flags
bool obstacle = false;
bool userWantsForward = false;

void moveForward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, motorSpeedA);
  analogWrite(ENB, motorSpeedB);
}

void moveBackward() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENA, motorSpeedA);
  analogWrite(ENB, motorSpeedB);
}

void turnLeft() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, motorSpeedA);
  analogWrite(ENB, motorSpeedB);
}

void turnRight() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, motorSpeedA);
  analogWrite(ENB, motorSpeedB);
}

void stopCar() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}

// Read ultrasonic distance (cm)
long readDistanceCM() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long duration = pulseIn(ECHO, HIGH, 30000UL);
  if (duration == 0) return 999;
  return duration / 58;
}

// Blynk handlers
BLYNK_WRITE(V0) { 
  userWantsForward = param.asInt(); 
  if (userWantsForward && !obstacle) {
    moveForward();
  } else if (!userWantsForward) {
    stopCar();
  }
}
BLYNK_WRITE(V1) { if (param.asInt()) moveBackward(); else stopCar(); }
BLYNK_WRITE(V2) { if (param.asInt()) turnLeft(); else stopCar(); }
BLYNK_WRITE(V3) { if (param.asInt()) turnRight(); else stopCar(); }

void setup() {
  Serial.begin(115200);
  // motor pins
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  stopCar();
  // ultrasonic pins
  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);
  // WiFi & Blynk
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
}

void loop() {
  // Check distance
  long frontDist = readDistanceCM();
  
  // Collision prevention logic
  if (frontDist < STOP_DISTANCE) {
    // Obstacle detected
    if (!obstacle) {
      obstacle = true;
      if (userWantsForward) {
        stopCar();
        Serial.println("!! Obstacle detected - stopping forward motion");
      }
    }
  } 
  else if (frontDist > RELEASE_DISTANCE) {
    // Path is clear
    if (obstacle) {
      obstacle = false;
      Serial.println(">> Path clear");
      // Resume forward motion if user is still pressing forward
      if (userWantsForward) {
        moveForward();
        Serial.println(">> Resuming forward motion");
      }
    }
  }

  // Serial commands for manual control
  if (Serial.available()) {
    char cmd = Serial.read();
    switch (cmd) {
      case 'f': 
        userWantsForward = true;
        if (!obstacle) moveForward(); 
        else Serial.println("Blocked by obstacle"); 
        break;
      case 'b': moveBackward(); break;
      case 'l': turnLeft(); break;
      case 'r': turnRight(); break;
      case 's': 
        userWantsForward = false;
        stopCar(); 
        break;
      case 'd': 
        Serial.print("Distance: "); 
        Serial.print(frontDist); 
        Serial.println(" cm"); 
        break;
    }
  }
  
  Blynk.run();
}
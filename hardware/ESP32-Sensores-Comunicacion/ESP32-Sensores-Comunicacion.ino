#include <WiFi.h>
#include <HTTPClient.h>

// Configuracion de los sensores: pares trigger/echo y su spaceId
const int triggerPins[] = {12};
const int echoPins[] = {13};
const int sensorSpaceIds[] = {1};

const int numSensors = sizeof(triggerPins) / sizeof(triggerPins[0]);

bool currentOccupiedState[numSensors];
bool firstReading[numSensors];

const char *SERVER_URL = "http://DIRECCION_DEL_SERVIDOR:3000/sensors";
const char *WIFI_SSID = "TU_RED_WIFI";
const char *WIFI_PASSWORD = "TU_CLAVE_WIFI";

const unsigned long ECHO_TIMEOUT = 30000;
const float SOUND_SPEED_CM_PER_US = 0.034;
const float OCCUPIED_DISTANCE_CM = 15.0;

HTTPClient http;

void setup(){
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  /*
    WiFi.disconnect();
    delay(1000);

    Serial.println("Escaneando redes...");
    int n = WiFi.scanNetworks();
    Serial.print(n);

    if (n == 0) {
      Serial.println("No se encontraron redes");
    } else {
      for (int i = 0; i < n; ++i) {
        Serial.print("Red: ");
        Serial.print(WiFi.SSID(i));
        Serial.print(" | Señal: ");
        Serial.println(WiFi.RSSI(i));
      }
    }
  */

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConectado!");
  Serial.println("IP: ");
  Serial.println(WiFi.localIP());

  for (int i = 0; i < numSensors; i++)
  {
    pinMode(echoPins[i], INPUT);
    pinMode(triggerPins[i], OUTPUT);
  }

  for (int i = 0; i < numSensors; i++)
  {
    currentOccupiedState[i] = false;
    firstReading[i] = true;
  }
}

void sendSensorState(int sensorIndex, bool isOccupied, float distance) {
  WiFiClient client;
  String url = String(SERVER_URL) + "/" + String(sensorSpaceIds[sensorIndex]);
  http.begin(client, url);
  http.setTimeout(10000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");

  String jsonObject = "{";
  jsonObject += "\"sensorId\": " + String(sensorIndex) + ", ";
  jsonObject += "\"parkingId\": 1, ";
  jsonObject += "\"spaceId\": " + String(sensorSpaceIds[sensorIndex]) + ", ";
  jsonObject += "\"isOccupied\": " + String(isOccupied ? "true" : "false") + ", ";
  jsonObject += "\"distance\": " + String(distance) + ", ";
  jsonObject += "\"timestamp\": " + String(millis()) + ", ";
  jsonObject += "\"rssi\": " + String(WiFi.RSSI());
  jsonObject += "}";

  int response = http.PUT(jsonObject);

  Serial.print("Response: ");
  Serial.println(response);

  if (response <= 0) {
    Serial.print("HTTP error: ");
    Serial.println(http.errorToString(response));
  }

  http.end();
}

void triggerSensor(int triggerPin) {
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);

  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(triggerPin, LOW);
}

long readPulseDuration(int echoPin) {
  return pulseIn(echoPin, HIGH, ECHO_TIMEOUT);
}

float readDistanceCm(int triggerPin, int echoPin) {
  triggerSensor(triggerPin);
  long duration = readPulseDuration(echoPin);
  if(duration <= 0) return -1;
  return (duration / 2.0) * SOUND_SPEED_CM_PER_US;
}

void loop() {
  for (int i = 0; i < numSensors; i++) {

    float distance = readDistanceCm(triggerPins[i], echoPins[i]);
    
    if (distance < 0) {
      Serial.println("Sin eco: se asume espacio libre");
    } else {
      Serial.print("Distancia: ");
      Serial.print(distance);
      Serial.println(" cm");
    }

    bool isOccupied = (distance > 0 && distance < OCCUPIED_DISTANCE_CM);

    if (firstReading[i] || isOccupied != currentOccupiedState[i])
    {
      sendSensorState(i, isOccupied, distance);

      currentOccupiedState[i] = isOccupied;
      firstReading[i] = false;
    }

    delay(100);
  }
  
  delay(500);
}


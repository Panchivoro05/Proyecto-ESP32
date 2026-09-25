#include <WiFi.h>
#include <PubSubClient.h>

// Datos de red (en Wokwi puedes usar Wokwi-GUEST sin contraseña)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

const char* mqtt_server = "192.168.18.94"; 

const int LED_PIN = 2; 

WiFiClient espClient;
PubSubClient client(espClient);

// Declaración de funciones de conexión
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando a ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());
}

// Función que se ejecuta cuando llega un mensaje desde el Broker (ej. desde React Native)
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensaje recibido en [");
  Serial.print(topic);
  Serial.print("] ");
  
  String mensaje = "";
  for (int i = 0; i < length; i++) {
    mensaje += (char)payload[i];
  }
  Serial.println(mensaje);

  // Si el mensaje es para encender el LED
  if (String(topic) == "casa/led/comando") {
    if (mensaje == "ON") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("-> LED ENCENDIDO por comando MQTT");
    } else if (mensaje == "OFF") {
      digitalWrite(LED_PIN, LOW);
      Serial.println("-> LED APAGADO por comando MQTT");
    }
  }
}

void reconnect() {
  // Loop hasta que logremos la conexión MQTT
  while (!client.connected()) {
    Serial.print("Intentando conexión MQTT...");
    // ID de cliente único para el MQTT broker
    if (client.connect("ESP32Client_Wokwi")) {
      Serial.println("conectado");
      // Suscribirse al tópico de comandos que enviará React Native
      client.subscribe("casa/led/comando");
    } else {
      Serial.print("falló, rc=");
      Serial.print(client.state());
      Serial.println(" intentando de nuevo en 5 segundos");
      delay(5000);
    }
  }
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(115200);
  
  setup_wifi();
  
  // Configurar el servidor MQTT en el puerto por defecto 1883
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

unsigned long lastMsg = 0;
int contador = 0;

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  // Publicar datos del sensor cada 5 segundos hacia Fedora
  if (now - lastMsg > 5000) {
    lastMsg = now;
    contador++;
    
    // Crear un JSON o cadena con los datos del sensor simulado
    String payload = "{\"temperatura\": 25.5, \"contador\": " + String(contador) + "}";
    
    Serial.print("Publicando datos: ");
    Serial.println(payload);
    
    // Publicar en el tópico que leerá React Native
    client.publish("casa/sensores/datos", payload.c_str());
  }
}
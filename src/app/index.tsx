import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
// @ts-ignore
import Paho from 'paho-mqtt';

// Configuración del Broker
const MQTT_HOST = "192.168.18.94"; 
const MQTT_PORT = 9001; 
const CLIENT_ID = "ReactWebClient_" + parseInt(String(Math.random() * 100000));

let client: any = null;

export default function HomeScreen() {
  const [conectado, setConectado] = useState(false);
  const [temperatura, setTemperatura] = useState("--");
  const [ledEstado, setLedEstado] = useState(false);

  useEffect(() => {
    // CORRECCIÓN 1: Agregar el path "/mqtt" o "" para que Paho use WebSockets correctamente en la web
    client = new Paho.Client(MQTT_HOST, Number(MQTT_PORT), "/mqtt", CLIENT_ID);

    client.onConnectionLost = (responseObject: any) => {
      if (responseObject.errorCode !== 0) {
        console.log("Conexión perdida: " + responseObject.errorMessage);
        setConectado(false);
      }
    };

    client.onMessageArrived = (message: any) => {
      console.log("Mensaje recibido en [" + message.destinationName + "]: " + message.payloadString);
      
      // CORRECCIÓN 2: Coincidir exactamente con el tópico que publica la ESP32 ("casa/sensores/datos")
      if (message.destinationName === "casa/sensores/datos") {
        try {
          const data = JSON.parse(message.payloadString);
          // Si tu JSON de la ESP32 tiene "temperatura", lo lee, si no, puedes mostrar el contador o el payload
          if (data.temperatura !== undefined) {
            setTemperatura(data.temperatura.toString());
          } else {
            setTemperatura(JSON.stringify(data));
          }
        } catch (e) {
          // Si llega como texto plano
          setTemperatura(message.payloadString);
        }
      }
    };

    // Conectar al Broker
    client.connect({
      onSuccess: () => {
        console.log("Conectado al Broker MQTT exitosamente");
        setConectado(true);
        // CORRECCIÓN 3: Suscribirse al mismo tópico limpio (sin barra inicial extra)
        client.subscribe("casa/sensores/datos");
      },
      onFailure: (err: any) => {
        console.log("Fallo en la conexión MQTT: " + err.errorMessage);
        setConectado(false);
      },
    });

    return () => {
      if (client && client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  const enviarComandoLED = (estado: boolean) => {
    if (!client || !client.isConnected()) {
      alert("No hay conexión con el Broker MQTT");
      return;
    }
    const comando = estado ? "ON" : "OFF";
    const message = new Paho.Message(comando);
    // CORRECCIÓN 4: Coincidir con el tópico que escucha la ESP32 ("casa/led/comando")
    message.destinationName = "casa/led/comando";
    client.send(message);
    setLedEstado(estado);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SISTEMA IoT MQTT</Text>
      <Text style={styles.subtitle}>
        Estado Broker: {conectado ? "🟢 Conectado" : "🔴 Desconectado"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Datos Recibidos (ESP32)</Text>
        <Text style={styles.cardValue}>{temperatura}</Text>
      </View>

      <View style={[styles.ledIndicator, { backgroundColor: ledEstado ? 'red' : '#555' }]} />
      <Text style={styles.estadoText}>{ledEstado ? 'LED ENCENDIDO' : 'LED APAGADO'}</Text>

      <Pressable style={[styles.button, { backgroundColor: '#d9534f' }]} onPress={() => enviarComandoLED(true)}>
        <Text style={styles.buttonText}>ENCENDER LED</Text>
      </Pressable>

      <Pressable style={[styles.button, { backgroundColor: '#5bc0de' }]} onPress={() => enviarComandoLED(false)}>
        <Text style={styles.buttonText}>APAGAR LED</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#666' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: 280, alignItems: 'center', marginBottom: 20, elevation: 3 },
  cardTitle: { fontSize: 16, color: '#888' },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 5, textAlign: 'center' },
  ledIndicator: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  estadoText: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  button: { width: 250, padding: 15, marginVertical: 6, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

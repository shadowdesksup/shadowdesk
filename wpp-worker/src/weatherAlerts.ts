import * as admin from 'firebase-admin';
import { sendMessage } from './whatsapp';
import { getDb } from './firebase';

// Interfaces matching frontend
interface ThresholdConfig {
  enabled: boolean;
  thresholds: number[];
  custom?: number;
}

interface WeatherAlertPrefs {
  telefone: string;
  temperatura?: ThresholdConfig;
  ventos?: ThresholdConfig;
  chuva?: ThresholdConfig;
  umidade?: ThresholdConfig;
  lastAlertSent?: { [key: string]: admin.firestore.Timestamp };
}

interface WeatherData {
  temperature: number;
  windSpeed: number;
  rainProbability: number;
  humidity: number;
}

interface TriggeredAlert {
  type: 'temperatura' | 'ventos' | 'chuva' | 'umidade';
  value: number;
  threshold: number;
  message: string;
}

// Default coordinates: Marília-SP
const DEFAULT_COORDS = {
  lat: -22.2142,
  lon: -49.9458
};

// Cooldown: 1 hour between same alert type
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Fetch current weather data from Open-Meteo API
 */
export const fetchWeatherData = async (lat: number = DEFAULT_COORDS.lat, lon: number = DEFAULT_COORDS.lon): Promise<WeatherData | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Failed to fetch weather data:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      temperature: data.current?.temperature_2m || 0,
      windSpeed: data.current?.wind_speed_10m || 0,
      humidity: data.current?.relative_humidity_2m || 0,
      rainProbability: Math.max(...(data.hourly?.precipitation_probability?.slice(0, 6) || [0]))
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

/**
 * Check if threshold is exceeded
 */
const checkThreshold = (value: number, config: ThresholdConfig | undefined, isBelow: boolean = false): number | null => {
  if (!config?.enabled) return null;

  const allThresholds = [...config.thresholds];
  if (config.custom) allThresholds.push(config.custom);

  if (allThresholds.length === 0) return null;

  // Sort thresholds: for "below" checks (humidity), we want the highest threshold that's exceeded
  // For "above" checks (temp, wind, rain), we want the lowest threshold that's exceeded
  allThresholds.sort((a, b) => isBelow ? b - a : a - b);

  for (const threshold of allThresholds) {
    if (isBelow ? value <= threshold : value >= threshold) {
      return threshold;
    }
  }

  return null;
};

/**
 * Check weather against user preferences and return triggered alerts
 */
export const checkThresholds = (weather: WeatherData, prefs: WeatherAlertPrefs): TriggeredAlert[] => {
  const alerts: TriggeredAlert[] = [];

  // Temperature (above)
  const tempThreshold = checkThreshold(weather.temperature, prefs.temperatura);
  if (tempThreshold !== null) {
    alerts.push({
      type: 'temperatura',
      value: weather.temperature,
      threshold: tempThreshold,
      message: `🌡️ *Alerta de Temperatura Alta*\nTemperatura atual: ${weather.temperature}°C (limite: ${tempThreshold}°C)`
    });
  }

  // Wind (above)
  const windThreshold = checkThreshold(weather.windSpeed, prefs.ventos);
  if (windThreshold !== null) {
    alerts.push({
      type: 'ventos',
      value: weather.windSpeed,
      threshold: windThreshold,
      message: `💨 *Alerta de Ventos Fortes*\nVelocidade do vento: ${weather.windSpeed} km/h (limite: ${windThreshold} km/h)`
    });
  }

  // Rain probability (above)
  const rainThreshold = checkThreshold(weather.rainProbability, prefs.chuva);
  if (rainThreshold !== null) {
    alerts.push({
      type: 'chuva',
      value: weather.rainProbability,
      threshold: rainThreshold,
      message: `🌧️ *Alerta de Precipitação*\nChance de chuva: ${weather.rainProbability}% (limite: ${rainThreshold}%)`
    });
  }

  // Humidity (below)
  const humidityThreshold = checkThreshold(weather.humidity, prefs.umidade, true);
  if (humidityThreshold !== null) {
    alerts.push({
      type: 'umidade',
      value: weather.humidity,
      threshold: humidityThreshold,
      message: `💧 *Alerta de Umidade Baixa*\nUmidade atual: ${weather.humidity}% (limite: ${humidityThreshold}%)`
    });
  }

  return alerts;
};

/**
 * Format weather alert message
 */
export const formatAlertMessage = (alerts: TriggeredAlert[]): string => {
  const header = `⚠️ *Alerta Meteorológico ShadowDesk*\n\n`;
  const alertMessages = alerts.map(a => a.message).join('\n\n');
  const footer = `\n\n📍 Marília-SP`;

  return header + alertMessages + footer;
};

/**
 * Check if alert should be sent (cooldown logic)
 */
const shouldSendAlert = (alertType: string, lastAlertSent: { [key: string]: admin.firestore.Timestamp } | undefined): boolean => {
  if (!lastAlertSent || !lastAlertSent[alertType]) return true;

  const lastSent = lastAlertSent[alertType].toMillis();
  return Date.now() - lastSent > ALERT_COOLDOWN_MS;
};

/**
 * Update last alert sent timestamp
 */
const updateLastAlertSent = async (userId: string, alertTypes: string[]): Promise<void> => {
  const db = getDb();
  const updates: { [key: string]: admin.firestore.FieldValue } = {};
  alertTypes.forEach(type => {
    updates[`lastAlertSent.${type}`] = admin.firestore.FieldValue.serverTimestamp();
  });

  await db.collection('weatherAlerts').doc(userId).update(updates);
};

/**
 * Main function to check weather and send alerts
 */
export const checkAndSendWeatherAlerts = async (): Promise<void> => {
  console.log('Checking weather alerts...');

  try {
    const db = getDb();

    // Fetch current weather
    const weather = await fetchWeatherData();
    if (!weather) {
      console.log('Could not fetch weather data, skipping alert check.');
      return;
    }

    console.log(`Current weather: Temp=${weather.temperature}°C, Wind=${weather.windSpeed}km/h, Rain=${weather.rainProbability}%, Humidity=${weather.humidity}%`);

    // Get all weather alert preferences
    const snapshot = await db.collection('weatherAlerts').get();

    if (snapshot.empty) {
      console.log('No weather alert preferences found.');
      return;
    }

    console.log(`Found ${snapshot.size} users with weather alert preferences.`);

    for (const doc of snapshot.docs) {
      const userId = doc.id;
      const prefs = doc.data() as WeatherAlertPrefs;

      if (!prefs.telefone) {
        console.log(`User ${userId} has no phone number configured, skipping.`);
        continue;
      }

      // Check thresholds
      const triggeredAlerts = checkThresholds(weather, prefs);

      if (triggeredAlerts.length === 0) {
        continue;
      }

      // Filter alerts based on cooldown
      const alertsToSend = triggeredAlerts.filter(alert =>
        shouldSendAlert(alert.type, prefs.lastAlertSent)
      );

      if (alertsToSend.length === 0) {
        console.log(`User ${userId}: alerts triggered but still in cooldown.`);
        continue;
      }

      // Format and send message
      const message = formatAlertMessage(alertsToSend);
      console.log(`Sending weather alert to ${prefs.telefone}: ${alertsToSend.map(a => a.type).join(', ')}`);

      const sent = await sendMessage(prefs.telefone, message);

      if (sent) {
        // Update last sent timestamps
        await updateLastAlertSent(userId, alertsToSend.map(a => a.type));
        console.log(`Weather alert sent successfully to user ${userId}.`);
      } else {
        console.error(`Failed to send weather alert to user ${userId}.`);
      }
    }
  } catch (error) {
    console.error('Error checking weather alerts:', error);
  }
};

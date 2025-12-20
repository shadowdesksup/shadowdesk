import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './config';

// Interface matching the modal's WeatherAlertPreferences
export interface ThresholdConfig {
  enabled: boolean;
  thresholds: number[];
  custom?: number;
}

export interface WeatherAlertPreferences {
  telefone: string;
  temperatura?: ThresholdConfig;
  ventos?: ThresholdConfig;
  chuva?: ThresholdConfig;
  umidade?: ThresholdConfig;
  updatedAt?: Timestamp;
  lastAlertSent?: { [key: string]: Timestamp };
}

/**
 * Save weather alert preferences for a user
 */
export const saveWeatherAlertPreferences = async (
  userId: string,
  preferences: Omit<WeatherAlertPreferences, 'updatedAt'>
): Promise<void> => {
  const docRef = doc(db, 'weatherAlerts', userId);
  await setDoc(docRef, {
    ...preferences,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * Get weather alert preferences for a user
 */
export const getWeatherAlertPreferences = async (
  userId: string
): Promise<WeatherAlertPreferences | null> => {
  const docRef = doc(db, 'weatherAlerts', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as WeatherAlertPreferences;
  }
  return null;
};

/**
 * Update the last alert sent timestamp for a specific alert type
 */
export const updateLastAlertSent = async (
  userId: string,
  alertType: 'temperatura' | 'ventos' | 'chuva' | 'umidade'
): Promise<void> => {
  const docRef = doc(db, 'weatherAlerts', userId);
  await setDoc(docRef, {
    lastAlertSent: {
      [alertType]: serverTimestamp()
    }
  }, { merge: true });
};

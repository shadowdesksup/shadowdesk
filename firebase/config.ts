import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase - ShadowDesk UNESP
const firebaseConfig = {
  apiKey: "AIzaSyBMjW9rOGmKiE54doOqca5UcpI5NA7SLCY",
  authDomain: "shadowdesk-unesp.firebaseapp.com",
  projectId: "shadowdesk-unesp",
  storageBucket: "shadowdesk-unesp.firebasestorage.app",
  messagingSenderId: "87406314444",
  appId: "1:87406314444:web:5e36691039bb54b0a15369"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

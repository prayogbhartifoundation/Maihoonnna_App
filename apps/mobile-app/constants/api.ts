import { Platform } from 'react-native';

// ─── Environment Switch ────────────────────────────────────────────────────
// Reads from your .env file: EXPO_PUBLIC_ENV=local or EXPO_PUBLIC_ENV=production
const USE_LOCAL = process.env.EXPO_PUBLIC_ENV === 'local';

const PRODUCTION_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL ?? 'https://api.maihoonna.com/app-api';

// For physical device testing, set your PC's local IP in .env:
// EXPO_PUBLIC_LOCAL_IP=192.168.x.x
const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP ?? 'localhost';

// ─── Local URL (auto-handles emulator vs web vs physical device) ─────────────
const getLocalUrl = () => {
    // Graceful handling if you accidentally include 'http://' in your .env IP
    if (LOCAL_IP.startsWith('http')) {
        // if it already has the port, just append /api, otherwise assume 8001
        return LOCAL_IP.includes(':8001') ? `${LOCAL_IP}/api` : `${LOCAL_IP}:8001/api`;
    }

    if (Platform.OS === 'android') {
        // Android emulator uses 10.0.2.2 to reach host machine's localhost
        // But if LOCAL_IP is set to a real IP, use it (for physical device)
        const host = LOCAL_IP === 'localhost' ? '10.0.2.2' : LOCAL_IP;
        return `http://${host}:8001/api`;
    }
    // iOS simulator, web, and physical iOS can use localhost or the real IP
    return `http://${LOCAL_IP}:8001/api`;
};

// ─── Export final URL ─────────────────────────────────────────────────────────
export const API_URL = USE_LOCAL ? getLocalUrl() : PRODUCTION_URL;

// Handy for debugging — shows in Metro console on startup
console.log(`[API] Environment: ${USE_LOCAL ? 'LOCAL' : 'PRODUCTION'} → ${API_URL}`);

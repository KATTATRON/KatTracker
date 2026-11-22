// Central theme. The active palette is applied before any StyleSheet is created,
// so switching themes saves the choice and reloads the app.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_STORAGE_KEY = '@kat_tracker_theme_v1';

export const withAlpha = (hex, alpha) => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const makePalette = (accent, accentAlt, bannerBg) => ({
  accent,
  accentAlt,
  accentMuted: withAlpha(accent, 0.18),
  bannerBg,
});

export const THEMES = {
  violet: { name: 'Cyber Violet', colors: makePalette('#8B5CF6', '#22D3EE', '#2A1B55') },
  crimson: { name: 'Crimson Rage', colors: makePalette('#EF4444', '#F59E0B', '#4A1517') },
  emerald: { name: 'Toxic Emerald', colors: makePalette('#10B981', '#A3E635', '#0F3B2C') },
  gold: { name: 'Gold Edition', colors: makePalette('#F59E0B', '#FDE68A', '#46330A') },
};

export const THEME = {
  background: '#0B0B14',
  surface: '#15151F',
  surfaceLight: '#1F1F2D',
  surfaceRaised: '#262638',
  text: '#F5F5FA',
  textMuted: '#8E8EA8',
  border: '#26263A',
  success: '#34D399',
  successMuted: 'rgba(52, 211, 153, 0.15)',
  ...THEMES.violet.colors,
};

let activeKey = 'violet';
try {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEMES[stored]) activeKey = stored;
  }
} catch (e) { /* ignore */ }
Object.assign(THEME, THEMES[activeKey].colors);

export const ACTIVE_THEME_KEY = activeKey;

// Returns true when the page was reloaded to apply the theme
export const saveTheme = async (key) => {
  if (!THEMES[key]) return false;
  try { await AsyncStorage.setItem(THEME_STORAGE_KEY, key); } catch (e) { /* ignore */ }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.reload();
    return true;
  }
  return false;
};

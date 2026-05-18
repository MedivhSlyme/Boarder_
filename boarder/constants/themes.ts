export type ThemeName = 'teal' | 'coral' | 'gems' | 'nightblue';

export interface ThemeColors {
  name: ThemeName;
  label: string;
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  border: string;
  accent: string;
  mutedForeground: string;
  input: string;
  surfaceHigh: string;
  destructive: string;
  textDim: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  teal: {
    name: 'teal',
    label: 'Teal (Default)',
    primary: '#0891b2',
    primaryForeground: '#ffffff',
    background: '#0d1117',
    foreground: '#e8eaed',
    card: '#161b22',
    border: '#30363d',
    accent: '#06b6d4',
    mutedForeground: '#8b949e',
    input: '#0d1117',
    surfaceHigh: '#21262d',
    destructive: '#f85149',
    textDim: '#6e7681',
  },
  coral: {
    name: 'coral',
    label: 'Coral',
    primary: '#ff6b6b',
    primaryForeground: '#ffffff',
    background: '#0d1117',
    foreground: '#e8eaed',
    card: '#161b22',
    border: '#30363d',
    accent: '#ff8c87',
    mutedForeground: '#8b949e',
    input: '#0d1117',
    surfaceHigh: '#21262d',
    destructive: '#f85149',
    textDim: '#6e7681',
  },
  gems: {
    name: 'gems',
    label: 'Gems',
    primary: '#a855f7',
    primaryForeground: '#ffffff',
    background: '#0d1117',
    foreground: '#e8eaed',
    card: '#161b22',
    border: '#30363d',
    accent: '#d946ef',
    mutedForeground: '#8b949e',
    input: '#0d1117',
    surfaceHigh: '#21262d',
    destructive: '#f85149',
    textDim: '#6e7681',
  },
  nightblue: {
    name: 'nightblue',
    label: 'Night Blue',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    background: '#0f172a',
    foreground: '#e2e8f0',
    card: '#1e293b',
    border: '#334155',
    accent: '#60a5fa',
    mutedForeground: '#94a3b8',
    input: '#0f172a',
    surfaceHigh: '#1e293b',
    destructive: '#ef4444',
    textDim: '#64748b',
  },
};

export const THEME_LABELS: Record<ThemeName, string> = {
  teal: '🌊 Teal',
  coral: '🪸 Coral',
  gems: '💎 Gems',
  nightblue: '🌙 Night Blue',
};

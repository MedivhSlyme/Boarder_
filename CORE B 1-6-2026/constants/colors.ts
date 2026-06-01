export type ThemeName = 'base' | 'coral' | 'sunset' | 'nightBlue' | 'nemesis' | 'holy' | 'crimson' | 'druid';

export interface ColorPalette {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  textDim: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  surfaceHigh: string;
}

const base: ColorPalette = {
  text: '#ffffff',
  tint: '#0a3656',
  background: '#000000',
  foreground: '#e6d4ae',
  card: '#0c0c0c',
  cardForeground: '#ffffff',
  primary: '#4fc4c4',
  primaryForeground: '#000000',
  secondary: '#161616',
  secondaryForeground: '#f1b900',
  muted: '#161616',
  mutedForeground: '#b3b3b3',
  textDim: '#737373',
  accent: '#1ba79e',
  accentForeground: '#000000',
  destructive: '#e50c00',
  destructiveForeground: '#ffffff',
  border: '#242424',
  input: '#0c0c0c',
  surfaceHigh: '#161616',
};

const coral: ColorPalette = {
  text: '#ffffff',
  tint: '#f4728f',
  background: '#14080e',
  foreground: '#ffe4ef',
  card: '#220f17',
  cardForeground: '#ffffff',
  primary: '#ff5e7e',
  primaryForeground: '#14080e',
  secondary: '#321622',
  secondaryForeground: '#ffd075',
  muted: '#321622',
  mutedForeground: '#cca4b5',
  textDim: '#8c586f',
  accent: '#14dbcc',
  accentForeground: '#14080e',
  destructive: '#ff3366',
  destructiveForeground: '#ffffff',
  border: '#4a2033',
  input: '#220f17',
  surfaceHigh: '#321622',
};

const sunset: ColorPalette = {
  text: '#f9e4d0',
  tint: '#ff6b35',
  background: '#140703',
  foreground: '#f9e4d0',
  card: '#240f06',
  cardForeground: '#f9e4d0',
  primary: '#ff6b35',
  primaryForeground: '#140703',
  secondary: '#36180a',
  secondaryForeground: '#ffb347',
  muted: '#36180a',
  mutedForeground: '#c29b85',
  textDim: '#85543a',
  accent: '#ffcc00',
  accentForeground: '#140703',
  destructive: '#ff4466',
  destructiveForeground: '#ffffff',
  border: '#522510',
  input: '#240f06',
  surfaceHigh: '#36180a',
};

const nightBlue: ColorPalette = {
  text: '#d0d8ff',
  tint: '#3a6ac8',
  background: '#080c18',
  foreground: '#d0d8ff',
  card: '#0e1628',
  cardForeground: '#d0d8ff',
  primary: '#3a6ac8',
  primaryForeground: '#ffffff',
  secondary: '#101d38',
  secondaryForeground: '#d0d8ff',
  muted: '#101d38',
  mutedForeground: '#4a6090',
  textDim: '#1a2850',
  accent: '#a8c4d8',
  accentForeground: '#080c18',
  destructive: '#ff4d6a',
  destructiveForeground: '#ffffff',
  border: '#1a2545',
  input: '#0e1628',
  surfaceHigh: '#101d38',
};

const nemesis: ColorPalette = {
  text: '#1a1a1a',
  tint: '#2a9d8f',
  background: '#f5f2ee',
  foreground: '#1a1a1a',
  card: '#edeae5',
  cardForeground: '#1a1a1a',
  primary: '#2a9d8f',
  primaryForeground: '#ffffff',
  secondary: '#ddd9d3',
  secondaryForeground: '#1a1a1a',
  muted: '#ddd9d3',
  mutedForeground: '#7a7670',
  textDim: '#b0ada8',
  accent: '#1a1a1a',
  accentForeground: '#f5f2ee',
  destructive: '#c0392b',
  destructiveForeground: '#ffffff',
  border: '#ccc8c2',
  input: '#edeae5',
  surfaceHigh: '#ddd9d3',
};

const holy: ColorPalette = {
  text: '#2c1f0e',
  tint: '#00b4c8',
  background: '#fdf6e3',
  foreground: '#2c1f0e',
  card: '#f5ead0',
  cardForeground: '#2c1f0e',
  primary: '#00b4c8',
  primaryForeground: '#fdf6e3',
  secondary: '#ecddb8',
  secondaryForeground: '#2c1f0e',
  muted: '#ecddb8',
  mutedForeground: '#a08040',
  textDim: '#c8b87a',
  accent: '#c8973a',
  accentForeground: '#2c1f0e',
  destructive: '#e600aa',
  destructiveForeground: '#ffffff',
  border: '#ddd0a0',
  input: '#f5ead0',
  surfaceHigh: '#ecddb8',
};

const crimson: ColorPalette = {
  text: '#ffffff',
  tint: '#e62232',
  background: '#160406',
  foreground: '#ffd6db',
  card: '#240a0e',
  cardForeground: '#ffffff',
  primary: '#e62232',
  primaryForeground: '#160406',
  secondary: '#3a1015',
  secondaryForeground: '#ffffff',
  muted: '#3a1015',
  mutedForeground: '#b8868c',
  textDim: '#7a4248',
  accent: '#ff1493',
  accentForeground: '#ffffff',
  destructive: '#ff3333',
  destructiveForeground: '#ffffff',
  border: '#4d161d',
  input: '#240a0e',
  surfaceHigh: '#3a1015',
};

const druid: ColorPalette = {
  text: '#ffffff',
  tint: '#12b84c',
  background: '#041608',
  foreground: '#d6ffd9',
  card: '#0a2410',
  cardForeground: '#ffffff',
  primary: '#12b84c',
  primaryForeground: '#041608',
  secondary: '#103a18',
  secondaryForeground: '#ffffff',
  muted: '#103a18',
  mutedForeground: '#86b88f',
  textDim: '#427a4b',
  accent: '#00f5a0',
  accentForeground: '#041608',
  destructive: '#ff3366',
  destructiveForeground: '#ffffff',
  border: '#164d20',
  input: '#0a2410',
  surfaceHigh: '#103a18',
};

export const THEMES: Record<ThemeName, ColorPalette> = { base, coral, sunset, nightBlue, nemesis, holy, crimson, druid };

export const THEME_META: Record<ThemeName, { label: string; preview: string[] }> = {
  base:      { label: 'Jade',       preview: ['#000000', '#e6d4ae', '#28b8ae'] },
  coral:     { label: 'Coral',      preview: ['#14080e', '#ff5e7e', '#14dbcc'] },
  sunset:    { label: 'Sunset',     preview: ['#140703', '#ff6b35', '#ffcc00'] },
  nightBlue: { label: 'Night',      preview: ['#080c18', '#3a6ac8', '#a8c4d8'] },
  nemesis:   { label: 'Nemesis',    preview: ['#f5f2ee', '#2a9d8f', '#1a1a1a'] },
  holy:      { label: 'Holactie',   preview: ['#fdf6e3', '#00b4c8', '#c8973a'] },
  crimson:   { label: 'Crimson',    preview: ['#160406', '#e62232', '#ff1493'] },
  druid:     { label: 'Druid',      preview: ['#041608', '#12b84c', '#00f5a0'] },
};

const colors = {
  light: base,
  dark: base,
  radius: 14,
};

export default colors;
import { useAuth } from '../context/AuthContext';
import { THEMES, ThemeColors } from '../constants/themes';

export function useColors(): ThemeColors {
  const { currentUser } = useAuth();
  const themeName = (currentUser?.theme as any) || 'teal';
  return THEMES[themeName] || THEMES.teal;
}

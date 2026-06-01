import { useTheme } from '@/context/ThemeContext';
import colors from '@/constants/colors';

export function useColors() {
  const { palette } = useTheme();
  return { ...palette, radius: colors.radius };
}

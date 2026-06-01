// Settings is now a tab — this file kept for backwards-compat redirects only.
import { Redirect } from 'expo-router';
export default function SettingsRedirect() {
  return <Redirect href="/(tabs)/settings" />;
}

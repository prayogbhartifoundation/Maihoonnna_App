import { Stack } from 'expo-router';

export default function SathiLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="apply" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="match" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="hours" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="guide" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

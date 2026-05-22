import { Stack } from 'expo-router';

export default function CareCompanionLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="schedule" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="visit-details" options={{ headerShown: false }} />
        </Stack>
    );
}

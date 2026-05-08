import { Stack } from 'expo-router';
import React from 'react';

export default function BeneficiaryLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="schedule" />
            <Stack.Screen name="meds" />
            <Stack.Screen name="inbox" />
            <Stack.Screen name="more" />
            <Stack.Screen name="team" />
        </Stack>
    );
}


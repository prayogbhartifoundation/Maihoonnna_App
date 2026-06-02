import { Stack } from 'expo-router';
import React from 'react';

export default function SubscriberLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      {/*
        gestureEnabled: false on the root 'index' screen prevents the iOS swipe-back
        gesture from exiting the subscriber section. Once you're on the dashboard,
        back should not take you anywhere — the auth guard is handled at the layout level.
      */}
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

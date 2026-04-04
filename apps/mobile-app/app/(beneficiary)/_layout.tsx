import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function BeneficiaryLayout() {
    const colorScheme = useColorScheme();
    const tintColor = '#FF6B00'; // Brand orange for active tab

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: tintColor,
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#eee',
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: 'Outfit-Medium', // Assuming Outfit based on common premium feel
                }
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Schedule',
                    tabBarIcon: ({ color }) => <Feather name="calendar" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="meds"
                options={{
                    title: 'Meds',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="inbox"
                options={{
                    title: 'Inbox',
                    tabBarIcon: ({ color }) => <Feather name="inbox" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color }) => <Feather name="more-horizontal" size={24} color={color} />,
                }}
            />
            {/* Detail screens — hidden from the tab bar */}
            <Tabs.Screen
                name="team"
                options={{ href: null }} // removes it from tab bar entirely
            />
        </Tabs>
    );
}

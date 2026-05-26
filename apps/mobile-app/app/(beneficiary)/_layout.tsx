import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const visibleTabs = ['index', 'schedule', 'meds', 'inbox', 'more'];

export default function BeneficiaryLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => {
                const showInTabBar = visibleTabs.includes(route.name);

                return {
                    headerShown: false,
                    tabBarActiveTintColor: '#FF6A00',
                    tabBarInactiveTintColor: '#6B7280',
                    tabBarButton: showInTabBar ? undefined : () => null,
                    tabBarItemStyle: showInTabBar ? undefined : { display: 'none' },
                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        borderTopWidth: 0,
                        height: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 68 : 72,
                        paddingBottom: Platform.OS === 'ios' ? 32 : Platform.OS === 'web' ? 8 : 12,
                        paddingTop: Platform.OS === 'web' ? 8 : 10,
                        elevation: 10,
                        shadowColor: '#000000',
                        shadowOpacity: 0.08,
                        shadowOffset: { width: 0, height: -4 },
                        shadowRadius: 12,
                    },
                    tabBarLabelStyle: {
                        fontFamily: 'Poppins-Medium',
                        fontSize: 12,
                        fontWeight: '500',
                    },
                    tabBarIconStyle: {
                        marginBottom: 0,
                    },
                };
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => (
                        <Feather name="home" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Schedule',
                    tabBarLabel: 'Schedule',
                    tabBarIcon: ({ color }) => (
                        <Feather name="calendar" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="meds"
                options={{
                    title: 'Meds',
                    tabBarLabel: 'Meds',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="pill" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="inbox"
                options={{
                    title: 'Inbox',
                    tabBarLabel: 'Inbox',
                    tabBarIcon: ({ color }) => (
                        <Feather name="inbox" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarLabel: 'More',
                    tabBarIcon: ({ color }) => (
                        <Feather name="more-horizontal" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
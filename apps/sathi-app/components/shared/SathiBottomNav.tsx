import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const DEEP_ORANGE = '#FE6700';

export function SathiBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/' && pathname === '/(sathi)') return true;
    if (route !== '/' && pathname.includes(route)) return true;
    return false;
  };

  return (
    <View style={styles.bottomTabBar}>
      <View style={styles.tabContainer}>
        {/* Home Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace('/(sathi)')}
        >
          <Ionicons
            name={isActive('/') ? 'home' : 'home-outline'}
            size={24}
            color={isActive('/') ? DEEP_ORANGE : '#9CA3AF'}
          />
          <Text style={[styles.tabText, isActive('/') && { color: DEEP_ORANGE }]}>Home</Text>
        </TouchableOpacity>

        {/* Match Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace('/(sathi)/match')}
        >
          <Ionicons
            name={isActive('match') ? 'heart' : 'heart-outline'}
            size={24}
            color={isActive('match') ? DEEP_ORANGE : '#9CA3AF'}
          />
          <Text style={[styles.tabText, isActive('match') && { color: DEEP_ORANGE }]}>Match</Text>
        </TouchableOpacity>

        {/* Hours Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace('/(sathi)/hours')}
        >
          <Ionicons
            name={isActive('hours') ? 'time' : 'time-outline'}
            size={24}
            color={isActive('hours') ? DEEP_ORANGE : '#9CA3AF'}
          />
          <Text style={[styles.tabText, isActive('hours') && { color: DEEP_ORANGE }]}>Hours</Text>
        </TouchableOpacity>

        {/* Guide Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace('/(sathi)/guide')}
        >
          <Ionicons
            name={isActive('guide') ? 'book' : 'book-outline'}
            size={24}
            color={isActive('guide') ? DEEP_ORANGE : '#9CA3AF'}
          />
          <Text style={[styles.tabText, isActive('guide') && { color: DEEP_ORANGE }]}>Guide</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 85 : 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    zIndex: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 440,
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  tabText: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Poppins_600SemiBold',
    color: '#9CA3AF',
  },
});

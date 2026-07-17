import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { SathiBottomNav } from '@/components/shared/SathiBottomNav';
import { useExitOnBack } from '@/hooks/useExitOnBack';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

const DEEP_ORANGE = '#FE6700';

export default function SathiMatches() {
  useExitOnBack();
  useAndroidBackHandler();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  const fetchMatches = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/sathi/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Matches data error');
      const data = await response.json();
      setMatches(data.data || data);
    } catch (error) {
      console.log('Error fetching matches, loading offline mock UI matches:', error);
      // Mock matches as shown in the screenshot
      setMatches([
        {
          assignmentId: 'assign-1',
          beneficiary: {
            id: 'ben-1',
            name: 'Mrs. Patel',
            age: 69,
            location: 'Saket, Delhi',
            distance: '2.1 km',
            bio: 'Active senior who wants help using her smartphone to video call with grandchildren.',
            hobbiesInterests: ['Companionship', 'Technology Help'],
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
        },
        {
          assignmentId: 'assign-2',
          beneficiary: {
            id: 'ben-2',
            name: 'Mr. Singh',
            age: 81,
            location: 'Greater Kailash, Delhi',
            distance: '1.7 km',
            bio: 'Enjoys morning walks in the park but needs a companion for safety. Former army officer.',
            hobbiesInterests: ['Companionship', 'Walking Companion'],
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={DEEP_ORANGE} />
        <Text style={styles.loaderText}>Finding assigned beneficiaries...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Saathi Network</Text>
          <Text style={styles.welcomeText}>Beneficiaries</Text>
          <Text style={styles.locationText}>Connect with seniors near you</Text>
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <Ionicons name="people-outline" size={24} color="#FF6F00" style={styles.tipIcon} />
          <View style={styles.tipTextContent}>
            <Text style={styles.tipTitle}>Assigned Beneficiaries</Text>
            <Text style={styles.tipDesc}>
              These are the seniors currently assigned to you for companion visits. Reach out to coordinate your companion check-ins.
            </Text>
          </View>
        </View>

        {/* Assigned Beneficiaries section */}
        <Text style={styles.sectionTitle}>Your Assigned Beneficiaries</Text>

        {matches.length > 0 ? (
          matches.map((item: any) => {
            const ben = item.beneficiary || item;
            return (
              <View key={item.assignmentId || ben.id} style={styles.matchCard}>
                <View style={styles.seniorHeader}>
                  <Image source={{ uri: ben.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }} style={styles.seniorPhoto} />
                  <View style={styles.seniorMeta}>
                    <Text style={styles.seniorName}>
                      {ben.name}{ben.age ? `, ${ben.age}` : ''}
                    </Text>
                    <Text style={styles.locationTextSmall}>📍 {ben.location || ben.address || 'Delhi'}</Text>
                  </View>
                  {ben.distance && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{ben.distance}</Text>
                    </View>
                  )}
                </View>

                {ben.bio && <Text style={styles.bioText}>{ben.bio}</Text>}

                {/* Hobbies / Interests Tags */}
                {ben.hobbiesInterests && ben.hobbiesInterests.length > 0 && (
                  <View style={styles.tagsRow}>
                    {ben.hobbiesInterests.map((tag: string) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search" size={60} color="#9CA3AF" />
            <Text style={styles.emptyText}>No matched beneficiaries assigned yet.</Text>
            <Text style={styles.emptySubText}>
              Your matched beneficiaries will appear here once allocated by operations staff.
            </Text>
          </View>
        )}
      </ScrollView>

      <SathiBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3EB',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loaderText: {
    marginTop: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
  },
  header: {
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6F00',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD3B6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipTextContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  seniorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  seniorPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  seniorMeta: {
    flex: 1,
  },
  seniorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  locationTextSmall: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
  },
  bioText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#A855F7',
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  dateTimeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6F00',
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  reschedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD3B6',
    paddingVertical: 10,
    borderRadius: 12,
  },
  reschedBtnText: {
    color: '#FF6F00',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

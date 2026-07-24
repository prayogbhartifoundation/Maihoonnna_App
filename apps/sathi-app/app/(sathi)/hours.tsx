import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
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

export default function SathiHours() {
  useExitOnBack();
  useAndroidBackHandler();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [assignedMatches, setAssignedMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [creditsLedger, setCreditsLedger] = useState<any[]>([]);

  // Timer state for active visit
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const loadHoursData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // 1. Fetch Dashboard to check active visit log session
      const dashRes = await fetch(`${API_URL}/sathi/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dash = await dashRes.json();
      const dashData = dash.data || dash;
      setActiveSession(dashData.activeVisit || null);

      // 2. Fetch Assignments matches list
      const matchesRes = await fetch(`${API_URL}/sathi/matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const matchesData = await matchesRes.json();
      const matches = matchesData.data || matchesData;
      setAssignedMatches(matches || []);
      if (matches && matches.length > 0 && !selectedMatch) {
        setSelectedMatch(matches[0]);
      }

      // 3. Fetch completed visit history logs
      const historyRes = await fetch(`${API_URL}/sathi/hours`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      setVisitHistory(historyData.data || historyData || []);

      // 4. Fetch credits points transaction ledger
      const creditsRes = await fetch(`${API_URL}/sathi/credits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const creditsData = await creditsRes.json();
      setCreditsLedger(creditsData.data || creditsData || []);

    } catch (err) {
      console.log('Error fetching hours records, using mock state:', err);
      // Mocks for local layout
      setAssignedMatches([
        { assignmentId: 'assign-1', beneficiary: { id: 'ben-1', name: 'Mrs. Patel' } },
        { assignmentId: 'assign-2', beneficiary: { id: 'ben-2', name: 'Mr. Singh' } }
      ]);
      setVisitHistory([
        {
          id: 'vlog-1',
          checkInTime: new Date(Date.now() - 86400000).toISOString(),
          hoursEarned: 2.0,
          creditPointsEarned: 20,
          beneficiary: { name: 'Mrs. Patel' }
        },
        {
          id: 'vlog-2',
          checkInTime: new Date(Date.now() - 172800000).toISOString(),
          hoursEarned: 1.5,
          creditPointsEarned: 15,
          beneficiary: { name: 'Mr. Singh' }
        }
      ]);
      setCreditsLedger([
        { id: 'tx-1', description: 'Volunteered with Mrs. Patel', pointsDelta: 20, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 'tx-2', description: 'Volunteered with Mr. Singh', pointsDelta: 15, createdAt: new Date(Date.now() - 172800000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHoursData();
    }, [])
  );

  // Active visit elapsed time counter tick
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const start = new Date(activeSession.checkInTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      const fHrs = hrs.toString().padStart(2, '0');
      const fMins = mins.toString().padStart(2, '0');
      const fSecs = secs.toString().padStart(2, '0');

      setElapsedTime(`${fHrs}:${fMins}:${fSecs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleCheckin = async () => {
    if (!selectedMatch) {
      Alert.alert('Selection Required', 'Please assign a beneficiary to check-in.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/sathi/visits/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          beneficiaryId: selectedMatch.beneficiary.id,
          assignmentId: selectedMatch.assignmentId
        })
      });

      const data = await response.json();
      if (response.ok || data.success) {
        Alert.alert('Checked In', 'Visit session started successfully!');
        loadHoursData();
      } else {
        Alert.alert('Check-In Failed', data.message || 'Verification conflict.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection to backend API failed.');
    }
  };

  // Checkout is now handled by the beneficiary from their app.
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={DEEP_ORANGE} />
        <Text style={styles.loaderText}>Loading visit records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Saathi Network</Text>
          <Text style={styles.title}>Log Companion Hours</Text>
        </View>

        {/* Visit Logger Interface Card */}
        {activeSession ? (
          /* Active visit / Checkout mode */
          <View style={styles.activeCard}>
            <View style={styles.rowAlign}>
              <MaterialCommunityIcons name="timer-sand" size={32} color="#FE6700" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.activeTitle}>Active Visit Session</Text>
                <Text style={styles.activeSubtitle}>Volunteering Companion</Text>
              </View>
            </View>

            <Text style={styles.timerVal}>{elapsedTime}</Text>

            <View style={{ marginTop: 16, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8 }}>
              <Text style={{ color: '#92400E', fontFamily: 'Poppins-Medium', textAlign: 'center', fontSize: 13 }}>
                Waiting for beneficiary to confirm completion from their app.
              </Text>
            </View>
          </View>
        ) : (
          /* Checkin mode */
          <View style={styles.loggerCard}>
            <Text style={styles.cardTitle}>Start Visit check-in</Text>
            <Text style={styles.cardDesc}>
              Select your matched senior beneficiary from the list below and check-in to begin logging your hours.
            </Text>

            {assignedMatches.length > 0 ? (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Matched Seniors</Text>
                <View style={styles.matchesRow}>
                  {assignedMatches.map((m) => (
                    <TouchableOpacity
                      key={m.assignmentId}
                      style={[
                        styles.matchSelector,
                        selectedMatch?.assignmentId === m.assignmentId && styles.matchSelectorActive
                      ]}
                      onPress={() => setSelectedMatch(m)}
                    >
                      <Text
                        style={[
                          styles.matchSelectorText,
                          selectedMatch?.assignmentId === m.assignmentId && styles.matchSelectorTextActive
                        ]}
                      >
                        {m.beneficiary.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.checkinBtn} onPress={handleCheckin}>
                  <Text style={styles.checkinBtnText}>Check-In Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.emptyPrompt}>
                You do not have any matched seniors assigned yet. Go to matches to request senior pairings.
              </Text>
            )}
          </View>
        )}

        {/* Visit Logs History */}
        <Text style={styles.sectionTitle}>Completed Visits History</Text>
        {visitHistory.length > 0 ? (
          visitHistory.map((item) => (
              <View key={item.id} style={[styles.historyItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.historyName}>{item.beneficiary?.name}</Text>
                    <Text style={styles.historyDate}>
                      📅 {new Date(item.checkInTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.historyMetrics}>
                    <Text style={styles.historyHours}>
                      {item.minutesLogged 
                        ? `${Math.floor(item.minutesLogged / 60)}h ${Math.floor(item.minutesLogged % 60)}m`
                        : `${item.hoursEarned?.toFixed(1)} hrs`}
                    </Text>
                    <Text style={styles.historyPoints}>+{item.creditPointsEarned?.toFixed(0)} pts</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={{ marginTop: 12, backgroundColor: '#E5E7EB', paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
                  onPress={() => Alert.alert('Feedback', 'Thank you for your feedback! This helps us improve the program.')}
                >
                  <Text style={{ color: '#4B5563', fontFamily: 'Poppins-Medium', fontSize: 13 }}>⭐ Feedback</Text>
                </TouchableOpacity>
              </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No completed visits logged.</Text>
        )}

        {/* Credits Ledger Transaction Ledger */}
        <Text style={styles.sectionTitle}>Points ledger Transaction ledger</Text>
        {creditsLedger.length > 0 ? (
          creditsLedger.map((item) => (
            <View key={item.id} style={styles.ledgerItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ledgerDesc} numberOfLines={1}>
                  {item.description || 'Companion visit completed'}
                </Text>
                <Text style={styles.ledgerDate}>
                  {new Date(item.createdAt || Date.now()).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.ledgerPoints}>+{item.pointsDelta?.toFixed(0)} pts</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No ledger transactions recorded.</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  loggerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 16,
  },
  pickerContainer: {
    marginTop: 8,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  matchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  matchSelector: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  matchSelectorActive: {
    backgroundColor: '#FF6F00',
  },
  matchSelectorText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  matchSelectorTextActive: {
    color: '#FFFFFF',
  },
  checkinBtn: {
    backgroundColor: '#FF6F00',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkinBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyPrompt: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD3B6',
    padding: 18,
    marginBottom: 24,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  activeSubtitle: {
    fontSize: 11,
    color: '#FE6700',
    fontWeight: '600',
  },
  timerVal: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginVertical: 20,
    fontVariant: ['tabular-nums'],
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  checkoutBtn: {
    backgroundColor: '#FF6F00',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  historyMetrics: {
    alignItems: 'flex-end',
  },
  historyHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyPoints: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  ledgerDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  ledgerDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  ledgerPoints: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
});

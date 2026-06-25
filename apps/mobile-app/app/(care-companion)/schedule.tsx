import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, Modal, Pressable, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { CompanionBottomNav } from '../../components/care-companion/CompanionBottomNav';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

const DEEP_ORANGE = '#FE6700';
const LIGHT_BEIGE = '#FAF3EB';
const SOFT_PEACH = '#FFF0E6';
const MAX_CONTENT_WIDTH = 398;
const BASE_HORIZONTAL_PADDING = 16;

// ─── Filter Definitions ──────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: 'scheduled', label: 'Scheduled', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'in_progress', label: 'In Progress', color: '#3B82F6', bg: '#DBEAFE' },
  { key: 'completed', label: 'Completed', color: '#10B981', bg: '#D1FAE5' },
  { key: 'cancelled', label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
];

const TIME_FILTERS = [
  { key: 'morning', label: 'Morning (6AM-12PM)' },
  { key: 'afternoon', label: 'Afternoon (12-5PM)' },
  { key: 'evening', label: 'Evening (5PM-9PM)' },
];

const TYPE_FILTERS = [
  { key: 'Home Visit', label: 'Home Visit' },
  { key: 'Clinic Visit', label: 'Clinic Visit' },
  { key: 'Follow-up', label: 'Follow-up' },
];

function getTimeSlot(timeStr: string | undefined): string {
  if (!timeStr) return 'other';
  const [timePart, period] = (timeStr || '').split(' ');
  const [hours] = timePart.split(':').map(Number);
  let h = hours;
  if (period === 'PM' && hours !== 12) h += 12;
  if (period === 'AM' && hours === 12) h = 0;
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'other';
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
    const { push, replace, pop } = useNavigationStack();
    useAndroidBackHandler();
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Today');
  const [filterOpen, setFilterOpen] = useState(false);

  // Multi-select filter state
  const [selStatus, setSelStatus] = useState<string[]>([]);
  const [selTime, setSelTime] = useState<string[]>([]);
  const [selType, setSelType] = useState<string[]>([]);

  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) { replace('/(auth)'); return; }
        const response = await fetch(`${API_URL}/care-companion/schedule`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Schedule API error');
        const json = await response.json();
        if (json.success && json.data) { setScheduleData(json.data); }
        else setFallbackData();
      } catch (err) { setFallbackData(); }
      finally { setLoading(false); }
    };
    if (fontsLoaded) fetchSchedule();
  }, [fontsLoaded]);

  const setFallbackData = () => {
    setScheduleData({
      visits: [
        { id: 'v1', visitCode: 'V1A2B3C4', patientName: 'Margaret Thompson', address: '123 Oak Street, Apt 4B', time: '10:00 AM', distance: '2.3 km', type: 'Home Visit', status: 'scheduled', tabType: 'Today' },
        { id: 'v2', visitCode: 'V9D8E7F6', patientName: 'Robert Chen', address: '456 Maple Avenue', time: '2:00 PM', distance: '3.7 km', type: 'Home Visit', status: 'in_progress', tabType: 'Today' },
        { id: 'v3', visitCode: 'V5X4Y3Z2', patientName: 'Sameer Tandon', address: '123 Oak Street, Apt 4B', time: '11:00 AM', distance: '2.3 km', type: 'Home Visit', status: 'scheduled', tabType: 'Tomorrow' },
      ]
    });
  };

  const handleStartVisit = (visitId: string) => {
    push({ pathname: '/(care-companion)/visit-details' as any, params: { visitId } });
  };

  const toggleFilter = <T extends string>(val: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const clearAllFilters = () => { setSelStatus([]); setSelTime([]); setSelType([]); };
  const activeFilterCount = selStatus.length + selTime.length + selType.length;
  const contentWidth = Math.min(Math.max(width - BASE_HORIZONTAL_PADDING * 2, 0), MAX_CONTENT_WIDTH);
  const responsiveContentStyle = {
    width: contentWidth,
    alignSelf: 'center' as const,
  };

  const tabVisits = useMemo(() => {
    if (!scheduleData) return [];
    return scheduleData.visits.filter((v: any) => v.tabType === activeTab);
  }, [scheduleData, activeTab]);

  const filteredVisits = useMemo(() => {
    return tabVisits.filter((v: any) => {
      if (selStatus.length > 0 && !selStatus.includes(v.status)) return false;
      if (selTime.length > 0 && !selTime.includes(getTimeSlot(v.time))) return false;
      if (selType.length > 0 && !selType.includes(v.type)) return false;
      return true;
    });
  }, [tabVisits, selStatus, selTime, selType]);

  if (!fontsLoaded || loading || !scheduleData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={DEEP_ORANGE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.deepOrangeHeader}>
          <View style={[styles.headerTitleRow, responsiveContentStyle]}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Schedule</Text>
              <Text style={styles.headerSub}>Manage your visits</Text>
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
              <Ionicons name="funnel-outline" size={24} color="#FFFFFF" />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Active filters row */}
          {activeFilterCount > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.activeFiltersScroll, responsiveContentStyle]}>
              {selStatus.map(s => {
                const f = STATUS_FILTERS.find(sf => sf.key === s);
                return (
                  <TouchableOpacity key={s} style={styles.activeChip} onPress={() => setSelStatus(prev => prev.filter(v => v !== s))}>
                    <Text style={styles.activeChipText}>{f?.label} x</Text>
                  </TouchableOpacity>
                );
              })}
              {selTime.map(t => {
                const f = TIME_FILTERS.find(tf => tf.key === t);
                return (
                  <TouchableOpacity key={t} style={styles.activeChip} onPress={() => setSelTime(prev => prev.filter(v => v !== t))}>
                    <Text style={styles.activeChipText}>{f?.label} x</Text>
                  </TouchableOpacity>
                );
              })}
              {selType.map(t => (
                <TouchableOpacity key={t} style={styles.activeChip} onPress={() => setSelType(prev => prev.filter(v => v !== t))}>
                  <Text style={styles.activeChipText}>{t} x</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.activeChip, { backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={clearAllFilters}>
                <Text style={styles.activeChipText}>Clear all</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        <View style={[styles.contentArea, responsiveContentStyle]}>
          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            {[
              { key: 'Today', label: `Today (${scheduleData.visits.filter((v: any) => v.tabType === 'Today').length})` },
              { key: 'Tomorrow', label: `Tomorrow (${scheduleData.visits.filter((v: any) => v.tabType === 'Tomorrow').length})` },
              { key: 'Upcoming', label: `Upcoming (${scheduleData.visits.filter((v: any) => v.tabType === 'Upcoming').length})` },
            ].map(tab => (
              <TouchableOpacity key={tab.key} style={[styles.tabBtn, activeTab === tab.key && styles.activeTabBtn]} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results count if filtered */}
          {activeFilterCount > 0 && (
            <Text style={styles.resultsCount}>
              Showing {filteredVisits.length} of {tabVisits.length} visits
            </Text>
          )}

          {/* Visit List */}
          {filteredVisits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {activeFilterCount > 0 ? 'No visits match your filters' : 'No visits scheduled'}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredVisits.map((visit: any) => {
              const statusF = STATUS_FILTERS.find(sf => sf.key === visit.status);
              return (
                <View key={visit.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.patientName}>{visit.patientName}</Text>
                      {visit.visitCode ? <Text style={styles.visitCodeText}>Visit ID: {visit.visitCode}</Text> : null}
                    </View>
                    <View style={[styles.statusBadge, statusF ? { backgroundColor: statusF.bg } : {}]}>
                      <Text style={[styles.statusBadgeText, statusF ? { color: statusF.color } : {}]}>
                        {statusF?.label || visit.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.addressText}>{visit.address}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={18} color="#4B5563" />
                      <Text style={styles.metaText}>{visit.time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={18} color="#4B5563" />
                      <Text style={styles.metaText}>{visit.distance}</Text>
                    </View>
                  </View>

                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{visit.type}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, visit.status === 'completed' && { backgroundColor: '#6B7280', shadowColor: '#6B7280' }]}
                    onPress={() => handleStartVisit(visit.id)}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      {visit.status === 'completed' ? 'View Details' : visit.status === 'in_progress' ? 'Resume Visit' : 'Start Visit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <CompanionBottomNav />

      {/* ─── Filter Bottom Sheet ─── */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.filterSheet} onPress={e => e.stopPropagation()}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Visits</Text>
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {/* Status */}
              <Text style={styles.filterGroupLabel}>Status</Text>
              <View style={styles.chipRow}>
                {STATUS_FILTERS.map(f => {
                  const active = selStatus.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.chip, active && { backgroundColor: f.bg, borderColor: f.color }]}
                      onPress={() => toggleFilter(f.key, setSelStatus)}
                    >
                      {active && <Ionicons name="checkmark" size={13} color={f.color} style={styles.chipIcon} />}
                      <Text style={[styles.chipText, active && { color: f.color, fontFamily: 'Poppins_600SemiBold' }]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Time of Day */}
              <Text style={styles.filterGroupLabel}>Time of Day</Text>
              <View style={styles.chipRow}>
                {TIME_FILTERS.map(f => {
                  const active = selTime.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleFilter(f.key, setSelTime)}
                    >
                      {active && <Ionicons name="checkmark" size={13} color={DEEP_ORANGE} style={styles.chipIcon} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Visit Type */}
              <Text style={styles.filterGroupLabel}>Visit Type</Text>
              <View style={styles.chipRow}>
                {TYPE_FILTERS.map(f => {
                  const active = selType.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleFilter(f.key, setSelType)}
                    >
                      {active && <Ionicons name="checkmark" size={13} color={DEEP_ORANGE} style={styles.chipIcon} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterOpen(false)}>
              <Text style={styles.applyBtnText}>
                Show {filteredVisits.length} Visit{filteredVisits.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BEIGE },
  scrollContent: { flexGrow: 1 },

  deepOrangeHeader: {
    backgroundColor: DEEP_ORANGE,
    height: 80,
    paddingHorizontal: BASE_HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48 },
  headerSpacer: { width: 36, height: 36 },
  headerTextBlock: { flex: 1, minWidth: 0, marginLeft: 12 },
  headerTitle: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 20, lineHeight: 28 },
  headerSub: { fontFamily: 'Poppins_400Regular', color: '#DBEAFE', fontSize: 14, lineHeight: 20 },
  filterBtn: { width: 36, height: 36, alignItems: 'flex-end', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  filterBadge: {
    position: 'absolute', top: 0, right: -2,
    backgroundColor: '#FFFFFF', borderRadius: 10,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: DEEP_ORANGE },

  activeChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    marginRight: 8, flexDirection: 'row', alignItems: 'center',
  },
  activeChipText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  activeFiltersScroll: { marginTop: 10 },

  contentArea: { paddingHorizontal: 0, paddingTop: 17 },
  resultsCount: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280', marginBottom: 8, marginTop: -8 },

  segmentedControl: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 3,
    flexDirection: 'row',
    height: 36,
    marginTop: 0,
    marginBottom: 24,
  },
  tabBtn: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  activeTabBtn: { backgroundColor: DEEP_ORANGE },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 14, lineHeight: 20, color: '#333333', textAlign: 'center' },
  activeTabText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: 'Poppins_500Medium', color: '#9CA3AF', fontSize: 15, marginTop: 12 },
  clearBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: DEEP_ORANGE, borderRadius: 12 },
  clearBtnText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    minHeight: 206,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  patientName: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, lineHeight: 28, color: '#000000', flexShrink: 1 },
  visitCodeText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: DEEP_ORANGE, marginTop: 2 },
  statusBadge: { backgroundColor: SOFT_PEACH, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0 },
  statusBadgeText: { color: DEEP_ORANGE, fontSize: 12, lineHeight: 16, fontFamily: 'Poppins_500Medium', textTransform: 'lowercase' },

  addressText: { fontFamily: 'Poppins_400Regular', color: '#333333', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 8, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaText: { fontFamily: 'Poppins_400Regular', color: '#333333', marginLeft: 4, fontSize: 14, lineHeight: 20 },

  tagBadge: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 16 },
  tagText: { color: '#333333', fontSize: 12, lineHeight: 16, fontFamily: 'Poppins_500Medium' },

  primaryActionBtn: {
    backgroundColor: DEEP_ORANGE, borderRadius: 8, height: 36, alignItems: 'center', justifyContent: 'center',
    shadowColor: DEEP_ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_600SemiBold' },

  // ─── Filter Sheet ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  filterSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center',
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#111827' },
  clearAllText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: DEEP_ORANGE },

  filterGroupLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#374151', marginBottom: 10, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  chipActive: { borderColor: DEEP_ORANGE, backgroundColor: '#FFF7ED' },
  chipText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: DEEP_ORANGE, fontFamily: 'Poppins_600SemiBold' },
  chipIcon: { marginRight: 4 },
  sheetScroll: { maxHeight: 420 },
  bottomSpacer: { height: 100 },

  applyBtn: {
    backgroundColor: DEEP_ORANGE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: DEEP_ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  applyBtnText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 15 },
});
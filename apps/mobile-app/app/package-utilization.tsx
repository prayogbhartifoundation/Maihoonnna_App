import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import PackageUtilizationPanel, { DetailedUtilization } from '@/components/shared/PackageUtilizationPanel';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

type SummaryData = {
  type: 'summary';
  beneficiaryId: string;
  beneficiaryName: string;
  age: number;
  activePackage: string | null;
  hasLowBalance: boolean;
  hasExhausted: boolean;
};

export default function PackageUtilizationScreen() {
  const router = useRouter();
    const safeBack = useSafeBack();
  const { beneficiaryId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // The data could be a list of summaries (if subscriber without beneficiaryId),
  // or a detailed object (if beneficiary, or subscriber with specific beneficiaryId).
  const [summaryList, setSummaryList] = useState<SummaryData[] | null>(null);
  const [detailData, setDetailData] = useState<DetailedUtilization | null>(null);

  const fetchUtilization = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No auth token found');

      let url = `${API_URL}/shared/utilization`;
      if (beneficiaryId) url += `?beneficiaryId=${beneficiaryId}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load utilization data');
      }

      if (Array.isArray(data.data)) {
        setSummaryList(data.data);
      } else {
        setDetailData(data.data);
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilization();
  }, [beneficiaryId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => safeBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Utilization</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5B0A" />
          <Text style={styles.loadingText}>Loading utilization data...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUtilization}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {summaryList && summaryList.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Your Beneficiaries</Text>
              <Text style={styles.sectionSubtitle}>Select a beneficiary to view detailed usage</Text>
              
              {summaryList.map((item) => (
                <TouchableOpacity 
                  key={item.beneficiaryId} 
                  style={styles.summaryCard}
                  onPress={() => router.push({ pathname: '/package-utilization', params: { beneficiaryId: item.beneficiaryId } })}
                >
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryAvatar}>
                      <Text style={styles.summaryAvatarText}>{item.beneficiaryName.charAt(0)}</Text>
                    </View>
                    <View style={styles.summaryInfo}>
                      <Text style={styles.summaryName}>{item.beneficiaryName}</Text>
                      <Text style={styles.summaryMeta}>{item.age} years · {item.activePackage || 'No Package'}</Text>
                    </View>
                  </View>
                  <View style={styles.summaryStatus}>
                    {item.hasExhausted ? (
                      <View style={styles.statusBadgeExhausted}><Text style={styles.statusBadgeTextExhausted}>EXHAUSTED BENEFITS</Text></View>
                    ) : item.hasLowBalance ? (
                      <View style={styles.statusBadgeLow}><Text style={styles.statusBadgeTextLow}>LOW BALANCE</Text></View>
                    ) : (
                      <View style={styles.statusBadgeOk}><Text style={styles.statusBadgeTextOk}>ALL GOOD</Text></View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {summaryList && summaryList.length === 0 && (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No beneficiaries found.</Text>
            </View>
          )}

          {detailData && (
            <PackageUtilizationPanel data={detailData} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF2E8' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF2E8', borderBottomWidth: 1, borderBottomColor: '#F2E7DE' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 15, fontWeight: '500' },
  errorText: { marginTop: 12, color: '#EF4444', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#FF5B0A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  centerBox: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 16, alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 15 },

  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F2E7DE',
    ...Platform.select({
      ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  summaryAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryAvatarText: { fontSize: 18, fontWeight: '800', color: '#EA580C' },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  summaryMeta: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  summaryStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  
  statusBadgeExhausted: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeTextExhausted: { color: '#DC2626', fontSize: 11, fontWeight: '800' },
  statusBadgeLow: { backgroundColor: '#FEFCE8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeTextLow: { color: '#D97706', fontSize: 11, fontWeight: '800' },
  statusBadgeOk: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeTextOk: { color: '#16A34A', fontSize: 11, fontWeight: '800' },
});

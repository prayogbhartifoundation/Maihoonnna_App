import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { API_URL } from '@/constants/api';
import { useSafeBack } from '@/hooks/useSafeBack';

export default function SathiRequestScreen() {
  const { width } = useWindowDimensions();
  const MAX_CONTENT_WIDTH = 440;
  const responsiveStyle = { width: '100%' as const, maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const };

  const safeBack = useSafeBack();

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [remainingUnits, setRemainingUnits] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [reason, setReason] = useState('');

  // Date/Time Picker visibility
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');

      if (!token || !userStr) {
        Alert.alert('Session Expired', 'Please log in again.');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const beneficiaryId = user.id;

      const res = await fetch(`${API_URL}/beneficiary/sathi-requests/${beneficiaryId}/sathi/eligibility`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEligible(data.data.eligible);
        setRemainingUnits(data.data.remainingUnits);
      } else {
        setEligible(false);
      }
    } catch (err) {
      console.error('[SathiEligibility] Error checking eligibility:', err);
      setEligible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDate = (selectedDate: Date) => {
    setDate(selectedDate);
    setDatePickerVisibility(false);
  };

  const handleConfirmTime = (selectedTime: Date) => {
    setTime(selectedTime);
    setTimePickerVisibility(false);
  };

  const handleCreateRequest = async () => {
    if (!date) {
      Alert.alert('Error', 'Please select a date.');
      return;
    }
    if (!time) {
      Alert.alert('Error', 'Please select a time.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason or description for the visit.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');

      if (!token || !userStr) {
        Alert.alert('Error', 'Session not found. Please log in.');
        setSubmitting(false);
        return;
      }

      const user = JSON.parse(userStr);
      const beneficiaryId = user.id;

      // Combine Date and Time
      const combinedDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );

      const res = await fetch(`${API_URL}/beneficiary/sathi-requests/${beneficiaryId}/sathi/visit-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dateTime: combinedDateTime.toISOString(),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok || data.success) {
        Alert.alert('Success', 'Your Sathi companion request has been submitted to your care companions.', [
          { text: 'OK', onPress: () => safeBack() },
        ]);
      } else {
        throw new Error(data.message || 'Failed to submit request.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6A00" />
          <Text style={styles.loadingText}>Verifying Sathi Companion eligibility...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!eligible) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, responsiveStyle]}>
          <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sathi Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.content, styles.centerContent, responsiveStyle]}>
          <MaterialCommunityIcons name="heart-broken" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
          <Text style={styles.errorTitle}>Not Eligible</Text>
          <Text style={styles.errorDesc}>
            Your active subscription package does not include Sathi Companion hours. Please contact your coordinator to upgrade your package benefits.
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => safeBack()}>
            <Text style={styles.closeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, responsiveStyle]}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Sathi Companion</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={[styles.content, responsiveStyle]} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="heart-pulse" size={28} color="#FF6A00" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Companion Hours Available</Text>
            <Text style={styles.infoValue}>{remainingUnits} hours remaining</Text>
          </View>
        </View>

        {/* Date Selector */}
        <Text style={styles.label}>Select Date</Text>
        <TouchableOpacity style={styles.pickerField} onPress={() => setDatePickerVisibility(true)}>
          <Feather name="calendar" size={20} color="#6B7280" style={{ marginRight: 10 }} />
          <Text style={[styles.pickerText, !date && { color: '#9CA3AF' }]}>
            {date ? format(date, 'EEEE, d MMMM yyyy') : 'Choose date'}
          </Text>
        </TouchableOpacity>

        {/* Time Selector */}
        <Text style={styles.label}>Select Time</Text>
        <TouchableOpacity style={styles.pickerField} onPress={() => setTimePickerVisibility(true)}>
          <Feather name="clock" size={20} color="#6B7280" style={{ marginRight: 10 }} />
          <Text style={[styles.pickerText, !time && { color: '#9CA3AF' }]}>
            {time ? format(time, 'hh:mm a') : 'Choose time'}
          </Text>
        </TouchableOpacity>

        {/* Reason / Notes */}
        <Text style={styles.label}>Reason for Request</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Why do you need companionship today? (e.g., Morning walk, read together, setup medical call, grocery trip companion)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.disabledBtn]}
          onPress={handleCreateRequest}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Request</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date & Time Picker Modals */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        minimumDate={new Date()}
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={() => setTimePickerVisibility(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0E6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE3D1',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  closeBtn: {
    backgroundColor: '#FF6A00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE3D1',
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#FF6A00',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

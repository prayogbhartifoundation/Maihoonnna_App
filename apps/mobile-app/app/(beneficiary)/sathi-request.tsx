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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { API_URL } from '@/constants/api';
import { useSafeBack } from '@/hooks/useSafeBack';
import { sanitizeImageUri } from '@/utils/sanitizeImageUri';

export default function SathiRequestScreen() {
  const { width } = useWindowDimensions();
  const MAX_CONTENT_WIDTH = 440;
  const responsiveStyle = { width: '100%' as const, maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const };

  const safeBack = useSafeBack();

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [remainingUnits, setRemainingUnits] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);

  // Form Fields
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ title: string; message: string; volunteerName?: string } | null>(null);

  // Date/Time Picker visibility
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      try { window.alert(`${title}: ${message}`); } catch {}
    } else {
      Alert.alert(title, message);
    }
  };

  // Active Timer Ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');

      if (!token || !userStr) {
        showAlert('Session Expired', 'Please log in again.');
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
        
        if (data.data.eligible) {
          // Fetch linked volunteers
          const volRes = await fetch(`${API_URL}/beneficiary/sathi-requests/${beneficiaryId}/sathi/volunteers`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const volData = await volRes.json();
          if (volData.success) {
            setVolunteers(volData.data);
          }

          // Fetch my requests
          const reqRes = await fetch(`${API_URL}/beneficiary/sathi-requests/${beneficiaryId}/sathi/my-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const reqData = await reqRes.json();
          if (reqData.success) {
            setMyRequests(reqData.data);
          }
        }
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
    setFormError(null);
  };

  const handleConfirmTime = (selectedTime: Date) => {
    setTime(selectedTime);
    setTimePickerVisibility(false);
    setFormError(null);
  };

  const handleCreateRequest = async () => {
    setFormError(null);
    if (!date) {
      const msg = 'Please select a date for the visit.';
      setFormError(msg);
      showAlert('Error', msg);
      return;
    }
    if (!time) {
      const msg = 'Please select a time for the visit.';
      setFormError(msg);
      showAlert('Error', msg);
      return;
    }
    if (!reason.trim()) {
      const msg = 'Please enter a reason or description for the visit.';
      setFormError(msg);
      showAlert('Error', msg);
      return;
    }
    if (!selectedVolunteer) {
      const msg = 'Please select a volunteer.';
      setFormError(msg);
      showAlert('Error', msg);
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');

      if (!token || !userStr) {
        const msg = 'Session not found. Please log in.';
        setFormError(msg);
        showAlert('Error', msg);
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
          targetVolunteerId: selectedVolunteer.id
        }),
      });

      const data = await res.json();

      if (res.ok || data.success) {
        const volName = selectedVolunteer.name;
        // Show success modal
        setSuccessModal({
          title: 'Request Sent Successfully!',
          message: `Your visit request has been sent to ${volName}. You can track the status under 'My Requests'.`,
          volunteerName: volName,
        });
        showAlert('Success', `Your visit request has been sent to ${volName}.`);
        // Reset form
        setDate(null);
        setTime(null);
        setReason('');
        setFormError(null);
        checkEligibility();
      } else {
        throw new Error(data.message || 'Failed to submit request.');
      }
    } catch (err: any) {
      const msg = err.message || 'Something went wrong.';
      setFormError(msg);
      showAlert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondReschedule = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');
      if (!token || !userStr) return;
      const user = JSON.parse(userStr);
      
      const res = await fetch(`${API_URL}/beneficiary/sathi-requests/${user.id}/sathi/visit-requests/${requestId}/respond-reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok || data.success) {
        showAlert('Success', data.message || `Reschedule ${action === 'ACCEPT' ? 'accepted' : 'declined'} successfully.`);
        checkEligibility(); // Refresh list
      } else {
        throw new Error(data.message || 'Failed to respond to reschedule.');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Network error.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6A00" />
          <Text style={styles.loadingText}>Loading Saathi Network...</Text>
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
          <Text style={styles.headerTitle}>Saathi Network</Text>
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

  // --- RENDER FORM FOR SELECTED VOLUNTEER ---
  if (selectedVolunteer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, responsiveStyle]}>
          <TouchableOpacity onPress={() => setSelectedVolunteer(null)} style={styles.backBtn}>
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
          
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Requesting visit from:</Text>
            <View style={styles.targetInfo}>
               <Image source={{uri: sanitizeImageUri(selectedVolunteer.photo)}} style={styles.targetPhoto} />
               <Text style={styles.targetName}>{selectedVolunteer.name}</Text>
            </View>
          </View>

          {/* Date Selector */}
          <Text style={styles.label}>Select Date</Text>
          {Platform.OS === 'web' ? (
            <input 
              type="date" 
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #D1D5DB', fontSize: '14px', color: '#111827',
                fontFamily: 'inherit', outline: 'none'
              }}
              onChange={(e) => {
                if (e.target.value) setDate(new Date(e.target.value));
              }}
            />
          ) : (
            <TouchableOpacity style={styles.pickerField} onPress={() => setDatePickerVisibility(true)}>
              <Feather name="calendar" size={20} color="#6B7280" style={{ marginRight: 10 }} />
              <Text style={[styles.pickerText, !date && { color: '#9CA3AF' }]}>
                {date ? format(date, 'EEEE, d MMMM yyyy') : 'Choose date'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Time Selector */}
          <Text style={styles.label}>Select Time</Text>
          {Platform.OS === 'web' ? (
            <input 
              type="time" 
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #D1D5DB', fontSize: '14px', color: '#111827',
                fontFamily: 'inherit', outline: 'none'
              }}
              onChange={(e) => {
                if (e.target.value) {
                  const [hours, minutes] = e.target.value.split(':');
                  const newTime = new Date();
                  newTime.setHours(parseInt(hours, 10));
                  newTime.setMinutes(parseInt(minutes, 10));
                  setTime(newTime);
                }
              }}
            />
          ) : (
            <TouchableOpacity style={styles.pickerField} onPress={() => setTimePickerVisibility(true)}>
              <Feather name="clock" size={20} color="#6B7280" style={{ marginRight: 10 }} />
              <Text style={[styles.pickerText, !time && { color: '#9CA3AF' }]}>
                {time ? format(time, 'hh:mm a') : 'Choose time'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Reason / Notes */}
          <Text style={styles.label}>Reason for Request</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Why do you need companionship today? (e.g., Morning walk, read together, setup medical call...)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={(txt) => {
              setReason(txt);
              if (formError) setFormError(null);
            }}
          />

          {/* Form Error Banner */}
          {formError && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          )}

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

        {/* Success Modal Overlay */}
        {successModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalSuccessIconWrapper}>
                <Feather name="check" size={28} color="#059669" />
              </View>
              <Text style={styles.modalTitle}>{successModal.title}</Text>
              <Text style={styles.modalDesc}>{successModal.message}</Text>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => {
                  setSuccessModal(null);
                  setSelectedVolunteer(null);
                  checkEligibility();
                }}
              >
                <Text style={styles.modalDoneBtnText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // --- RENDER VOLUNTEER LIST ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, responsiveStyle]}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saathi Network</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={[styles.content, responsiveStyle]} showsVerticalScrollIndicator={false}>
        
        {/* Network Banner */}
        <View style={styles.networkBanner}>
          <View style={styles.heartIconWrapper}>
            <Feather name="heart" size={20} color="#EC4899" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>About Saathi Network</Text>
            <Text style={styles.bannerDesc}>
              Saathis provide companionship and support. All interactions are tracked for volunteer credits.
            </Text>
          </View>
        </View>

        {(() => {
          const rescheduledRequests = myRequests.filter(req => req.proposedDateTime != null);
          const otherRequests = myRequests.filter(req => req.proposedDateTime == null);
          
          return (
            <>
              {rescheduledRequests.length > 0 && (
                <View style={styles.requestsContainer}>
                  <Text style={styles.sectionTitle}>Rescheduled Requests</Text>
                  {rescheduledRequests.map((req) => (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.reqHeader}>
                        <Text style={styles.reqDate}>
                          {format(new Date(req.dateTime), 'MMM d, yyyy • h:mm a')}
                        </Text>
                        <View style={[
                          styles.statusBadge, 
                          req.status === 'ACCEPTED' ? styles.statusAccepted : 
                          req.status === 'REJECTED' ? styles.statusRejected : 
                          { backgroundColor: '#FFEDD5' }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            req.status === 'ACCEPTED' ? styles.statusTextAccepted : 
                            req.status === 'REJECTED' ? styles.statusTextRejected : 
                            { color: '#C2410C' }
                          ]}>
                            {req.status === 'ACCEPTED' ? 'RESCHEDULE ACCEPTED' : 
                             req.status === 'REJECTED' ? 'RESCHEDULE REJECTED' : 
                             'RESCHEDULE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reqReason} numberOfLines={2}>{req.reason}</Text>

                      {req.status === 'RESCHEDULE_PROPOSED' && req.proposedDateTime && (
                        <View style={{ backgroundColor: '#FFF7ED', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FED7AA' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#9A3412', marginBottom: 4 }}>
                            Proposed New Date:
                          </Text>
                          <Text style={{ fontSize: 13, color: '#C2410C', marginBottom: 8 }}>
                            {format(new Date(req.proposedDateTime), 'EEEE, d MMMM yyyy • h:mm a')}
                          </Text>
                          {req.rejectionReason && (
                            <Text style={{ fontSize: 13, color: '#9A3412', fontStyle: 'italic', marginBottom: 12 }}>
                              "{req.rejectionReason}"
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                              style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' }}
                              onPress={() => handleRespondReschedule(req.id, 'REJECT')}
                            >
                              <Text style={{ color: '#4B5563', fontWeight: '600', fontSize: 13 }}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F97316', alignItems: 'center' }}
                              onPress={() => handleRespondReschedule(req.id, 'ACCEPT')}
                            >
                              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>Accept</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {req.status === 'ACCEPTED' && req.otpCode && (
                        <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>Share this PIN when your Sathi arrives:</Text>
                          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#15803D', letterSpacing: 4 }}>{req.otpCode}</Text>
                        </View>
                      )}

                      {req.status === 'IN_PROGRESS' && (
                        <TouchableOpacity
                          style={{ backgroundColor: '#F97316', paddingVertical: 12, borderRadius: 8, marginTop: 4, marginBottom: 12, alignItems: 'center' }}
                          onPress={async () => {
                            try {
                              const token = await AsyncStorage.getItem('userToken');
                              const userStr = await AsyncStorage.getItem('userData');
                              if (!token || !userStr) return;
                              const user = JSON.parse(userStr);
                              
                              const res = await fetch(`${API_URL}/beneficiary/sathi-requests/${user.id}/sathi/visit-requests/${req.id}/complete`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                checkEligibility();
                                showAlert('Success', 'Visit completed!');
                              }
                            } catch (e) {}
                          }}
                        >
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Complete Visit</Text>
                        </TouchableOpacity>
                      )}

                      {req.volunteer && (
                        <View style={styles.reqVolunteer}>
                          <Image source={{uri: sanitizeImageUri(req.volunteer.profilePhoto, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120')}} style={styles.reqVolPhoto} />
                          <Text style={styles.reqVolName}>{req.volunteer.name}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {otherRequests.length > 0 && (
                <View style={styles.requestsContainer}>
                  <Text style={styles.sectionTitle}>My Requests</Text>
                  {otherRequests.map((req) => (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.reqHeader}>
                        <Text style={styles.reqDate}>
                          {format(new Date(req.dateTime), 'MMM d, yyyy • h:mm a')}
                        </Text>
                        <View style={[
                          styles.statusBadge, 
                          req.status === 'ACCEPTED' ? styles.statusAccepted : 
                          req.status === 'REJECTED' ? styles.statusRejected : 
                          req.status === 'IN_PROGRESS' ? { backgroundColor: '#DBEAFE' } :
                          req.status === 'COMPLETED' ? { backgroundColor: '#ECFCCB' } :
                          styles.statusPending
                        ]}>
                          <Text style={[
                            styles.statusText,
                            req.status === 'ACCEPTED' ? styles.statusTextAccepted : 
                            req.status === 'REJECTED' ? styles.statusTextRejected : 
                            req.status === 'IN_PROGRESS' ? { color: '#1E40AF' } :
                            req.status === 'COMPLETED' ? { color: '#3F6212' } :
                            styles.statusTextPending
                          ]}>
                            {req.status === 'IN_PROGRESS' ? (() => {
                               const start = new Date(req.updatedAt).getTime();
                               const diff = Math.max(0, currentTime.getTime() - start);
                               const h = Math.floor(diff / 3600000);
                               const m = Math.floor((diff % 3600000) / 60000);
                               const s = Math.floor((diff % 60000) / 1000);
                               return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                             })() : 
                             req.status === 'COMPLETED' ? 'COMPLETED' : 
                             req.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reqReason} numberOfLines={2}>{req.reason}</Text>

                      {req.status === 'ACCEPTED' && req.otpCode && (
                        <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>Share this PIN when your Sathi arrives:</Text>
                          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#15803D', letterSpacing: 4 }}>{req.otpCode}</Text>
                        </View>
                      )}

                      {req.status === 'IN_PROGRESS' && (
                        <TouchableOpacity
                          style={{ backgroundColor: '#F97316', paddingVertical: 12, borderRadius: 8, marginTop: 4, marginBottom: 12, alignItems: 'center' }}
                          onPress={async () => {
                            try {
                              const token = await AsyncStorage.getItem('userToken');
                              const userStr = await AsyncStorage.getItem('userData');
                              if (!token || !userStr) return;
                              const user = JSON.parse(userStr);
                              
                              const res = await fetch(`${API_URL}/beneficiary/sathi-requests/${user.id}/sathi/visit-requests/${req.id}/complete`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                checkEligibility();
                                showAlert('Success', 'Visit completed!');
                              }
                            } catch (e) {}
                          }}
                        >
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Complete Visit</Text>
                        </TouchableOpacity>
                      )}
                      {req.volunteer && (
                        <View style={styles.reqVolunteer}>
                          <Image source={{uri: sanitizeImageUri(req.volunteer.profilePhoto, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120')}} style={styles.reqVolPhoto} />
                          <Text style={styles.reqVolName}>{req.volunteer.name}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          );
        })()}

        <Text style={styles.sectionTitle}>Available Volunteers</Text>

        {volunteers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No volunteers assigned to you yet.</Text>
          </View>
        ) : (
          volunteers.map((v) => (
            <View key={v.id} style={styles.volunteerCard}>
              <View style={styles.volHeader}>
                <Image source={{ uri: sanitizeImageUri(v.photo) }} style={styles.volPhoto} />
                <View style={styles.volInfo}>
                  <Text style={styles.volName}>{v.name}</Text>
                  <View style={styles.volStatsRow}>
                    <View style={styles.ratingBadge}>
                      {Array.from({ length: Math.floor(parseFloat(v.rating)) }).map((_, i) => (
                        <FontAwesome key={`star-${i}`} name="star" size={12} color="#FBBF24" style={{marginRight: 2}} />
                      ))}
                      {parseFloat(v.rating) % 1 !== 0 && (
                        <FontAwesome name="star-half-o" size={12} color="#FBBF24" style={{marginRight: 2}} />
                      )}
                      <Text style={styles.ratingText}>{v.rating}</Text>
                    </View>
                    <View style={styles.distanceBadge}>
                      <Feather name="map-pin" size={10} color="#6B7280" />
                      <Text style={styles.distanceText}>{v.distance}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <Text style={styles.volBio}>{v.bio}</Text>
              
              <View style={styles.volHoursContainer}>
                <View style={styles.volHoursBadge}>
                  <Feather name="clock" size={12} color="#4B5563" />
                  <Text style={styles.volHoursText}>Hours: {v.hours}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.reqBtn} onPress={() => setSelectedVolunteer(v)}>
                  <Text style={styles.reqBtnText}>Request Visit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedBtn} onPress={() => Alert.alert('Feedback', 'Feedback feature coming soon.')}>
                  <Text style={styles.feedBtnText}>Feedback</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginBottom: 16,
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
  targetCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  targetLabel: {
    fontSize: 12,
    color: '#C2410C',
    fontWeight: '600',
    marginBottom: 8,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9A3412',
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

  // Network List Styles
  networkBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  heartIconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 28,
    color: '#000000',
    marginBottom: 16,
  },
  requestsContainer: {
    marginBottom: 24,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusAccepted: {
    backgroundColor: '#D1FAE5',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextAccepted: {
    color: '#059669',
  },
  statusTextRejected: {
    color: '#DC2626',
  },
  reqReason: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  reqVolunteer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reqVolPhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  reqVolName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  volHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  volPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  volInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  volName: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 27,
    color: '#000000',
    marginBottom: 4,
  },
  volStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#4A5565',
    marginLeft: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#4A5565',
    marginLeft: 4,
  },
  volBio: {
    fontSize: 14,
    fontWeight: '400',
    color: '#364153',
    lineHeight: 20,
    marginBottom: 16,
  },
  volHoursContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  volHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 14,
  },
  volHoursText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#4A5565',
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reqBtn: {
    flex: 1,
    backgroundColor: '#FE6700',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  reqBtnText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
  },
  feedBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.18,
    borderColor: '#D1D5DC',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  feedBtnText: {
    color: '#333333',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalSuccessIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalDoneBtn: {
    backgroundColor: '#FF6A00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

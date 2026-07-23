import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { sanitizeImageUri } from '@/utils/sanitizeImageUri';
import { SathiBottomNav } from '@/components/shared/SathiBottomNav';
import { useExitOnBack } from '@/hooks/useExitOnBack';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size: number) => Math.round((SCREEN_WIDTH / 390) * size);

const DEEP_ORANGE = '#FE6700';

export default function SathiDashboard() {
  useExitOnBack();
  const { push, replace } = useNavigationStack();
  useAndroidBackHandler();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    previousExperience: '',
    whyJoin: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Reschedule modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleRequestId, setRescheduleRequestId] = useState<string | null>(null);


  const handleOpenEdit = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      setFetchingProfile(true);
      setShowEditModal(true);

      const response = await fetch(`${API_URL}/sathi/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Could not fetch profile');
      const res = await response.json();
      const profile = res.data || res;

      setEditForm({
        name: profile.name || '',
        email: profile.email || '',
        age: profile.age ? String(profile.age) : '',
        gender: profile.gender || '',
        previousExperience: profile.previousExperience || '',
        whyJoin: profile.whyJoin || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not fetch profile details.');
      setShowEditModal(false);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      setSavingProfile(true);
      const response = await fetch(`${API_URL}/sathi/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email || null,
          age: editForm.age ? parseInt(editForm.age, 10) : null,
          gender: editForm.gender || null,
          previousExperience: editForm.previousExperience,
          whyJoin: editForm.whyJoin,
        }),
      });

      const res = await response.json();
      if (response.ok || res.success) {
        Alert.alert('Success', 'Profile updated successfully.');
        setShowEditModal(false);
        fetchDashboardData();
      } else {
        Alert.alert('Error', res.message || 'Failed to update profile.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the backend server.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with verification?\n\n📞 Call: +91 99999-55555\n✉️ Email: support@maihoonna.com',
      [{ text: 'OK' }]
    );
  };

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/sathi/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Dashboard data error');
      const data = await response.json();
      setDashboard(data.data || data);
    } catch (error) {
      console.log('Error fetching dashboard, loading offline mocks:', error);
      // Premium Offline Mock Mode
      setDashboard({
        status: 'verified', // 'pending' | 'verified' | 'under_review'
        applicationStatus: 'APPROVED',
        name: 'Meera',
        totalCreditHours: 12.5,
        totalCreditPoints: 125,
        monthlyGoalHours: 10,
        beneficiariesCount: 2,
        upcomingVisits: [
          {
            id: 'visit-1',
            name: 'Mrs. Sharma',
            location: 'Vasant Vihar, Delhi',
            distance: '0.8 km',
            dateString: 'Sun, Apr 19',
            visitCount: 8,
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
          },
          {
            id: 'visit-2',
            name: 'Mr. Kapoor',
            location: 'Defence Colony, Delhi',
            distance: '1.2 km',
            dateString: 'Tue, Apr 21',
            visitCount: 5,
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
          },
        ],
        visitRequests: [
          {
            id: 'req-1',
            name: 'Mrs. Sharma',
            location: 'Vasant Vihar, Delhi',
            distance: '0.8 km',
            totalVisits: 8,
            lastVisit: '4/14/2026',
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
          },
          {
            id: 'req-2',
            name: 'Mr. Kapoor',
            location: 'Defence Colony, Delhi',
            distance: '1.2 km',
            totalVisits: 5,
            lastVisit: '4/10/2026',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reapply action for rejected volunteers
  const handleReapply = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      setLoading(true);
      const response = await fetch(`${API_URL}/sathi/auth/reapply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok || data.success) {
        Alert.alert('Re-applied Successfully', 'Your profile is now under review again.');
        fetchDashboardData();
      } else {
        Alert.alert('Action Failed', data.message || 'Could not process re-application.');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the backend server.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      replace('/(auth)');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'ACCEPT') => {
    try {
      Alert.alert(
        'Accept Request',
        'Are you sure you want to accept this companion visit request?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: async () => {
              await submitResponse(requestId, action);
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to process request action.');
    }
  };

  const handleOpenReschedule = (requestId: string) => {
    setRescheduleRequestId(requestId);
    setShowRescheduleModal(true);
  };


  const submitResponse = async (requestId: string, action: 'ACCEPT' | 'REJECT', reason?: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      setLoading(true);
      const response = await fetch(`${API_URL}/sathi/visit-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: reason || null,
        }),
      });

      const data = await response.json();
      if (response.ok || data.success) {
        Alert.alert('Success', action === 'ACCEPT' ? 'Visit request accepted!' : 'Visit request rejected.');
        fetchDashboardData();
      } else {
        Alert.alert('Failed', data.message || 'Could not process request response.');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the backend server.');
      setLoading(false);
    }
  };

  const handleStartVisit = async (beneficiaryId: string, assignmentId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      setLoading(true);
      const response = await fetch(`${API_URL}/sathi/visits/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beneficiaryId,
          assignmentId,
        }),
      });

      const data = await response.json();
      if (response.ok || data.success) {
        Alert.alert('Success', 'Visit started successfully!');
        setLoading(false);
        replace('/(sathi)/hours');
      } else {
        Alert.alert('Failed', data.message || 'Could not start visit.');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the backend server.');
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={DEEP_ORANGE} />
        <Text style={styles.loaderText}>Loading Saathi Dashboard...</Text>
      </View>
    );
  }

  // ─── Verification Pending & Rejected Onboarding views ────────────────────────
  // ─── Verification Pending & Rejected Onboarding views ────────────────────────
  const appStatus = dashboard?.applicationStatus;

  // Only gate on status once dashboard is loaded — avoids showing pending screen on logout/initial load
  if (dashboard && appStatus && appStatus !== 'APPROVED') {
    const isRejected = appStatus === 'REJECTED';
    const isSuspended = appStatus === 'SUSPENDED';
    const isNotApplied = appStatus === 'NOT_APPLIED';

    // Calculate if re-apply cooldown is active
    let reapplyActive = false;
    let daysRemaining = 0;
    if (dashboard?.reapplyAllowedAfter) {
      const allowedDate = new Date(dashboard.reapplyAllowedAfter);
      const today = new Date();
      if (today < allowedDate) {
        reapplyActive = true;
        const diffTime = allowedDate.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pendingHeader}>
            <Text style={styles.brandTitle}>Saathi Network</Text>
          </View>

          {isRejected ? (
            <View style={styles.pendingCard}>
              <MaterialCommunityIcons name="account-cancel" size={scale(70)} color="#EF4444" />
              <Text style={[styles.pendingTitle, { color: '#EF4444' }]}>Verification Failed</Text>
              
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reason:</Text>
                  <Text style={[styles.infoValue, { color: '#EF4444' }]}>{dashboard?.rejectionReason || 'No specific reason provided.'}</Text>
                </View>
              </View>

              <Text style={styles.pendingDesc}>
                We are sorry, but your application for Saathi companion volunteer could not be approved.
              </Text>

              {reapplyActive ? (
                <View style={styles.cooldownContainer}>
                  <Text style={styles.cooldownText}>
                    You can re-apply on {new Date(dashboard.reapplyAllowedAfter).toLocaleDateString()} ({daysRemaining} days remaining).
                  </Text>
                  <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: '#D1D5DB' }]} disabled={true}>
                    <Text style={styles.refreshBtnText}>Re-application Locked</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: '#EF4444' }]} onPress={handleReapply}>
                  <Text style={styles.refreshBtnText}>Re-apply for Volunteer</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : isSuspended ? (
            <View style={styles.pendingCard}>
              <MaterialCommunityIcons name="account-off" size={scale(70)} color="#EF4444" />
              <Text style={[styles.pendingTitle, { color: '#EF4444' }]}>Account Suspended</Text>
              <Text style={styles.pendingDesc}>
                Your volunteer profile has been temporarily suspended. Please contact operations support to resolve this issue.
              </Text>
            </View>
          ) : isNotApplied ? (
            <View style={styles.pendingCard}>
              <MaterialCommunityIcons name="account-plus-outline" size={scale(70)} color="#FF7A00" />
              <Text style={styles.pendingTitle}>Welcome to Saathi Network!</Text>
              <Text style={styles.pendingDesc}>
                Earn credits on an hourly basis by volunteering as a companion for seniors.
              </Text>
              <Text style={styles.pendingDescSec}>
                Complete your companion application details to unlock senior match lists and schedule check-ins.
              </Text>

              <TouchableOpacity style={styles.refreshBtn} onPress={() => replace('/(sathi)/apply')}>
                <Text style={styles.refreshBtnText}>Start Saathi Application</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Verification Pending View
            <View style={styles.pendingCard}>
              <MaterialCommunityIcons name="account-clock" size={scale(70)} color="#FF7A00" />
              <Text style={styles.pendingTitle}>Verification Pending</Text>
              <Text style={styles.pendingDesc}>
                Your profile has been submitted successfully.
              </Text>

              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={[styles.infoValue, { color: '#FF7A00', fontWeight: '800' }]}>
                    {appStatus === 'UNDER_REVIEW' ? 'Under Review' : appStatus === 'SUBMITTED' ? 'Submitted' : 'Pending'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estimated Time:</Text>
                  <Text style={styles.infoValue}>24–48 hours</Text>
                </View>
              </View>

              <Text style={styles.pendingDescSec}>
                You will receive a notification once your profile is approved.
              </Text>

              <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboardData}>
                <Text style={styles.refreshBtnText}>Check Review Status</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons for Verification Pending screen */}
          <View style={styles.pendingActions}>
            {!isSuspended && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleOpenEdit}>
                <Ionicons name="create-outline" size={18} color="#111827" />
                <Text style={styles.actionBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionBtn} onPress={handleContactSupport}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111827" />
              <Text style={styles.actionBtnText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={[styles.logoutBtnText, { color: '#EF4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
          
          {/* Edit Profile Modal */}
          <Modal
            visible={showEditModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile Info</Text>
                  <TouchableOpacity onPress={() => setShowEditModal(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>

                {fetchingProfile ? (
                  <ActivityIndicator size="large" color="#FF7A00" style={{ padding: 40 }} />
                ) : (
                  <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Full Name</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editForm.name}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, name: t }))}
                        placeholder="Enter full name"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editForm.email}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, email: t }))}
                        placeholder="Enter email address"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Age</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editForm.age}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, age: t.replace(/\D/g, '') }))}
                        placeholder="Enter age"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Gender</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editForm.gender}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, gender: t }))}
                        placeholder="e.g. Male, Female, Other"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Past Volunteer Experience</Text>
                      <TextInput
                        style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                        value={editForm.previousExperience}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, previousExperience: t }))}
                        placeholder="Detail any previous volunteering experience..."
                        multiline={true}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Why do you want to join?</Text>
                      <TextInput
                        style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                        value={editForm.whyJoin}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, whyJoin: t }))}
                        placeholder="Tell us why you want to become a Saathi..."
                        multiline={true}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.saveBtn, savingProfile && { opacity: 0.7 }]}
                      onPress={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Dashboard view (Verified volunteer) ───────────────────────────────────
  const goalProgress = dashboard
    ? Math.min((dashboard.totalCreditHours / dashboard.monthlyGoalHours) * 100, 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back, {dashboard?.name || 'Saathi'}!</Text>
            <Text style={styles.locationText}>
              📍 {[dashboard?.city, dashboard?.state].filter(Boolean).join(', ') || 'Location pending'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationBell}>
            <Ionicons name="notifications-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="time" size={20} color="#2196F3" />
            </View>
            <View>
              <Text style={styles.statVal}>{dashboard?.totalCreditHours?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLbl}>Total Hours</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people" size={20} color="#4CAF50" />
            </View>
            <View>
              <Text style={styles.statVal}>{dashboard?.beneficiariesCount || 0}</Text>
              <Text style={styles.statLbl}>Beneficiaries</Text>
            </View>
          </View>
        </View>

        {/* Monthly Goal progress card */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Monthly Goal</Text>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>{goalProgress.toFixed(0)}%</Text>
            </View>
          </View>
          <Text style={styles.goalSubtitle}>
            {dashboard?.totalCreditHours?.toFixed(1) || '0.0'} / {dashboard?.monthlyGoalHours || 10} hours
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${goalProgress}%` }]} />
          </View>
        </View>

        {/* Upcoming Visits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Visits</Text>
        </View>

        {dashboard?.upcomingVisits && dashboard.upcomingVisits.length > 0 ? (
          dashboard.upcomingVisits.map((item: any) => {
            let formattedDate = '';
            let formattedTime = '';
            let countdownText = '';
            let isWithinOneHour = true;

            if (item.dateTime) {
              const d = new Date(item.dateTime);
              formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
              formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              const timeDiff = d.getTime() - currentTime.getTime();
              const oneHour = 60 * 60 * 1000;
              isWithinOneHour = timeDiff <= oneHour;
              
              if (!isWithinOneHour && timeDiff > 0) {
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
                const mins = Math.floor((timeDiff / 1000 / 60) % 60);
                
                let parts = [];
                if (days > 0) parts.push(`${days}d`);
                if (hours > 0) parts.push(`${hours}h`);
                if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
                countdownText = `Starts in ${parts.join(' ')}`;
              }
            }

            return (
              <View key={item.id} style={[styles.requestCard, { padding: scale(16), marginBottom: scale(16) }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Image source={{ uri: sanitizeImageUri(item.photo) }} style={{ width: scale(56), height: scale(56), borderRadius: scale(12), marginRight: scale(14) }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: scale(16), color: '#111827', fontFamily: 'Poppins-SemiBold', marginBottom: scale(4) }}>
                      {item.name}{item.age ? `, ${item.age}` : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={{ fontSize: scale(13), color: '#6B7280', fontFamily: 'Poppins-Regular', marginLeft: scale(4) }}>{item.location || 'Delhi'}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#2196F3', paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(12) }}>
                    <Text style={{ fontSize: scale(12), color: '#2196F3', fontFamily: 'Poppins-Medium' }}>{item.distance || '1.0 km'}</Text>
                  </View>
                </View>

                {/* Gap/Spacing */}
                <View style={{ height: scale(24) }} />

                {/* Bottom Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: scale(13), color: '#4B5563', fontFamily: 'Poppins-Medium' }}>{formattedDate}</Text>
                  <Text style={{ fontSize: scale(13), color: '#4B5563', fontFamily: 'Poppins-Medium' }}>{formattedTime}</Text>
                </View>

                {/* Start Visit Button OR Countdown */}
                {!isWithinOneHour && countdownText ? (
                  <View style={{ marginTop: scale(20), backgroundColor: '#F3F4F6', paddingVertical: scale(12), borderRadius: scale(20), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#6B7280', fontFamily: 'Poppins-SemiBold', fontSize: scale(14) }}>{countdownText}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{ marginTop: scale(20), backgroundColor: '#FF6F00', paddingVertical: scale(12), borderRadius: scale(20), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => {
                      if (!item.assignmentId) {
                        Alert.alert('Error', 'No assignment found for this beneficiary.');
                        return;
                      }
                      handleStartVisit(item.beneficiaryId, item.assignmentId);
                    }}
                  >
                    <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: scale(14) }}>Start Visit</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No upcoming companion visits scheduled.</Text>
        )}

        {/* Visit Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visit Requests</Text>
        </View>

        {dashboard?.visitRequests && dashboard.visitRequests.length > 0 ? (
          dashboard.visitRequests.map((item: any) => {
            let formattedDate = '';
            let formattedTime = '';
            if (item.dateTime) {
              const d = new Date(item.dateTime);
              formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
              formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }

            return (
              <View key={item.id} style={[styles.requestCard, { padding: scale(16), marginBottom: scale(16) }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: scale(16) }}>
                  <Image source={{ uri: sanitizeImageUri(item.photo) }} style={{ width: scale(65), height: scale(65), borderRadius: scale(12), marginRight: scale(16) }} />
                  <View style={{ flex: 1, paddingTop: scale(4) }}>
                    <Text style={{ fontSize: scale(18), color: '#000000', fontFamily: 'Poppins-SemiBold', marginBottom: scale(4) }}>
                      {item.name}{item.age ? `, ${item.age}` : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={{ fontSize: scale(14), color: '#6B7280', fontFamily: 'Poppins-Regular' }}>{item.location || 'Delhi'}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#2196F3', paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(12) }}>
                    <Text style={{ fontSize: scale(11), color: '#2196F3', fontFamily: 'Poppins-SemiBold' }}>{item.distance || '2.1 km'}</Text>
                  </View>
                </View>

                {item.bio && <Text style={{ fontSize: scale(14), color: '#374151', lineHeight: scale(20), marginBottom: scale(16), fontFamily: 'Poppins-Regular' }}>{item.bio}</Text>}

                {/* Hobbies / Interests Tags */}
                {item.hobbies && item.hobbies.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: scale(8), marginBottom: scale(16) }}>
                    {item.hobbies.map((tag: string) => (
                      <View key={tag} style={{ backgroundColor: '#F3E8FF', paddingHorizontal: scale(12), paddingVertical: scale(6), borderRadius: scale(16) }}>
                        <Text style={{ color: '#9333EA', fontSize: scale(12), fontFamily: 'Poppins-Medium' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Date & Time Row */}
                {(formattedDate || formattedTime) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(16), marginBottom: scale(20) }}>
                    {formattedDate ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                        <Ionicons name="calendar-outline" size={14} color="#4B5563" />
                        <Text style={{ fontSize: scale(13), color: '#4B5563', fontFamily: 'Poppins-Medium' }}>{formattedDate}</Text>
                      </View>
                    ) : null}
                    {formattedTime ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                        <Ionicons name="time-outline" size={14} color="#4B5563" />
                        <Text style={{ fontSize: scale(13), color: '#4B5563', fontFamily: 'Poppins-Medium' }}>{formattedTime}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: scale(12) }}>
                  <TouchableOpacity 
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF6F00', paddingVertical: scale(12), borderRadius: scale(20) }}
                    onPress={() => handleRespondRequest(item.id, 'ACCEPT')}
                  >
                    <Ionicons name="heart-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: scale(14) }}>Accept</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF4ED', borderWidth: 1, borderColor: '#FF6F00', paddingVertical: scale(12), borderRadius: scale(20) }}
                    onPress={() => handleOpenReschedule(item.id)}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#FF6F00" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FF6F00', fontFamily: 'Poppins-SemiBold', fontSize: scale(14) }}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No pending visit requests.</Text>
        )}

        {/* Log Hours floating/bottom button */}
        <TouchableOpacity style={styles.logHoursBtn} onPress={() => replace('/(sathi)/hours')}>
          <Ionicons name="time-outline" size={20} color="#FF6F00" style={{ marginRight: 6 }} />
          <Text style={styles.logHoursBtnText}>Log Hours</Text>
        </TouchableOpacity>
      </ScrollView>

      <SathiBottomNav />

      {/* Reschedule Proposal Modal */}
      {showRescheduleModal && rescheduleRequestId && (
        <RescheduleModal
          visible={showRescheduleModal}
          requestId={rescheduleRequestId}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={() => {
            setShowRescheduleModal(false);
            fetchDashboardData();
          }}
        />
      )}
    </SafeAreaView>
  );
}

// Extracted separate component to avoid losing keyboard focus on re-renders
const RescheduleModal = ({ visible, requestId, onClose, onSuccess }: { visible: boolean, requestId: string, onClose: () => void, onSuccess: () => void }) => {
  const [proposedDate, setProposedDate] = useState(new Date(new Date().setHours(10, 0, 0, 0)));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const handleSubmitReschedule = async () => {
    if (!requestId) return;

    const proposedISO = proposedDate.toISOString();

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      setSubmittingReschedule(true);
      const response = await fetch(`${API_URL}/sathi/visit-requests/${requestId}/propose-reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposedDateTime: proposedISO, message: rescheduleMessage }),
      });

      const data = await response.json();
      if (response.ok || data.success) {
        Alert.alert('Sent!', 'Your reschedule proposal has been sent to the beneficiary.');
        onSuccess();
      } else {
        Alert.alert('Failed', data.message || 'Could not send reschedule proposal.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the backend server.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: scale(24), paddingBottom: scale(40) }}>
          <Text style={{ fontSize: scale(18), fontFamily: 'Poppins-Bold', color: '#111827', marginBottom: scale(4) }}>Propose New Schedule</Text>
          <Text style={{ fontSize: scale(13), fontFamily: 'Poppins-Regular', color: '#6B7280', marginBottom: scale(24) }}>Suggest a new date and time. The beneficiary will review your proposal.</Text>

          <Text style={{ fontSize: scale(13), fontFamily: 'Poppins-SemiBold', color: '#374151', marginBottom: scale(8) }}>Proposed Date</Text>
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: scale(12), paddingHorizontal: scale(16), paddingVertical: scale(12), marginBottom: scale(16), backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ fontSize: scale(14), fontFamily: 'Poppins-Regular', color: '#111827' }}>
              {proposedDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <Text style={{ fontSize: scale(13), fontFamily: 'Poppins-SemiBold', color: '#374151', marginBottom: scale(8) }}>Proposed Time</Text>
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: scale(12), paddingHorizontal: scale(16), paddingVertical: scale(12), marginBottom: scale(16), backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={{ fontSize: scale(14), fontFamily: 'Poppins-Regular', color: '#111827' }}>
              {proposedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Ionicons name="time-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <Text style={{ fontSize: scale(13), fontFamily: 'Poppins-SemiBold', color: '#374151', marginBottom: scale(8) }}>Message (Optional)</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: scale(12), paddingHorizontal: scale(16), paddingVertical: scale(12), fontSize: scale(14), fontFamily: 'Poppins-Regular', color: '#111827', marginBottom: scale(28), backgroundColor: '#F9FAFB', height: scale(80), textAlignVertical: 'top' }}
            placeholder="e.g. I have an exam in the morning, can we do afternoon?"
            placeholderTextColor="#9CA3AF"
            value={rescheduleMessage}
            onChangeText={setRescheduleMessage}
            multiline
          />

          {(showDatePicker || showTimePicker) && (
            <DateTimePicker
              value={proposedDate}
              mode={showDatePicker ? 'date' : 'time'}
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }
                if (selectedDate) {
                  setProposedDate(selectedDate);
                }
              }}
            />
          )}

          <View style={{ flexDirection: 'row', gap: scale(12) }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: scale(14), borderRadius: scale(20), borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}
              onPress={onClose}
            >
              <Text style={{ color: '#6B7280', fontFamily: 'Poppins-SemiBold', fontSize: scale(14) }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: scale(14), borderRadius: scale(20), backgroundColor: '#FF6F00', alignItems: 'center', opacity: submittingReschedule ? 0.7 : 1 }}
              onPress={handleSubmitReschedule}
              disabled={submittingReschedule}
            >
              {submittingReschedule
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: scale(14) }}>Send Proposal</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3EB',
  },
  scrollContent: {
    paddingHorizontal: scale(18),
    paddingTop: scale(16),
    paddingBottom: scale(100),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loaderText: {
    marginTop: scale(12),
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  welcomeText: {
    fontSize: scale(20),
    fontWeight: '700',
    color: '#111827',
  },
  locationText: {
    fontSize: scale(13),
    color: '#4B5563',
    marginTop: scale(2),
  },
  notificationBell: {
    padding: scale(8),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: scale(20),
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: scale(16),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: scale(12),
  },
  statIconContainer: {
    padding: scale(8),
    borderRadius: scale(12),
  },
  statVal: {
    fontSize: scale(20),
    fontWeight: '700',
    color: '#111827',
  },
  statLbl: {
    fontSize: scale(11),
    color: '#6B7280',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    padding: scale(18),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: scale(24),
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  goalTitle: {
    fontSize: scale(15),
    fontWeight: '700',
    color: '#111827',
  },
  goalBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(12),
  },
  goalBadgeText: {
    fontSize: scale(11),
    color: '#1976D2',
    fontWeight: '600',
  },
  goalSubtitle: {
    fontSize: scale(13),
    color: '#4B5563',
    marginBottom: scale(12),
  },
  progressTrack: {
    height: scale(8),
    backgroundColor: '#F3F4F6',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6F00',
    borderRadius: scale(4),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
    marginTop: scale(8),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#111827',
  },
  viewAllLink: {
    fontSize: scale(13),
    color: '#FF6F00',
    fontWeight: '600',
  },
  visitCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: scale(14),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: scale(12),
    gap: scale(12),
  },
  seniorPhoto: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#F3F4F6',
  },
  visitInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  rowJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seniorName: {
    fontSize: scale(15),
    fontWeight: '600',
    color: '#111827',
  },
  distanceBadge: {
    backgroundColor: '#FFF5ED',
    borderWidth: 1,
    borderColor: '#FE6700',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(12),
  },
  distanceText: {
    fontSize: scale(10),
    color: '#FE6700',
    fontWeight: '600',
  },
  distanceBadgeBlue: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(12),
  },
  distanceTextBlue: {
    fontSize: scale(10),
    color: '#2196F3',
    fontWeight: '600',
  },
  locationTextSmall: {
    fontSize: scale(12),
    color: '#6B7280',
    marginVertical: scale(4),
  },
  visitDate: {
    fontSize: scale(12),
    fontWeight: '500',
    color: '#374151',
  },
  visitsCount: {
    fontSize: scale(12),
    color: '#4B5563',
  },
  lastVisitText: {
    fontSize: scale(11),
    color: '#6B7280',
  },
  emptyText: {
    fontSize: scale(13),
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: scale(12),
  },
  logHoursBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5ED',
    borderWidth: 1.5,
    borderColor: '#FF6F00',
    paddingVertical: scale(12),
    borderRadius: scale(24),
    marginTop: scale(16),
  },
  logHoursBtnText: {
    color: '#FF6F00',
    fontWeight: '600',
    fontSize: scale(14),
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#FFE3D1',
    padding: scale(16),
    marginBottom: scale(16),
    shadowColor: '#FE6700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  seniorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  seniorMeta: {
    flex: 1,
  },
  requestTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5ED',
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(12),
  },
  requestTimeText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#FF6F00',
  },
  reasonContainer: {
    backgroundColor: '#F9FAFB',
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reasonLabel: {
    fontSize: scale(11),
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: scale(4),
  },
  reasonText: {
    fontSize: scale(13),
    color: '#374151',
    lineHeight: scale(18),
  },
  requestActionsRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  requestAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6F00',
    paddingVertical: scale(10),
    borderRadius: scale(10),
  },
  requestAcceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scale(13),
  },
  requestRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: scale(10),
    borderRadius: scale(10),
  },
  requestRejectText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: scale(13),
  },
  /* Pending Onboarding view styling */
  pendingHeader: {
    alignItems: 'center',
    marginVertical: scale(24),
  },
  brandTitle: {
    fontSize: scale(22),
    fontWeight: '700',
    color: '#FF6F00',
  },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    padding: scale(24),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    textAlign: 'center',
  },
  pendingTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#111827',
    marginTop: scale(16),
    marginBottom: scale(8),
  },
  pendingDesc: {
    fontSize: scale(14),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(12),
  },
  pendingDescSec: {
    fontSize: scale(12),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: scale(18),
    marginBottom: scale(24),
  },
  refreshBtn: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(24),
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: scale(14),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(20),
    marginTop: scale(24),
    alignSelf: 'center',
  },
  logoutBtnText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: scale(13),
  },
  cooldownContainer: {
    alignItems: 'center',
    marginVertical: scale(8),
  },
  cooldownText: {
    fontSize: scale(12),
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: scale(12),
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    padding: scale(16),
    marginVertical: scale(12),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(4),
  },
  infoLabel: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#111827',
  },
  pendingActions: {
    width: '100%',
    marginTop: scale(24),
    gap: scale(12),
    paddingHorizontal: scale(16),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: scale(12),
    borderRadius: scale(24),
    gap: scale(8),
  },
  actionBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: scale(13),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(20),
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: scale(12),
    marginBottom: scale(16),
  },
  modalTitle: {
    fontSize: scale(17),
    fontWeight: '800',
    color: '#111827',
  },
  modalScroll: {
    marginBottom: scale(20),
  },
  inputGroup: {
    marginBottom: scale(16),
  },
  inputLabel: {
    fontSize: scale(11),
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: scale(6),
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    fontSize: scale(14),
    color: '#111827',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#FF6F00',
    paddingVertical: scale(14),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(8),
    marginBottom: scale(24),
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scale(14),
  },
});

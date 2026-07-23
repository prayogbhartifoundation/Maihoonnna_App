import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { SathiBottomNav } from '@/components/shared/SathiBottomNav';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size: number) => Math.round((SCREEN_WIDTH / 390) * size);

const DEEP_ORANGE = '#FE6700';

export default function SathiProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/sathi/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Profile fetch error');
      const data = await response.json();
      setProfile(data.data || data);
    } catch (error) {
      console.log('Error fetching profile:', error);
      Alert.alert('Error', 'Could not load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleUploadPhoto(result.assets[0].uri);
    }
  };

  const handleUploadPhoto = async (uri: string) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);
      formData.append('targetType', 'self');

      const response = await fetch(`${API_URL}/profile-photo/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setProfile((prev: any) => ({ ...prev, profilePhoto: data.url }));
        Alert.alert('Success', 'Profile photo updated!');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload Error:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={DEEP_ORANGE} />
          <Text style={styles.loaderText}>Loading Profile...</Text>
        </View>
        <SathiBottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            {profile?.profilePhoto ? (
              <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={60} color="#D1D5DB" />
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.editBadge} 
              onPress={handlePickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile?.name}</Text>
          <Text style={styles.profileStatus}>
            {profile?.applicationStatus === 'APPROVED' ? 'Verified Sathi' : 'Registration Pending'}
          </Text>
        </View>

        {/* Details Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{profile?.age || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{profile?.gender || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{profile?.phone}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.divider} />
          
          <Text style={styles.addressText}>
            {[
              profile?.flatPlot,
              profile?.streetArea,
              profile?.landmark,
              profile?.city,
              profile?.state,
              profile?.pincode,
            ].filter(Boolean).join(', ') || 'No address provided'}
          </Text>
        </View>

        {profile?.interests?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.divider} />
            <View style={styles.chipContainer}>
              {profile.interests.map((interest: string, index: number) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile?.whyJoin && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Why I Joined</Text>
            <View style={styles.divider} />
            <Text style={styles.bioText}>{profile.whyJoin}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: scale(12),
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
  },
  header: {
    paddingHorizontal: scale(18),
    paddingVertical: scale(16),
    backgroundColor: '#FAF3EB',
  },
  title: {
    fontSize: scale(22),
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: scale(18),
    paddingBottom: scale(120),
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: scale(24),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: scale(12),
  },
  avatarImage: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: DEEP_ORANGE,
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: scale(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: scale(4),
  },
  profileStatus: {
    fontSize: scale(14),
    color: DEEP_ORANGE,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: scale(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: scale(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(6),
  },
  infoLabel: {
    fontSize: scale(14),
    color: '#6B7280',
  },
  infoValue: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#111827',
  },
  addressText: {
    fontSize: scale(14),
    color: '#374151',
    lineHeight: scale(20),
  },
  bioText: {
    fontSize: scale(14),
    color: '#374151',
    lineHeight: scale(22),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  chip: {
    backgroundColor: '#FFF5ED',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  chipText: {
    fontSize: scale(13),
    color: DEEP_ORANGE,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: scale(8),
    gap: scale(8),
  },
  logoutText: {
    fontSize: scale(15),
    fontWeight: '700',
    color: '#EF4444',
  },
});

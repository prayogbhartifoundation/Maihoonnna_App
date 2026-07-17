import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SathiBottomNav } from '@/components/shared/SathiBottomNav';
import { useExitOnBack } from '@/hooks/useExitOnBack';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACTIVITIES = [
  { title: 'Tea & Conversation', duration: '1-2 hours', difficulty: 'Easy' },
  { title: 'Board Games or Cards', duration: '1-2 hours', difficulty: 'Easy' },
  { title: 'Short Walks', duration: '30-60 mins', difficulty: 'Moderate' },
  { title: 'Reading Together', duration: '30-60 mins', difficulty: 'Easy' },
  { title: 'Photo Album Viewing', duration: '1 hour', difficulty: 'Easy' },
  { title: 'Light Gardening', duration: '1-2 hours', difficulty: 'Moderate' },
  { title: 'Technology Help', duration: '30-60 mins', difficulty: 'Moderate' },
  { title: 'Grocery Shopping', duration: '1-2 hours', difficulty: 'Moderate' },
];

const FAQS = [
  {
    q: 'What if the beneficiary seems unwell during my visit?',
    a: 'If they are in immediate medical distress, call Emergency Services (112) first, then contact the Program Coordinator (+91 98765 43210). If they seem mildly unwell, ask them if they would like to call their primary care contact or primary CC companion.',
  },
  {
    q: 'How do I handle difficult conversations or emotions?',
    a: 'Listen actively and with empathy. Avoid arguing or correcting. If they become highly distressed or show signs of confusion, politely change the subject to a positive memory or activity.',
  },
  {
    q: 'What if I need to cancel a scheduled visit?',
    a: 'Please notify the beneficiary and the program coordinator at least 24 hours in advance if possible. You can request a reschedule through the Match tab.',
  },
  {
    q: 'Can I bring someone else along to visits?',
    a: 'No, due to security, privacy policies, and background check protocols, you are not allowed to bring friends or family members to companion visits.',
  },
  {
    q: 'How do I build rapport with someone I just met?',
    a: 'Start by introducing yourself clearly, ask about their hobbies, their past experiences, or look at photo albums together. Respect their personal space and let them set the pace.',
  },
];

export default function SathiGuide() {
  useExitOnBack();
  useAndroidBackHandler();
  const { width } = useWindowDimensions();

  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedFaqIndex === index) {
      setExpandedFaqIndex(null);
    } else {
      setExpandedFaqIndex(index);
    }
  };

  const scale = (size: number) => Math.round((width / 390) * size);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Suggested Activities */}
        <Text style={styles.sectionTitle}>Suggested Activities</Text>
        <View style={styles.activitiesCard}>
          {ACTIVITIES.map((activity, idx) => (
            <View
              key={activity.title}
              style={[
                styles.activityRow,
                idx === ACTIVITIES.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <View style={styles.durationRow}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.activityDuration}>{activity.duration}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.difficultyBadge,
                  activity.difficulty === 'Easy'
                    ? styles.difficultyEasy
                    : styles.difficultyModerate,
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    activity.difficulty === 'Easy'
                      ? { color: '#4CAF50' }
                      : { color: '#FF9800' },
                  ]}
                >
                  {activity.difficulty}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqsContainer}>
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <TouchableOpacity
                key={faq.q}
                style={styles.faqItem}
                onPress={() => toggleFaq(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#6B7280"
                  />
                </View>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Emergency Support Card */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.emergencyTitle}>Emergency Support</Text>
          </View>

          <View style={styles.supportContact}>
            <Text style={styles.contactLabel}>Program Coordinator:</Text>
            <Text style={styles.contactValue}>+91 98765 43210</Text>
          </View>

          <View style={styles.supportContact}>
            <Text style={styles.contactLabel}>Emergency Services:</Text>
            <Text style={styles.contactValue}>112</Text>
          </View>

          <Text style={styles.emergencyDesc}>
            Contact the program coordinator if you have questions, concerns, or need support with any
            aspect of your role as a Saathi.
          </Text>
        </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  activitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyEasy: {
    backgroundColor: '#E8F5E9',
  },
  difficultyModerate: {
    backgroundColor: '#FFF3E0',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  faqsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  faqAnswerContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  faqAnswer: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  emergencyCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    padding: 18,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  supportContact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  emergencyDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    paddingTop: 12,
  },
});

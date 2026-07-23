import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Platform, Dimensions, TextInput, Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Types ────────────────────────────────────────────────────────────────────

interface VitalReading {
    code: string;
    name: string;
    dataType: string;
    value: string;
    unit: string;
    isAbnormal: boolean;
}

interface Interaction {
    id: string;
    title: string;
    rating: number | null;
    beneficiaryRating: number | null;
    date: string;
    time: string;
    companionName: string;
    vitals: VitalReading[];   // dynamic — all readings captured during this visit
    notes: string;
    feedback: string;
}

interface EmergencyNote {
    timestamp: string;
    note: string;
    author?: string;
}

interface NotifiedParty {
    role: string;
    name: string;
}

interface EmergencyLog {
    id: string;
    ticketNumber: string;
    status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';
    description?: string;
    locationAddress?: string;
    triggeredAt: string;
    resolvedAt?: string;
    resolutionNotes?: string;
    notes: EmergencyNote[];
    notifiedParties: NotifiedParty[];
    respondedBy?: { name: string; role: string } | null;
}

// ── Vital icon/colour palette ─────────────────────────────────────────────────
const VITAL_PALETTE = [
    { bg: '#FEF2F2', icon: '#EF4444' },
    { bg: '#FDF2F8', icon: '#EC4899' },
    { bg: '#FFF7ED', icon: '#F97316' },
    { bg: '#EFF6FF', icon: '#3B82F6' },
    { bg: '#F0FDF4', icon: '#22C55E' },
    { bg: '#FAF5FF', icon: '#A855F7' },
];

// ── StarRating component ─────────────────────────────────────────────────────

const StarRating = ({
    rating,
    onRate,
    size = 24,
    readonly = false,
}: {
    rating: number | null;
    onRate?: (r: number) => void;
    size?: number;
    readonly?: boolean;
}) => {
    const [hovered, setHovered] = useState(0);
    const display = hovered || rating || 0;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                    key={s}
                    onPress={() => !readonly && onRate?.(s)}
                    onPressIn={() => !readonly && setHovered(s)}
                    onPressOut={() => !readonly && setHovered(0)}
                    activeOpacity={readonly ? 1 : 0.7}
                    disabled={readonly}
                    hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
                >
                    <Ionicons
                        name={s <= display ? 'star' : 'star-outline'}
                        size={size}
                        color={s <= display ? '#FBBF24' : '#D1D5DB'}
                        style={{ marginRight: 2 }}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

// ── Main screen ───────────────────────────────────────────────────────────────

export default function InteractionsScreen() {
    const safeBack = useSafeBack();
    const { visitId: paramVisitId } = useLocalSearchParams();

    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [submittingRatingId, setSubmittingRatingId] = useState<string | null>(null);

    // Emergency logs
    const [emergencyLogs, setEmergencyLogs] = useState<EmergencyLog[]>([]);
    const [expandedSosIds, setExpandedSosIds] = useState<Record<string, boolean>>({});

    // Per-visit feedback drafts and saving state
    const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
    const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchInteractions();
            fetchEmergencyHistory();
        }, [])
    );

    const fetchInteractions = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const res = await fetch(`${API_URL}/beneficiary/interactions/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success && data.data?.length > 0) {
                setInteractions(data.data);
                // Seed feedback drafts from server values
                const drafts: Record<string, string> = {};
                data.data.forEach((item: Interaction) => { drafts[item.id] = item.feedback || ''; });
                setFeedbackDrafts(drafts);

                // Auto-expand the target visit (or first one)
                if (paramVisitId) {
                    setExpandedIds({ [paramVisitId as string]: true });
                } else if (data.data[0]?.id) {
                    setExpandedIds({ [data.data[0].id]: true });
                }
            }
        } catch (e) {
            console.error('Fetch Interactions Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmergencyHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const user = await AsyncStorage.getItem('user');
            if (!token || !user) return;
            const { id: userId } = JSON.parse(user);

            const res = await fetch(`${API_URL}/beneficiary/${userId}/emergency/history`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setEmergencyLogs(data.data);
            }
        } catch (e) {
            console.error('Fetch Emergency History Error:', e);
        }
    };

    const toggleExpand = (id: string) =>
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));

    // ── Rating ────────────────────────────────────────────────────────────────
    const handleRate = async (interactionId: string, rating: number) => {
        setInteractions(prev =>
            prev.map(i => i.id === interactionId ? { ...i, beneficiaryRating: rating } : i)
        );
        try {
            setSubmittingRatingId(interactionId);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const res = await fetch(`${API_URL}/beneficiary/interactions/${interactionId}/rate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating }),
            });
            const data = await res.json();
            if (!data.success) {
                setInteractions(prev =>
                    prev.map(i => i.id === interactionId ? { ...i, beneficiaryRating: null } : i)
                );
            }
        } catch (e) {
            console.error('Rating error:', e);
        } finally {
            setSubmittingRatingId(null);
        }
    };

    // ── Feedback ──────────────────────────────────────────────────────────────
    const handleSaveFeedback = async (interactionId: string) => {
        const text = feedbackDrafts[interactionId] ?? '';
        try {
            setSavingFeedbackId(interactionId);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const res = await fetch(`${API_URL}/beneficiary/interactions/${interactionId}/feedback`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback: text }),
            });
            const data = await res.json();
            if (data.success) {
                setInteractions(prev =>
                    prev.map(i => i.id === interactionId ? { ...i, feedback: text } : i)
                );
                Alert.alert('Saved', 'Your feedback has been saved.');
            }
        } catch (e) {
            console.error('Feedback save error:', e);
        } finally {
            setSavingFeedbackId(null);
        }
    };

    // Helper for emergency status badge
    const sosBadge = (status: EmergencyLog['status']) => {
        const map: Record<string, { label: string; bg: string; color: string }> = {
            open:        { label: 'SOS OPEN',       bg: '#FEE2E2', color: '#DC2626' },
            acknowledged:{ label: 'ACKNOWLEDGED',   bg: '#FEF3C7', color: '#D97706' },
            in_progress: { label: 'IN PROGRESS',    bg: '#FEF9C3', color: '#CA8A04' },
            resolved:    { label: 'RESOLVED',       bg: '#D1FAE5', color: '#059669' },
            cancelled:   { label: 'CANCELLED',      bg: '#F3F4F6', color: '#6B7280' },
        };
        return map[status] || map.open;
    };

    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
             + '  •  '
             + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Interactions</Text>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#FE6700" />
                    <Text style={styles.loadingText}>Retrieving interaction history…</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Emergency SOS History Section ── */}
                    {emergencyLogs.length > 0 && (
                        <View style={styles.sosSectionWrap}>
                            <View style={styles.sosSectionHeader}>
                                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                                <Text style={styles.sosSectionTitle}>Emergency SOS History</Text>
                            </View>

                            {emergencyLogs.map((sos) => {
                                const badge = sosBadge(sos.status);
                                const isOpen = expandedSosIds[sos.id];
                                const notes: EmergencyNote[] = Array.isArray(sos.notes) ? sos.notes : [];

                                return (
                                    <View key={sos.id} style={styles.sosCard}>
                                        {/* Top row: ticket + status badge */}
                                        <View style={styles.sosCardHeader}>
                                            <View style={styles.sosTicketRow}>
                                                <Ionicons name="radio" size={14} color="#DC2626" />
                                                <Text style={styles.sosTicket}>{sos.ticketNumber}</Text>
                                            </View>
                                            <View style={[styles.sosBadge, { backgroundColor: badge.bg }]}>
                                                <Text style={[styles.sosBadgeText, { color: badge.color }]}>{badge.label}</Text>
                                            </View>
                                        </View>

                                        {/* Triggered time */}
                                        <View style={styles.sosDetailRow}>
                                            <Feather name="clock" size={13} color="#6B7280" />
                                            <Text style={styles.sosDetailText}>
                                                Triggered: {formatDateTime(sos.triggeredAt)}
                                            </Text>
                                        </View>

                                        {/* Resolved time */}
                                        {sos.resolvedAt && (
                                            <View style={styles.sosDetailRow}>
                                                <Feather name="check-circle" size={13} color="#059669" />
                                                <Text style={[styles.sosDetailText, { color: '#059669' }]}>
                                                    Resolved: {formatDateTime(sos.resolvedAt)}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Location */}
                                        {sos.locationAddress && (
                                            <View style={styles.sosDetailRow}>
                                                <Feather name="map-pin" size={13} color="#6B7280" />
                                                <Text style={styles.sosDetailText} numberOfLines={2}>
                                                    {sos.locationAddress}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Toggle for full details */}
                                        <TouchableOpacity
                                            style={styles.sosToggleBtn}
                                            onPress={() => setExpandedSosIds(prev => ({ ...prev, [sos.id]: !prev[sos.id] }))}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.sosToggleText}>
                                                {isOpen ? 'Hide Details' : 'View Full Details'}
                                            </Text>
                                            <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#DC2626" />
                                        </TouchableOpacity>

                                        {isOpen && (
                                            <View style={styles.sosExpandedSection}>
                                                <View style={styles.divider} />

                                                {/* Who was notified */}
                                                {sos.notifiedParties.length > 0 && (
                                                    <View style={styles.sosBlock}>
                                                        <Text style={styles.sosBlockTitle}>
                                                            <Ionicons name="notifications" size={13} color="#4B5563" /> Who Was Notified
                                                        </Text>
                                                        {sos.notifiedParties.map((p, i) => (
                                                            <View key={i} style={styles.notifiedRow}>
                                                                <View style={styles.notifiedDot} />
                                                                <Text style={styles.notifiedRole}>{p.role}:</Text>
                                                                <Text style={styles.notifiedName}>{p.name}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}

                                                {/* Who responded */}
                                                {sos.respondedBy && (
                                                    <View style={styles.sosBlock}>
                                                        <Text style={styles.sosBlockTitle}>
                                                            <Ionicons name="person" size={13} color="#4B5563" /> Responded By
                                                        </Text>
                                                        <View style={styles.respondedBox}>
                                                            <Ionicons name="shield-checkmark" size={16} color="#059669" />
                                                            <Text style={styles.respondedName}>{sos.respondedBy.name}</Text>
                                                            <Text style={styles.respondedRole}>({sos.respondedBy.role?.replace('_', ' ')})</Text>
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Dispatch Notes Timeline */}
                                                {notes.length > 0 && (
                                                    <View style={styles.sosBlock}>
                                                        <Text style={styles.sosBlockTitle}>
                                                            <Ionicons name="list" size={13} color="#4B5563" /> Dispatch Timeline
                                                        </Text>
                                                        {notes.map((n, i) => (
                                                            <View key={i} style={styles.timelineItem}>
                                                                <View style={styles.timelineDot} />
                                                                {i < notes.length - 1 && <View style={styles.timelineLine} />}
                                                                <View style={styles.timelineContent}>
                                                                    <Text style={styles.timelineTime}>
                                                                        {formatDateTime(n.timestamp)}
                                                                        {n.author ? `  •  ${n.author}` : ''}
                                                                    </Text>
                                                                    <Text style={styles.timelineNote}>{n.note}</Text>
                                                                </View>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}

                                                {/* Resolution remarks */}
                                                {sos.resolutionNotes && (
                                                    <View style={[styles.sosBlock, styles.resolutionBox]}>
                                                        <Text style={styles.resolutionLabel}>Resolution Remarks</Text>
                                                        <Text style={styles.resolutionText}>{sos.resolutionNotes}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* ── Care Interactions Section ── */}
                    <Text style={styles.subtitle}>Your care history</Text>

                    {interactions.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <MaterialCommunityIcons name="heart-broken" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No care interactions recorded yet.</Text>
                        </View>
                    ) : (
                        interactions.map((v) => {
                            const isExpanded = !!expandedIds[v.id];
                            const hasRated = v.beneficiaryRating !== null && v.beneficiaryRating !== undefined;
                            const isSubmittingRating = submittingRatingId === v.id;
                            const isSavingFeedback = savingFeedbackId === v.id;
                            const draft = feedbackDrafts[v.id] ?? '';
                            const feedbackChanged = draft !== (v.feedback ?? '');

                            return (
                                <View key={v.id} style={styles.card}>

                                    {/* ── Card Header: title + interactive star rating ── */}
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{v.title}</Text>
                                        <View style={styles.headerRight}>
                                            <StarRating
                                                rating={v.beneficiaryRating}
                                                onRate={(r) => handleRate(v.id, r)}
                                                size={22}
                                                readonly={false}
                                            />
                                            {isSubmittingRating && (
                                                <ActivityIndicator size="small" color="#FBBF24" style={{ marginLeft: 6 }} />
                                            )}
                                        </View>
                                    </View>

                                    {/* ── Rate prompt if not yet rated ── */}
                                    {!hasRated && (
                                        <Text style={styles.tapToRate}>
                                            ★ Tap the stars above to rate {v.companionName}
                                        </Text>
                                    )}

                                    {/* ── Quick details ── */}
                                    <View style={styles.detailsGrid}>
                                        {v.date ? (
                                            <View style={styles.detailRow}>
                                                <Feather name="calendar" size={15} color="#6B7280" style={styles.detailIcon} />
                                                <Text style={styles.detailText}>{v.date}</Text>
                                            </View>
                                        ) : null}
                                        {v.time ? (
                                            <View style={styles.detailRow}>
                                                <Feather name="clock" size={15} color="#6B7280" style={styles.detailIcon} />
                                                <Text style={styles.detailText}>{v.time}</Text>
                                            </View>
                                        ) : null}
                                        <View style={styles.detailRow}>
                                            <Feather name="user" size={15} color="#6B7280" style={styles.detailIcon} />
                                            <Text style={styles.detailText}>{v.companionName}</Text>
                                        </View>
                                    </View>

                                    {/* ── Toggle button ── */}
                                    <TouchableOpacity
                                        onPress={() => toggleExpand(v.id)}
                                        style={styles.toggleBtn}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.toggleBtnText}>
                                            {isExpanded ? 'Hide Details' : 'View Details'}
                                        </Text>
                                        <Feather
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                            size={16} color="#111827" style={{ marginLeft: 6 }}
                                        />
                                    </TouchableOpacity>

                                    {/* ── Expanded detail section ── */}
                                    {isExpanded && (
                                        <View style={styles.expandedSection}>
                                            <View style={styles.divider} />

                                            {/* ── Dynamic Vitals ── */}
                                            <Text style={styles.sectionHeading}>Vitals Recorded</Text>
                                            {v.vitals.length === 0 ? (
                                                <View style={styles.noVitalsBox}>
                                                    <MaterialCommunityIcons name="heart-off-outline" size={20} color="#9CA3AF" />
                                                    <Text style={styles.noVitalsText}>No vitals recorded for this visit.</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.vitalsGrid}>
                                                    {v.vitals.map((vital, idx) => {
                                                        const palette = VITAL_PALETTE[idx % VITAL_PALETTE.length];
                                                        return (
                                                            <View
                                                                key={`${vital.code}-${idx}`}
                                                                style={[styles.vitalCard, { backgroundColor: palette.bg }]}
                                                            >
                                                                <View style={styles.vitalHeader}>
                                                                    <MaterialCommunityIcons
                                                                        name="heart-pulse"
                                                                        size={16}
                                                                        color={palette.icon}
                                                                    />
                                                                    <Text style={styles.vitalLabel} numberOfLines={1}>
                                                                        {vital.name}
                                                                    </Text>
                                                                    {vital.isAbnormal && (
                                                                        <View style={styles.abnormalBadge}>
                                                                            <Text style={styles.abnormalText}>!</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                                <Text style={[
                                                                    styles.vitalValue,
                                                                    vital.isAbnormal && { color: '#EF4444' }
                                                                ]}>
                                                                    {vital.value}
                                                                </Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}

                                            {/* ── Clinical Notes ── */}
                                            <Text style={styles.sectionHeading}>Clinical Notes</Text>
                                            <View style={styles.notesBox}>
                                                <Text style={styles.notesText}>
                                                    {v.notes || 'No clinical notes recorded.'}
                                                </Text>
                                            </View>

                                            {/* ── Feedback (active TextInput) ── */}
                                            <Text style={styles.sectionHeading}>Your Feedback</Text>
                                            <View style={styles.feedbackInputWrap}>
                                                <TextInput
                                                    style={styles.feedbackInput}
                                                    value={draft}
                                                    onChangeText={(txt) =>
                                                        setFeedbackDrafts(prev => ({ ...prev, [v.id]: txt }))
                                                    }
                                                    placeholder={`Share your experience with ${v.companionName}…`}
                                                    placeholderTextColor="#9CA3AF"
                                                    multiline
                                                    textAlignVertical="top"
                                                    returnKeyType="default"
                                                />
                                            </View>
                                            {feedbackChanged && (
                                                <TouchableOpacity
                                                    style={styles.saveFeedbackBtn}
                                                    onPress={() => handleSaveFeedback(v.id)}
                                                    activeOpacity={0.8}
                                                    disabled={isSavingFeedback}
                                                >
                                                    {isSavingFeedback ? (
                                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                                    ) : (
                                                        <Text style={styles.saveFeedbackText}>Save Feedback</Text>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea:       { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        height: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn:       { position: 'absolute', left: 20, zIndex: 1 },
    headerTitle:   { fontSize: 18, color: '#111827', fontFamily: 'Poppins-Medium' },
    scrollContainer: { flex: 1, backgroundColor: '#FFF0E6' },
    content: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    subtitle: {
        fontSize: 15,
        color: '#4B5563',
        fontFamily: 'Poppins-Regular',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0E6',
    },
    loadingText: {
        marginTop: 12,
        color: '#4B5563',
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    emptyText: { marginTop: 12, color: '#9CA3AF', fontFamily: 'Poppins-Medium', fontSize: 15 },

    // Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 17,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
        flex: 1,
        marginRight: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 2,
    },
    tapToRate: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'Poppins-Regular',
        marginBottom: 12,
    },

    // Details
    detailsGrid:  { marginBottom: 18, gap: 8 },
    detailRow:    { flexDirection: 'row', alignItems: 'center' },
    detailIcon:   { marginRight: 10, width: 18 },
    detailText:   { fontSize: 14, color: '#4B5563', fontFamily: 'Poppins-Regular' },

    // Toggle
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    toggleBtnText: { fontSize: 15, color: '#111827', fontFamily: 'Poppins-Medium' },

    // Expanded
    expandedSection: { marginTop: 16 },
    divider:         { height: 1, backgroundColor: '#F3F4F6', marginBottom: 20 },
    sectionHeading:  { fontSize: 15, color: '#111827', fontFamily: 'Poppins-Medium', marginBottom: 12 },

    // Vitals
    noVitalsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        gap: 8,
    },
    noVitalsText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Poppins-Regular' },
    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    vitalCard: {
        width: (screenWidth - 80 - 10) / 2,
        borderRadius: 12,
        padding: 14,
    },
    vitalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    vitalLabel: {
        fontSize: 12,
        color: '#374151',
        fontFamily: 'Poppins-Regular',
        marginLeft: 6,
        flex: 1,
    },
    vitalValue:  { fontSize: 17, color: '#111827', fontFamily: 'Poppins-Medium' },
    abnormalBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    abnormalText: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Poppins-Medium' },

    // Notes
    notesBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    notesText: { fontSize: 14, color: '#4B5563', fontFamily: 'Poppins-Regular', lineHeight: 22 },

    // Feedback
    feedbackInputWrap: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
        marginBottom: 10,
        overflow: 'hidden',
    },
    feedbackInput: {
        fontSize: 14,
        color: '#111827',
        fontFamily: 'Poppins-Regular',
        padding: 14,
        minHeight: 90,
        lineHeight: 22,
    },
    saveFeedbackBtn: {
        backgroundColor: '#FE6700',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginBottom: 4,
    },
    // SOS section
    sosSectionWrap: {
        marginBottom: 28,
    },
    sosSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sosSectionTitle: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'Poppins-SemiBold',
    },
    sosCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#FEE2E2',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
    },
    sosCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sosTicketRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    sosTicket: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: '#DC2626',
        letterSpacing: 0.5,
    },
    sosBadge: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 20,
    },
    sosBadgeText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    sosDetailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 7,
        marginBottom: 6,
    },
    sosDetailText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#4B5563',
        flex: 1,
        lineHeight: 19,
    },
    sosToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        borderRadius: 10,
        paddingVertical: 10,
        marginTop: 10,
        backgroundColor: '#FFF5F5',
    },
    sosToggleText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: '#DC2626',
    },
    sosExpandedSection: { marginTop: 4 },
    sosBlock: {
        marginBottom: 16,
    },
    sosBlockTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: '#374151',
        marginBottom: 8,
    },
    notifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 5,
    },
    notifiedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#DC2626',
    },
    notifiedRole: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#6B7280',
    },
    notifiedName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: '#111827',
        flex: 1,
    },
    respondedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    respondedName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: '#065F46',
    },
    respondedRole: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#047857',
        textTransform: 'capitalize',
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    timelineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DC2626',
        marginTop: 5,
        marginRight: 10,
        flexShrink: 0,
    },
    timelineLine: {
        position: 'absolute',
        left: 3.5,
        top: 13,
        width: 1,
        height: '100%',
        backgroundColor: '#FECACA',
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 12,
    },
    timelineTime: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    timelineNote: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
    },
    resolutionBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    resolutionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: '#059669',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    resolutionText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#065F46',
        lineHeight: 20,
    },
    saveFeedbackText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontFamily: 'Poppins-Medium',
    },
});
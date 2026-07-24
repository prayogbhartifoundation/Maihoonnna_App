import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, Platform,
    Modal, Animated, Pressable, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeImageUri } from '@/utils/sanitizeImageUri';
import { ConnectContactButton } from '@/components/shared/ConnectContactModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

interface VisitProps {
    id: string;
    companionName: string;
    companionPhoto?: string;
    companionPhone?: string | null;
    dateStr: string;
    duration: string;
    rated: boolean;
    rating?: number | null;
    beneficiaryRating?: number | null;
    activities: string[];
    bp?: string;
    heartRate?: string;
    bloodSugar?: string;
    notes?: string;
}

// ── Inline star-rating modal for subscriber ────────────────────────────────
const RatingModal = ({
    visible,
    companionName,
    onSubmit,
    onClose,
    submitting,
}: {
    visible: boolean;
    companionName: string;
    onSubmit: (r: number) => void;
    onClose: () => void;
    submitting: boolean;
}) => {
    const [selected, setSelected] = useState(0);

    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalCard} onPress={() => {}}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Ionicons name="star" size={22} color="#F97316" />
                        <Text style={styles.modalTitle}>Rate Your Visit</Text>
                    </View>
                    <Text style={styles.modalSubtitle}>
                        How was {companionName}'s care during this visit?
                    </Text>

                    {/* Stars */}
                    <View style={styles.modalStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setSelected(s)}
                                activeOpacity={0.8}
                                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                            >
                                <Ionicons
                                    name={s <= selected ? 'star' : 'star-outline'}
                                    size={40}
                                    color={s <= selected ? '#F97316' : '#D1D5DB'}
                                    style={{ marginHorizontal: 5 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Label */}
                    {selected > 0 && (
                        <Text style={styles.ratingLabel}>{labels[selected]}</Text>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitBtn, !selected && styles.submitBtnDisabled]}
                            onPress={() => selected && onSubmit(selected)}
                            disabled={!selected || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export const TimelineTab = ({ visits: initialVisits }: { visits: VisitProps[] }) => {
    const [visits, setVisits] = useState<VisitProps[]>(initialVisits);
    const [ratingModalVisit, setRatingModalVisit] = useState<VisitProps | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Sync if parent updates visits
    React.useEffect(() => {
        setVisits(initialVisits);
    }, [initialVisits]);

    const handleSubmitRating = async (rating: number) => {
        if (!ratingModalVisit) return;
        const visitId = ratingModalVisit.id;

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            if (token && !visitId.startsWith('fallback')) {
                const res = await fetch(`${API_URL}/subscriber/visits/${visitId}/rate`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ rating })
                });
                const data = await res.json();
                if (!data.success) {
                    Alert.alert('Error', 'Failed to submit rating. Please try again.');
                    return;
                }
            }

            // Optimistic update
            setVisits(prev =>
                prev.map(v =>
                    v.id === visitId ? { ...v, rated: true, rating } : v
                )
            );
            setRatingModalVisit(null);
        } catch (e) {
            Alert.alert('Error', 'Network error. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (visits.length === 0) {
        return (
            <View style={styles.emptyTab}>
                <Ionicons name="time-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyTabText}>No visits recorded yet.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Rating Modal */}
            <RatingModal
                visible={!!ratingModalVisit}
                companionName={ratingModalVisit?.companionName || 'your Care Companion'}
                onSubmit={handleSubmitRating}
                onClose={() => !submitting && setRatingModalVisit(null)}
                submitting={submitting}
            />

            {visits.map((visit, i) => (
                <View key={visit.id || i} style={styles.visitCard}>
                    {/* Header: Avatar, Info, Status/Rate */}
                    <View style={styles.visitHeader}>
                        <Image
                            source={{ uri: sanitizeImageUri(visit.companionPhoto, 'https://randomuser.me/api/portraits/women/1.jpg') }}
                            style={styles.visitCompanionPhoto}
                        />

                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                <Text style={styles.visitCompanionName}>{visit.companionName || 'Care Companion'}</Text>
                                <ConnectContactButton
                                    name={visit.companionName || 'Care Companion'}
                                    role="Care Companion"
                                    phone={visit.companionPhone || null}
                                    photo={visit.companionPhoto}
                                />
                            </View>
                            <Text style={styles.visitDate}>{visit.dateStr || 'Recent visit'}</Text>
                            <Text style={styles.visitDuration}>{visit.duration || '1.5 hours'}</Text>
                        </View>

                        {/* Subscriber Rating */}
                        {visit.rated && visit.rating ? (
                            <TouchableOpacity
                                onPress={() => setRatingModalVisit(visit)}
                                style={styles.ratedBox}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Ionicons
                                            key={s}
                                            name={s <= (visit.rating || 5) ? 'star' : 'star-outline'}
                                            size={16}
                                            color="#F97316"
                                            style={{ marginRight: 1 }}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.yourRatingLabel}>Your rating</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.rateButton}
                                onPress={() => setRatingModalVisit(visit)}
                            >
                                <Ionicons name="star-outline" size={13} color="#FFF" style={{ marginRight: 4 }} />
                                <Text style={styles.rateButtonText}>Rate</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Beneficiary Rating Chip */}
                    {(visit.beneficiaryRating !== null && visit.beneficiaryRating !== undefined) && (
                        <View style={styles.beneficiaryRatingChip}>
                            <Ionicons name="person-outline" size={13} color="#7C3AED" style={{ marginRight: 5 }} />
                            <Text style={styles.beneficiaryRatingLabel}>Beneficiary: </Text>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons
                                    key={s}
                                    name={s <= (visit.beneficiaryRating || 0) ? 'star' : 'star-outline'}
                                    size={13}
                                    color="#7C3AED"
                                    style={{ marginRight: 1 }}
                                />
                            ))}
                            <Text style={styles.beneficiaryRatingValue}> {visit.beneficiaryRating}/5</Text>
                        </View>
                    )}

                    {/* Activities Pills */}
                    {!!visit.activities && visit.activities.length > 0 ? (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.visitSectionLabel}>Activities:</Text>
                            <View style={styles.activitiesTags}>
                                {visit.activities.map((a, j) => (
                                    <View key={j} style={styles.activityTag}>
                                        <Text style={styles.activityTagText}>{a}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {/* Vitals Blocks */}
                    {!!(visit.bp || visit.heartRate || visit.bloodSugar) ? (
                        <View style={styles.vitalsRow}>
                            {!!visit.bp ? (
                                <View style={styles.vitalChip}>
                                    <Text style={styles.vitalLabel}>BP</Text>
                                    <Text style={styles.vitalValue}>{visit.bp}</Text>
                                </View>
                            ) : null}
                            {!!visit.heartRate ? (
                                <View style={styles.vitalChip}>
                                    <Text style={styles.vitalLabel}>Heart Rate</Text>
                                    <Text style={styles.vitalValue}>{visit.heartRate}</Text>
                                </View>
                            ) : null}
                            {!!visit.bloodSugar ? (
                                <View style={styles.vitalChip}>
                                    <Text style={styles.vitalLabel}>Blood Sugar</Text>
                                    <Text style={styles.vitalValue}>{visit.bloodSugar}</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    {/* Notes Section */}
                    {!!visit.notes ? (
                        <View style={{ marginTop: 4 }}>
                            <Text style={styles.visitSectionLabel}>Notes:</Text>
                            <Text style={styles.visitNotes}>{visit.notes}</Text>
                        </View>
                    ) : null}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 14,
        paddingHorizontal: 18,
        paddingTop: 25,
        paddingBottom: 15,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    emptyTab: { alignItems: 'center', paddingVertical: 40 },
    emptyTabText: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },

    visitCard: {
        backgroundColor: '#E5E5E5',
        borderRadius: 7,
        padding: 16,
        marginBottom: 27,
    },

    visitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    visitCompanionPhoto: { width: 48, height: 48, borderRadius: 24, marginRight: 14, backgroundColor: '#D1D5DB' },
    visitCompanionName: { fontSize: 17, fontWeight: '700', color: '#111111', marginBottom: 3 },
    visitDate: { fontSize: 15, color: '#333333', fontWeight: '400', marginBottom: 2 },
    visitDuration: { fontSize: 15, color: '#333333', fontWeight: '400' },

    ratedBox: { alignItems: 'center' },
    yourRatingLabel: { fontSize: 10, color: '#6B7280', marginTop: 3, fontWeight: '500' },
    starsRow: { flexDirection: 'row', alignItems: 'center' },
    rateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF5B0A',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    rateButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

    // Beneficiary rating chip
    beneficiaryRatingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDE9FE',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 14,
        alignSelf: 'flex-start',
    },
    beneficiaryRatingLabel: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
    beneficiaryRatingValue: { fontSize: 12, color: '#7C3AED', fontWeight: '700' },

    visitSectionLabel: { fontSize: 14, fontWeight: '700', color: '#111111', marginBottom: 8 },
    activitiesTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    activityTag: {
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    activityTagText: { fontSize: 13, color: '#111111', fontWeight: '400' },

    vitalsRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
    vitalChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        paddingVertical: 8,
        paddingHorizontal: 9,
        flex: 1,
        alignItems: 'flex-start',
    },
    vitalLabel: { fontSize: 12, color: '#4B5563', fontWeight: '400', marginBottom: 3 },
    vitalValue: { fontSize: 14, fontWeight: '800', color: '#111111' },

    visitNotes: { fontSize: 15, color: '#333333', lineHeight: 21, fontWeight: '400' },

    // ── Rating Modal ──────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalStars: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F97316',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    submitBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FF5B0A',
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#FED7AA',
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default TimelineTab;

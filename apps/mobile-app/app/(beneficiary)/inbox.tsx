import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- PIXEL PERFECT CUSTOM SVG ICONS ---
const CustomMailOpenIcon = ({ size = 22, color = '#9CA3AF' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
        <Path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
    </Svg>
);

const CustomMailClosedIcon = ({ size = 22, color = '#FE6700' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Rect width="20" height="16" x="2" y="4" rx="2" />
        <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
);
// ------------------------------------------------

// Types to handle our mock data cleanly
interface Message {
    id: string;
    sender: string;
    date: string;
    subject: string;
    body: string;
    active: boolean;
}

const messages: Message[] = [
    {
        id: '1',
        sender: 'Dr. Sarah Johnson',
        date: 'Feb 20',
        subject: 'Schedule Change Approved',
        body: 'Your request to reschedule the visit to Feb 26th has been approved. Please ensure you are available at the new time. Your Care Companion will be notified automatically.',
        active: false, // Read (Open Envelope)
    },
    {
        id: '2',
        sender: 'Operations Manager',
        date: 'Feb 18',
        subject: 'Schedule Change Request Received',
        body: 'We have received your request for a schedule change. It is currently being reviewed by our coordination team. We will get back to you within 24 hours.',
        active: false, // Read (Open Envelope)
    },
    {
        id: '3',
        sender: 'Mark Thompson',
        date: 'Feb 15',
        subject: 'Medication Reminder',
        body: 'Please remember to take your evening medications as discussed during our last visit. If you are experiencing any side effects, let us know immediately.',
        active: true, // Unread (Closed Orange Envelope)
    },
];

export default function InboxScreen() {
    // State to hold the currently selected message for the popup
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Inbox</Text>

                {/* Keeping text exactly as requested, but hiding it visually to match Figma */}
                <Text style={styles.headerSub}>Messages & notifications</Text>

                {/* Compose button preserved but commented out as requested. 
                    Styles are updated so it matches the design perfectly if uncommented! */}
                {/* <TouchableOpacity style={styles.composeButton} activeOpacity={0.85}>
                    <Feather name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity> */}
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {messages.map((message) => (
                    <TouchableOpacity
                        key={message.id}
                        style={styles.messageCard}
                        activeOpacity={0.7}
                        onPress={() => setSelectedMessage(message)} // Opens the modal
                    >
                        {/* Conditionally render the envelope icon based on read/unread status */}
                        <View style={styles.messageIcon}>
                            {message.active ? (
                                <CustomMailClosedIcon />
                            ) : (
                                <CustomMailOpenIcon />
                            )}
                        </View>

                        <View style={styles.messageBody}>
                            <View style={styles.messageTopRow}>
                                <Text style={styles.sender} numberOfLines={1}>
                                    {message.sender}
                                </Text>
                                <Text style={styles.date}>{message.date}</Text>
                            </View>

                            <Text style={styles.subject} numberOfLines={1}>
                                {message.subject}
                            </Text>

                            <Text style={styles.preview} numberOfLines={1}>
                                {message.body}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* MESSAGE POPUP MODAL */}
            <Modal visible={selectedMessage !== null} animationType="fade" transparent={true}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalSubject} numberOfLines={2}>
                                {selectedMessage?.subject}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedMessage(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Feather name="x" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Meta Info */}
                        <View style={styles.modalMetaRow}>
                            <View style={styles.modalSenderBlock}>
                                <View style={styles.modalAvatarPlaceholder}>
                                    <Text style={styles.modalAvatarText}>
                                        {selectedMessage?.sender.charAt(0)}
                                    </Text>
                                </View>
                                <Text style={styles.modalSender}>{selectedMessage?.sender}</Text>
                            </View>
                            <Text style={styles.modalDate}>{selectedMessage?.date}</Text>
                        </View>

                        <View style={styles.modalDivider} />

                        {/* Modal Body Content */}
                        <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalBodyText}>{selectedMessage?.body}</Text>
                        </ScrollView>

                        {/* Close Action */}
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMessage(null)} activeOpacity={0.8}>
                            <Text style={styles.closeBtnText}>Close Message</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    header: {
        height: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'Poppins-Medium'
    },
    headerSub: {
        display: 'none' // Hidden to perfectly match the clean Figma header while keeping text in code
    },
    composeButton: {
        position: 'absolute',
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FE6700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        flex: 1,
        backgroundColor: '#FFF0E6', // Exact peach match
    },
    content: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },

    // --- Message Card Styling ---
    messageCard: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    messageIcon: {
        width: 24,
        marginTop: 2,
        marginRight: 16,
        alignItems: 'center',
    },
    messageBody: {
        flex: 1,
    },
    messageTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    sender: {
        flex: 1,
        marginRight: 8,
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        color: '#111827',
    },
    date: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#4B5563',
    },
    subject: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#111827',
        marginBottom: 4,
    },
    preview: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },

    // --- Modal Popup Styling ---
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxHeight: '80%',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalSubject: {
        flex: 1,
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        color: '#111827',
        marginRight: 12,
        lineHeight: 28,
    },
    modalMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalSenderBlock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF0E6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalAvatarText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#FE6700',
    },
    modalSender: {
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        color: '#374151',
    },
    modalDate: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#9CA3AF',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    modalBodyScroll: {
        marginBottom: 24,
    },
    modalBodyText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    closeBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    closeBtnText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        color: '#374151',
    },
});
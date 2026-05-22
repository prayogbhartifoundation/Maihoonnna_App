import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CompanionBackButtonProps {
    style?: ViewStyle | any;
    color?: string;
    size?: number;
}

export const CompanionBackButton: React.FC<CompanionBackButtonProps> = ({
    style,
    color = '#FFFFFF',
    size = 24
}) => {
    const router = useRouter();

    const handlePress = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(care-companion)');
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} style={style} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={size} color={color} />
        </TouchableOpacity>
    );
};

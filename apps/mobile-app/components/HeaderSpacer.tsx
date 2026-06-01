import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderSpacerProps {
    backgroundColor?: string;
    style?: ViewStyle;
}

export default function HeaderSpacer({ backgroundColor = 'transparent', style }: HeaderSpacerProps) {
    const insets = useSafeAreaInsets();

    return (
        <View 
            style={[{ 
                height: insets.top, 
                backgroundColor,
                width: '100%',
                zIndex: 100
            }, style]} 
        />
    );
}

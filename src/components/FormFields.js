import React from 'react';
import { Text, TextInput } from 'react-native';

export function SectionLabel({ children, T }) {
    return <Text style={{ color: T.accent, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 20, marginBottom: 6, marginLeft: 2 }}>{children}</Text>;
}

export function StyledInput({ placeholder, value, onChangeText, id, T, focused, setFocused, ...rest }) {
    return (
        <TextInput placeholder={placeholder} placeholderTextColor={T.placeholder} value={value} onChangeText={onChangeText} onFocus={() => setFocused(id)} onBlur={() => setFocused('')} style={{ flex: rest.flex || undefined, backgroundColor: T.input, color: T.text, borderWidth: 1, borderColor: focused === id ? T.accent : T.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginTop: 8 }} {...rest} />
    );
}
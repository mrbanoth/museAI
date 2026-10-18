import React from 'react';
import { Linking, Platform, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Colors } from '@/constants/colors';

/**
 * Minimal markdown for agent replies: headings, bullet / numbered lists,
 * **bold**, *italic* / _italic_, `code`, [links](url) and bare URLs.
 */

// No lookbehind: keep it compatible with every JS engine (Hermes on Android)
const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+|\*[^*\s][^*\n]*\*|\b_[^_\s][^_\n]*_\b)/g;

const openUrl = (url: string) => {
  if (Platform.OS === 'web') window.open(url, '_blank');
  else Linking.openURL(url).catch(() => {});
};

function renderInline(text: string, baseStyle: StyleProp<TextStyle>, keyPrefix: string) {
  const parts = text.split(INLINE).filter((p) => p !== '');
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <Text key={key} style={[baseStyle, styles.bold]}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <Text key={key} style={[baseStyle, styles.code]}>{part.slice(1, -1)}</Text>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return <Text key={key} style={[baseStyle, styles.link]} onPress={() => openUrl(link[2])}>{link[1]}</Text>;
    }
    if (/^https?:\/\//.test(part)) {
      const url = part.replace(/[.,;:!?]+$/, '');
      return <Text key={key} style={[baseStyle, styles.link]} onPress={() => openUrl(url)}>{part}</Text>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      if (part.length > 2) return <Text key={key} style={[baseStyle, styles.italic]}>{part.slice(1, -1)}</Text>;
    }
    return <Text key={key} style={baseStyle}>{part}</Text>;
  });
}

export const MarkdownText: React.FC<{ text: string; style?: StyleProp<TextStyle> }> = ({ text, style }) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return (
    <View>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={i} style={styles.gap} />;

        const heading = line.match(/^#{1,4}\s+(.*)$/);
        if (heading) {
          return <Text key={i} style={[style, styles.heading]}>{renderInline(heading[1], [style, styles.heading], `h${i}`)}</Text>;
        }

        const bullet = line.match(/^(\s*)(?:[-*•]|(\d+)[.)])\s+(.*)$/);
        if (bullet) {
          const indent = Math.min(2, Math.floor(bullet[1].length / 2));
          return (
            <View key={i} style={[styles.listRow, { paddingLeft: indent * 14 }]}>
              <Text style={[style, styles.marker]}>{bullet[2] ? `${bullet[2]}.` : '•'}</Text>
              <Text style={[style, styles.listText]}>{renderInline(bullet[3], style, `b${i}`)}</Text>
            </View>
          );
        }

        return <Text key={i} style={style}>{renderInline(line, style, `p${i}`)}</Text>;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    backgroundColor: Colors.surfaceMuted,
  },
  link: { color: Colors.primary, textDecorationLine: 'underline' },
  heading: { fontWeight: '700', fontSize: 16, marginTop: 4 },
  gap: { height: 8 },
  listRow: { flexDirection: 'row', marginTop: 2 },
  marker: { width: 22 },
  listText: { flex: 1 },
});

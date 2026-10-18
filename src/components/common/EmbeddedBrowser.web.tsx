import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { EmbeddedBrowserProps } from './EmbeddedBrowser';

/**
 * Web version: an iframe (react-native-webview has no web support).
 */
export const EmbeddedBrowser: React.FC<EmbeddedBrowserProps & { style?: StyleProp<ViewStyle> }> = ({ url, style }) => (
  <View style={[styles.container, style]}>
    <iframe
      src={url}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="Live browser"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

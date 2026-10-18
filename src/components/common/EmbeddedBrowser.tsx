import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/colors';

export interface EmbeddedBrowserProps {
  url: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shows a web page (e.g. the Browserbase live view) inside the app.
 * Native: WebView. Web: see EmbeddedBrowser.web.tsx (iframe).
 */
export const EmbeddedBrowser: React.FC<EmbeddedBrowserProps> = ({ url, style }) => (
  <View style={[styles.container, style]}>
    <WebView
      source={{ uri: url }}
      style={styles.webview}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      setSupportMultipleWindows={false}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

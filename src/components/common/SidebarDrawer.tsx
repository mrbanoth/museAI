/**
 * SidebarDrawer — phone version of the web-portal sidebar.
 *
 * Slides the same DesktopSidebar (Muse + Invite, nav, side chats,
 * settings / search / new chat) in from the left, so the app and the
 * web portal share one navigation design.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesktopSidebar, DesktopRoute } from './DesktopSidebar';

export interface SidebarDrawerProps {
  visible: boolean;
  activeRoute: string;
  activeChatId: string;
  agentName?: string;
  onClose: () => void;
  onNavigate: (route: DesktopRoute) => void;
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  visible,
  activeRoute,
  activeChatId,
  agentName = 'Muse',
  onClose,
  onNavigate,
  onSelectChat,
  onNewChat,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(320, width * 0.84);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [visible, slide]);

  const close = (after?: () => void) => {
    onClose();
    after?.();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: slide }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            {
              width: drawerWidth,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-drawerWidth, 0] }) }],
            },
          ]}>
          <DesktopSidebar
            variant="drawer"
            activeRoute={activeRoute}
            activeSessionId={activeChatId}
            collapsed={false}
            agentName={agentName}
            onNavigate={(route) => close(() => onNavigate(route))}
            onSelectChat={(id) => close(() => onSelectChat(id))}
            onNewChat={() => close(onNewChat)}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
});

export default SidebarDrawer;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  Globe02Icon,
  MaximizeIcon,
  Share01Icon,
  PlayIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

interface LiveBrowserModalProps {
  visible: boolean;
  url: string | null;
  title?: string;
  onClose: () => void;
}

export const LiveBrowserModal: React.FC<LiveBrowserModalProps> = ({
  visible,
  url,
  title = 'Browserbase Cloud Session',
  onClose,
}) => {
  if (!url) return null;

  const handleOpenExternal = () => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.statusDot} />
              <HugeiconsIcon icon={Globe02Icon} size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleOpenExternal}
                activeOpacity={0.7}>
                <HugeiconsIcon icon={Share01Icon} size={18} color={Colors.iconDark} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}>
                <HugeiconsIcon icon={Cancel01Icon} size={18} color={Colors.iconDark} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body: Embedded Cloud Browser */}
          <View style={styles.browserContainer}>
            {Platform.OS === 'web' ? (
              // @ts-ignore - Web iframe for Browserbase Live View & Replay
              <iframe
                src={url}
                style={styles.iframeStyle}
                title="Browserbase Live Session"
                allow="camera; microphone; clipboard-read; clipboard-write;"
              />
            ) : (
              <View style={styles.mobileFallback}>
                <HugeiconsIcon icon={PlayIcon} size={48} color={Colors.primary} />
                <Text style={styles.fallbackTitle}>Cloud Browser Session Active</Text>
                <Text style={styles.fallbackDesc}>
                  Viewing session: {url}
                </Text>
                <TouchableOpacity
                  style={styles.fallbackBtn}
                  onPress={handleOpenExternal}
                  activeOpacity={0.8}>
                  <Text style={styles.fallbackBtnText}>Open Live View Stream</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 10,
  },
  modalContent: {
    width: Platform.OS === 'web' ? '92%' : '100%',
    maxWidth: 1100,
    height: Platform.OS === 'web' ? '88%' : '90%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
    flexDirection: 'column',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.iconDark,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  iframeStyle: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  mobileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  fallbackDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
  },
  fallbackBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  fallbackBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

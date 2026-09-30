/**
 * EditAgentModal Component
 *
 * Full agent personalization editor allowing users to customize:
 * 1. Agent Name (e.g. Cooper, Daily Sentinel)
 * 2. Role / Subtitle (e.g. Autonomous Task Agent)
 * 3. Emblem Vector Icon (Sparkle, Bot, Turbo Zap, Target Sentinel, Deep Brain)
 * 4. Aura Theme Palette (Muse Blue, Cyber Indigo, Emerald, Amber, Violet, Rose)
 * Includes live real-time preview card before saving changes.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  AiSparklesIcon,
  BotIcon,
  ZapIcon,
  Target01Icon,
  AiBrain01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import MascotAvatar from './MascotAvatar';

export interface EditAgentModalProps {
  /** Visibility state of the modal */
  visible: boolean;
  /** Current agent name */
  initialName: string;
  /** Current agent subtitle/role description */
  initialSubtitle: string;
  /** Currently selected icon emblem key */
  initialIcon: string;
  /** Currently selected theme aura hex color */
  initialColor: string;
  /** Callback to dismiss modal */
  onClose: () => void;
  /** Callback invoked with updated agent parameters */
  onSave: (data: { name: string; subtitle: string; icon: string; color: string }) => void;
}

/**
 * Available emblem vector icon choices
 */
const ICON_OPTIONS = [
  { id: 'sparkle', label: 'Sparkle AI', icon: AiSparklesIcon },
  { id: 'bot', label: 'Autonomous Bot', icon: BotIcon },
  { id: 'zap', label: 'Turbo Speed', icon: ZapIcon },
  { id: 'target', label: 'Goal Sentinel', icon: Target01Icon },
  { id: 'brain', label: 'Deep Brain', icon: AiBrain01Icon },
];

/**
 * Curated brand accent color swatches
 */
const COLOR_OPTIONS = [
  { id: '#2563EB', name: 'Muse Blue' },
  { id: '#4F46E5', name: 'Cyber Indigo' },
  { id: '#059669', name: 'Emerald Sentinel' },
  { id: '#D97706', name: 'Amber Turbo' },
  { id: '#7C3AED', name: 'Ultra Violet' },
  { id: '#E11D48', name: 'Rose Red' },
];

/**
 * Agent Personalization Modal with Live Preview
 */
export const EditAgentModal: React.FC<EditAgentModalProps> = ({
  visible,
  initialName,
  initialSubtitle,
  initialIcon,
  initialColor,
  onClose,
  onSave,
}) => {

  const [name, setName] = useState(initialName);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [selectedIcon, setSelectedIcon] = useState(initialIcon);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSubtitle(initialSubtitle);
      setSelectedIcon(initialIcon);
      setSelectedColor(initialColor);
    }
  }, [visible, initialName, initialSubtitle, initialIcon, initialColor]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      subtitle: subtitle.trim() || 'Autonomous Agent',
      icon: selectedIcon,
      color: selectedColor,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Edit AI Agent & Mascot</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                {/* Live Preview */}
                <View style={styles.previewContainer}>
                  <MascotAvatar
                    size="large"
                    iconType={selectedIcon}
                    customColor={selectedColor}
                  />
                  <Text style={styles.previewName}>{name || 'Muse AI'}</Text>
                  <Text style={styles.previewSubtitle}>
                    {subtitle || 'Autonomous Agent'}
                  </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Agent Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Muse AI, Daily Sentinel"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={30}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Subtitle / Role</Text>
                  <TextInput
                    style={styles.input}
                    value={subtitle}
                    onChangeText={setSubtitle}
                    placeholder="e.g. Autonomous Workflow Agent"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={40}
                  />
                </View>

                {/* Mascot Icon Selector */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mascot Emblem Icon</Text>
                  <View style={styles.iconGrid}>
                    {ICON_OPTIONS.map((item) => {
                      const isSelected = selectedIcon === item.id;
                      const IconComponent = item.icon;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.iconOption,
                            isSelected && {
                              borderColor: selectedColor,
                              backgroundColor: selectedColor + '15',
                            },
                          ]}
                          onPress={() => setSelectedIcon(item.id)}
                          activeOpacity={0.7}>
                          <HugeiconsIcon
                            icon={IconComponent}
                            size={22}
                            color={isSelected ? selectedColor : Colors.textSecondary}
                            strokeWidth={isSelected ? 2.2 : 1.75}
                          />
                          <Text
                            style={[
                              styles.iconOptionText,
                              isSelected && { color: selectedColor, fontWeight: '700' },
                            ]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Theme Color Palette */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mascot Aura & Theme Color</Text>
                  <View style={styles.colorRow}>
                    {COLOR_OPTIONS.map((color) => {
                      const isSelected = selectedColor === color.id;
                      return (
                        <TouchableOpacity
                          key={color.id}
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: color.id },
                            isSelected && styles.selectedSwatch,
                          ]}
                          onPress={() => setSelectedColor(color.id)}
                          activeOpacity={0.8}>
                          {isSelected && (
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              size={16}
                              color={Colors.white}
                              strokeWidth={2.5}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Actions Bottom Bar */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: selectedColor }]}
                  onPress={handleSave}
                  activeOpacity={0.8}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  previewSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  iconOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSwatch: {
    borderWidth: 3,
    borderColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 0 0 2px #2563EB',
      },
    }),
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default EditAgentModal;

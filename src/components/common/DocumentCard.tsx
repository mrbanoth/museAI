import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

export interface DocumentCardProps {
  documentTitle?: string;
  subtitle?: string;
  studentName?: string;
  guardianName?: string;
  fileName?: string;
  fileType?: string;
  onOpenDoc?: () => void;
  onOptions?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  documentTitle = 'Field Trip Permission Slip',
  subtitle = 'Lincoln Middle School • Monterey Bay Aquarium',
  studentName = 'Amara Dosi',
  guardianName = 'Jordan Dosi',
  fileName = 'Field trip permission slip',
  fileType = 'PDF',
  onOpenDoc,
  onOptions,
}) => {
  return (
    <View style={styles.container}>
      {/* Visual Form Canvas Preview */}
      <View style={styles.formPreview}>
        <View style={styles.formHeader}>
          <View style={styles.schoolBadge} />
          <Text style={styles.formMeta}>LINCOLN MIDDLE SCHOOL • GRADE 7 SCIENCE</Text>
        </View>

        <Text style={styles.formTitle}>{documentTitle}</Text>
        <Text style={styles.formDates}>Monterey Bay Aquarium • Fri, Oct 23 2026 • Depart 8:15 AM, return 4:30 PM</Text>

        <Text style={styles.formLegal}>
          I give permission for my child, named below, to attend the field trip described above.
          I understand transportation is by chartered bus.
        </Text>

        <View style={styles.fieldsGrid}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>STUDENT</Text>
            <Text style={styles.fieldValue}>{studentName}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>GUARDIAN</Text>
            <Text style={styles.fieldValue}>{guardianName} (Signed)</Text>
          </View>
        </View>
      </View>

      {/* PDF File Attachment Capsule */}
      <TouchableOpacity style={styles.pdfAttachment} onPress={onOpenDoc} activeOpacity={0.8}>
        <View style={styles.pdfIcon}>
          <Text style={styles.pdfBadgeText}>PDF</Text>
        </View>
        <View style={styles.pdfTextCol}>
          <Text style={styles.pdfTitle}>{fileName}</Text>
          <Text style={styles.pdfSub}>{fileType}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={onOptions} activeOpacity={0.7}>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={18} color={Colors.iconMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formPreview: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  schoolBadge: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  formMeta: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.iconDark,
    marginBottom: 4,
  },
  formDates: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 10,
  },
  formLegal: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 12,
  },
  fieldsGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  fieldValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  pdfAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 10,
  },
  pdfIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  pdfTextCol: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  pdfSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  moreBtn: {
    padding: 6,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ShoppingCart01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  CreditCardIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

export interface CheckoutCardProps {
  merchantDomain?: string;
  productTitle?: string;
  price?: string;
  regularPrice?: string;
  cardLast4?: string;
  total?: string;
  onAllow?: () => void;
  onDeny?: () => void;
  onReviewOrder?: () => void;
}

export const CheckoutCard: React.FC<CheckoutCardProps> = ({
  merchantDomain = 'ncvss.com',
  productTitle = 'Glide Pro Stroller',
  price = '$80.00',
  regularPrice = '$320.00',
  cardLast4 = '1234',
  total = '$80',
  onAllow,
  onDeny,
  onReviewOrder,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color={Colors.iconDark} strokeWidth={2} />
        <Text style={styles.headerTitle}>
          <Text style={{ fontWeight: '700' }}>Checkout (Beta)</Text> • Muse wants to place an order at {merchantDomain}
        </Text>
      </View>

      <Text style={styles.disclaimer}>
        Verify the details and terms of your order on the merchant website carefully before approving.
      </Text>

      {/* Embedded Merchant Web Preview Box */}
      <View style={styles.previewBox}>
        <View style={styles.merchantHeader}>
          <Text style={styles.brandName}>NovaCruise</Text>
          <View style={styles.navLinks}>
            <Text style={styles.navLink}>Strollers</Text>
            <Text style={styles.navLink}>Car Seats</Text>
          </View>
        </View>

        <View style={styles.productRow}>
          {/* Stroller Emoji / Graphic */}
          <View style={styles.productGraphic}>
            <Text style={{ fontSize: 42 }}>🛒</Text>
          </View>

          <View style={styles.productDetails}>
            <Text style={styles.productName}>{productTitle}</Text>
            <Text style={styles.productSubtitle}>Foldable Travel Stroller</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{price}</Text>
              <Text style={styles.regularPriceText}>{regularPrice}</Text>
              <View style={styles.saveTag}>
                <Text style={styles.saveTagText}>SAVE 75%</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.reviewOrderBtn} onPress={onReviewOrder} activeOpacity={0.7}>
              <View style={styles.reviewFavicon}><Text style={{ fontSize: 10, color: '#047857', fontWeight: '800' }}>N</Text></View>
              <Text style={styles.reviewOrderText}>Review order</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Payment Method Selector Capsule */}
      <View style={styles.paymentCard}>
        <View style={styles.visaBadge}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#1E3A8A' }}>VISA</Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Credit Card •••• {cardLast4}</Text>
          <View style={styles.payWithLink}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color="#10B981" />
            <Text style={styles.linkText}>Pay with Link</Text>
          </View>
        </View>
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={Colors.iconMuted} />
      </View>

      {/* Totals Row */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Estimated total</Text>
        <Text style={styles.totalValue}>{total}</Text>
      </View>

      {/* Decision Buttons (Deny / Allow) */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.denyBtn} onPress={onDeny} activeOpacity={0.7}>
          <Text style={styles.denyText}>Deny</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.allowBtn} onPress={onAllow} activeOpacity={0.85}>
          <Text style={styles.allowText}>Allow</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 13,
    color: Colors.iconDark,
    lineHeight: 18,
    flex: 1,
  },
  disclaimer: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 12,
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 6,
  },
  brandName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 8,
  },
  navLink: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productGraphic: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  productSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  regularPriceText: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  saveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  saveTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#166534',
  },
  reviewOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewFavicon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewOrderText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  visaBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  payWithLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  linkText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  denyBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  allowBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

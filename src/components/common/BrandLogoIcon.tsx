/**
 * BrandLogoIcon Component
 *
 * Renders official brand vector logos using crisp SVG paths:
 * - Gmail, Google Calendar, Plaid, Facebook, Instagram, Peloton, OpenTable, HealthEx, Slack, Notion, GitHub, Spotify
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

export interface BrandLogoIconProps {
  name: string;
  size?: number;
}

export const BrandLogoIcon: React.FC<BrandLogoIconProps> = ({ name, size = 24 }) => {
  const normalized = name.toLowerCase();

  if (normalized.includes('gmail') || normalized === 'email') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
          fill="#EA4335"
        />
      </Svg>
    );
  }

  if (normalized.includes('calendar')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="3" y="4" width="18" height="18" rx="3" fill="#4285F4" />
        <Path d="M3 9H21V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V9Z" fill="#FFFFFF" />
        <Rect x="7" y="2" width="2" height="4" rx="1" fill="#1E3A8A" />
        <Rect x="15" y="2" width="2" height="4" rx="1" fill="#1E3A8A" />
        <Circle cx="8" cy="13" r="1.5" fill="#4285F4" />
        <Circle cx="12" cy="13" r="1.5" fill="#4285F4" />
        <Circle cx="16" cy="13" r="1.5" fill="#4285F4" />
        <Circle cx="8" cy="17" r="1.5" fill="#4285F4" />
        <Circle cx="12" cy="17" r="1.5" fill="#4285F4" />
      </Svg>
    );
  }

  if (normalized.includes('facebook')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="11" fill="#1877F2" />
        <Path
          d="M14.5 12.5H12.5V19H10V12.5H8.5V10.5H10V9C10 7.6 10.9 6.5 12.3 6.5H14.5V8.5H13C12.4 8.5 12.5 8.9 12.5 9.3V10.5H14.5L14.5 12.5Z"
          fill="#FFFFFF"
        />
      </Svg>
    );
  }

  if (normalized.includes('instagram')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="2" y="2" width="20" height="20" rx="6" fill="#E1306C" />
        <Rect x="5" y="5" width="14" height="14" rx="4" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <Circle cx="12" cy="12" r="3.5" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <Circle cx="16" cy="8" r="1" fill="#FFFFFF" />
      </Svg>
    );
  }

  if (normalized.includes('plaid') || normalized.includes('finance')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="2" y="2" width="20" height="20" rx="5" fill="#111827" />
        <Path d="M6 7H10V11H6V7Z" fill="#10B981" />
        <Path d="M14 7H18V11H14V7Z" fill="#10B981" />
        <Path d="M10 13H14V17H10V13Z" fill="#10B981" />
      </Svg>
    );
  }

  if (normalized.includes('opentable')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" fill="#DA3743" />
        <Circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
        <Circle cx="12" cy="12" r="2" fill="#DA3743" />
      </Svg>
    );
  }

  if (normalized.includes('healthex') || normalized.includes('health')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="2" y="2" width="20" height="20" rx="5" fill="#F59E0B" />
        <Path
          d="M7 12L10 9L13 14L15 11L17 12"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (normalized.includes('peloton')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" fill="#1E2022" />
        <Path
          d="M9 16.5L13.5 7.5H16L12.5 16.5H9Z"
          fill="#FF334B"
        />
        <Circle cx="12" cy="12" r="2" fill="#FFFFFF" />
      </Svg>
    );
  }

  if (normalized.includes('github')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" fill="#24292E" />
        <Path
          d="M12 4C7.6 4 4 7.6 4 12C4 15.5 6.3 18.5 9.5 19.6C9.9 19.7 10 19.4 10 19.2V17.8C7.8 18.3 7.3 16.8 7.3 16.8C6.9 15.9 6.4 15.6 6.4 15.6C5.7 15.1 6.5 15.1 6.5 15.1C7.3 15.2 7.7 16 7.7 16C8.4 17.2 9.5 16.8 9.9 16.6C10 16.1 10.2 15.7 10.4 15.5C8.6 15.3 6.7 14.6 6.7 11.5C6.7 10.6 7 9.9 7.5 9.3C7.4 9.1 7.1 8.2 7.6 7.2C7.6 7.2 8.3 7 9.8 8C10.5 7.8 11.2 7.7 12 7.7C12.8 7.7 13.5 7.8 14.2 8C15.7 7 16.4 7.2 16.4 7.2C16.9 8.2 16.6 9.1 16.5 9.3C17 9.9 17.3 10.6 17.3 11.5C17.3 14.6 15.4 15.3 13.6 15.5C13.9 15.8 14.2 16.3 14.2 17.1V19.2C14.2 19.4 14.3 19.7 14.7 19.6C17.9 18.5 20.2 15.5 20.2 12C20.2 7.6 16.6 4 12 4Z"
          fill="#FFFFFF"
        />
      </Svg>
    );
  }

  if (normalized.includes('notion')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="2" y="2" width="20" height="20" rx="5" fill="#000000" />
        <Path
          d="M6 7L16 6V17L7 18V7Z"
          fill="#FFFFFF"
        />
        <Path
          d="M8.5 9.5V15.5L13.5 8.5V14.5"
          stroke="#000000"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (normalized.includes('slack')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="2" y="2" width="20" height="20" rx="5" fill="#4A154B" />
        <Circle cx="8" cy="8" r="2" fill="#E01E5A" />
        <Circle cx="16" cy="8" r="2" fill="#2EB67D" />
        <Circle cx="16" cy="16" r="2" fill="#ECB22E" />
        <Circle cx="8" cy="16" r="2" fill="#36C5F0" />
      </Svg>
    );
  }

  // Default Vector Emblem
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="3" width="18" height="18" rx="5" fill="#2563EB" />
      <Circle cx="12" cy="12" r="4" fill="#FFFFFF" />
    </Svg>
  );
};

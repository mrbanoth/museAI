/**
 * Library Screen ('/(tabs)/library')
 *
 * Everything Muse has produced: browsing screenshots, sources and results,
 * built from the user's feed. Tap a card to open the page or screenshot.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { DashboardSquare02Icon, Globe02Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { ApiService, serverUrl, subscribeEvents } from '@/services/api';
import { LiveBrowserModal } from '@/components/common';
import { FeedItem } from '@/types';
import { timeAgo } from '@/utils/time';

export default function LibraryScreen() {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ visible: boolean; url: string | null; title?: string }>({ visible: false, url: null });

  const load = useCallback(async () => {
    try {
      setItems(await ApiService.getFeed());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    return subscribeEvents((event) => {
      if (event.type === 'feed.added') setItems((prev) => [event.data, ...prev.filter((p) => p.id !== event.data.id)]);
    });
  }, []);

  // Only things with something to look at: a screenshot or a source page
  const entries = items.filter((i) => i.screenshotUrl || i.sourceUrl);
  const columns = width >= 1100 ? 3 : width >= 700 ? 2 : 1;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Library</Text>
        <Text style={styles.subtitle}>Pages, screenshots and sources from everything Muse did for you</Text>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <HugeiconsIcon icon={DashboardSquare02Icon} size={36} color={Colors.primary} />
            <Text style={styles.emptyTitle}>{error ? 'Server unreachable' : 'Nothing here yet'}</Text>
            <Text style={styles.emptyText}>
              {error || 'Ask Muse to browse a site or run an idea. The pages it visits will be saved here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {entries.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { width: columns === 1 ? '100%' : columns === 2 ? '48.5%' : '31.8%' }]}
                activeOpacity={0.85}
                onPress={() =>
                  setViewer({ visible: true, url: serverUrl(item.screenshotUrl) || item.sourceUrl || null, title: item.title })
                }>
                {item.screenshotUrl ? (
                  <Image source={{ uri: serverUrl(item.screenshotUrl) }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <HugeiconsIcon icon={Globe02Icon} size={28} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {(item.sourceUrl || '').replace(/^https?:\/\//, '').split('/')[0] || item.category} · {timeAgo(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <LiveBrowserModal
        visible={viewer.visible}
        url={viewer.url}
        title={viewer.title}
        onClose={() => setViewer({ visible: false, url: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.iconDark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  thumb: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.surfaceMuted,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  cardMeta: {
    marginTop: 3,
    fontSize: 12,
    color: Colors.iconMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
});

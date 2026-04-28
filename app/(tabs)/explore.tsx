import { Image } from 'expo-image';
import { StyleSheet, View, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { puntosDeInteres } from '@/assets/images/puntos-interes';
import { supabase } from '@/components/constants/supabase';
import type { User } from '@supabase/supabase-js';
import { getFavoritePointIds, isFavoritePoint } from '@/services/favorites';

export default function ExploreScreen() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [query, setQuery] = React.useState('');
  const favoritePointIds = getFavoritePointIds(user);
  const filteredPoints = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return puntosDeInteres;
    }

    return puntosDeInteres.filter((point) => {
      const searchText = [
        point.nombre,
        point.descripcion,
        point.categoria,
        point.direccion,
        point.recomendadoPara,
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(normalizedQuery);
    });
  }, [query]);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const toggleFavorite = async (pointId: string) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar favoritos.');
      return;
    }

    const nextFavoriteIds = favoritePointIds.includes(pointId)
      ? favoritePointIds.filter((item) => item !== pointId)
      : [...favoritePointIds, pointId];

    const { data, error } = await supabase.auth.updateUser({
      data: {
        favorite_point_ids: nextFavoriteIds,
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setUser(data.user ?? null);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.frame}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="compass-outline" size={22} color="#fff" />
            </View>
            <View style={styles.headerTextBlock}>
              <ThemedText type="title" style={styles.title}>
                Puntos turísticos
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                San Fernando del Valle de Catamarca
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.headerDescription}>
            Busca un lugar, marca favoritos con el corazón y entra al detalle con mapa,
            horarios y recomendaciones.
          </ThemedText>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#5A7C86" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre, categoría o dirección"
              placeholderTextColor="#6D8C96"
              style={styles.searchInput}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#5A7C86" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={14} color="#256D85" />
              <ThemedText style={styles.metaChipText}>{filteredPoints.length} lugares</ThemedText>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="heart-outline" size={14} color="#256D85" />
              <ThemedText style={styles.metaChipText}>{favoritePointIds.length} favoritos</ThemedText>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="map-outline" size={14} color="#256D85" />
              <ThemedText style={styles.metaChipText}>Mapa interactivo</ThemedText>
            </View>
          </View>
        </View>

        {filteredPoints.length > 0 ? (
          filteredPoints.map((punto) => (
          <View
            key={punto.id}
            style={styles.card}>
            <Pressable
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(punto.id)}
              hitSlop={8}>
              <Ionicons
                name={isFavoritePoint(user, punto.id) ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavoritePoint(user, punto.id) ? '#DB4437' : '#fff'}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
              onPress={() => router.push(`/punto/${punto.id}` as never)}>
              <Image source={punto.imagenes[0]} style={styles.cardImage} contentFit="cover" />
              <View style={styles.cardCategoryPill}>
                <Ionicons name="pricetag-outline" size={12} color="#fff" />
                <ThemedText style={styles.cardCategoryText}>{punto.categoria}</ThemedText>
              </View>
              <View style={styles.cardContent}>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  {punto.nombre}
                </ThemedText>
                <ThemedText style={styles.cardDesc}>{punto.descripcion}</ThemedText>
                <View style={styles.cardMetaRow}>
                  <View style={styles.cardMetaItem}>
                    <Ionicons name="time-outline" size={14} color="#5A7C86" />
                    <ThemedText style={styles.cardMetaText}>{punto.duracionSugerida}</ThemedText>
                  </View>
                  <View style={styles.cardMetaItem}>
                    <Ionicons name="navigate-outline" size={14} color="#5A7C86" />
                    <ThemedText style={styles.cardMetaText}>Ver detalle</ThemedText>
                  </View>
                </View>
                {isFavoritePoint(user, punto.id) ? (
                  <ThemedText style={styles.favoriteLabel}>Marcado como favorito</ThemedText>
                ) : null}
              </View>
            </Pressable>
          </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={34} color="#256D85" />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No encontramos coincidencias
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              Probá con otro nombre, categoría o limpiá la búsqueda para ver todos los puntos.
            </ThemedText>
          </View>
        )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  content: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    maxWidth: 620,
    gap: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#256D85',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C3E49',
  },
  subtitle: {
    marginTop: 2,
    color: '#4F6F7A',
  },
  headerDescription: {
    color: '#36555F',
    lineHeight: 21,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF5F7',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: '#1C3E49',
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaChipText: {
    color: '#256D85',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  cardPressable: {
    width: '100%',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardImage: {
    width: '100%',
    height: 210,
  },
  cardCategoryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 35, 45, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  cardCategoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
    gap: 10,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 109, 133, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3E49',
  },
  cardDesc: {
    fontSize: 15,
    color: '#4F6F7A',
    lineHeight: 21,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F8FA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  cardMetaText: {
    color: '#3C5963',
    fontSize: 12,
    fontWeight: '700',
  },
  favoriteLabel: {
    marginTop: 2,
    color: '#DB4437',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    minHeight: 220,
    gap: 10,
  },
  emptyTitle: {
    color: '#1C3E49',
    textAlign: 'center',
  },
  emptyText: {
    color: '#4F6F7A',
    textAlign: 'center',
    lineHeight: 20,
  },
});

import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import React from 'react';

import { PuntoMap } from '@/components/punto-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { resolvePuntoLocation } from '@/services/location-provider';
import { fallbackTouristPoints, loadTouristPoint, type TouristPoint } from '@/services/tourist-points';
import { supabase } from '@/components/constants/supabase';
import type { User } from '@supabase/supabase-js';
import { addFavoritePoint, loadFavoritePointIds, removeFavoritePoint } from '@/services/favorites';

export default function PuntoDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [punto, setPunto] = React.useState<TouristPoint | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [location, setLocation] = React.useState({ lat: 0, lng: 0, source: 'static' as 'google' | 'nominatim' | 'static' });
  const [isResolvingLocation, setIsResolvingLocation] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);

  const isFavorite = punto ? favoriteIds.includes(punto.id) : false;

  React.useEffect(() => {
    let active = true;

    if (!id) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);

    loadTouristPoint(id)
      .then((data) => {
        if (!active) {
          return;
        }
        if (data) {
          setPunto(data);
        } else {
          const fallback = fallbackTouristPoints().find((item) => item.id === id) ?? null;
          setPunto(fallback);
        }
      })
      .catch(() => {
        if (active) {
          const fallback = fallbackTouristPoints().find((item) => item.id === id) ?? null;
          setPunto(fallback);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

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

  React.useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    loadFavoritePointIds(user.id)
      .then((ids) => {
        setFavoriteIds(ids);
      })
      .catch(() => {
        setFavoriteIds([]);
      });
  }, [user]);

  React.useEffect(() => {
    if (!punto) {
      return;
    }

    let active = true;

    setLocation({
      lat: punto.ubicacion.lat,
      lng: punto.ubicacion.lng,
      source: 'static',
    });
    setIsResolvingLocation(true);

    resolvePuntoLocation(punto)
      .then((resolved) => {
        if (!active) {
          return;
        }
        setLocation(resolved);
      })
      .finally(() => {
        if (active) {
          setIsResolvingLocation(false);
        }
      });

    return () => {
      active = false;
    };
  }, [punto]);

  const locationSourceLabel =
    location.source === 'google'
      ? 'Google Geocoding API'
      : location.source === 'nominatim'
        ? 'OpenStreetMap Nominatim'
        : 'Coordenada cargada localmente';

  const handleOpenInMaps = async () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
    const canOpen = await Linking.canOpenURL(mapsUrl);
    if (canOpen) {
      await Linking.openURL(mapsUrl);
    }
  };

  const handleToggleFavorite = async () => {
    if (!punto) {
      return;
    }
    if (!user) {
      Alert.alert('Favoritos', 'Inicia sesion para guardar favoritos.');
      return;
    }

    const wasFavorite = favoriteIds.includes(punto.id);
    setFavoriteIds((prev) =>
      wasFavorite ? prev.filter((id) => id !== punto.id) : [...prev, punto.id],
    );

    try {
      if (wasFavorite) {
        await removeFavoritePoint(user.id, punto.id);
      } else {
        await addFavoritePoint(user.id, punto.id);
      }
    } catch (toggleError) {
      setFavoriteIds((prev) =>
        wasFavorite ? [...prev, punto.id] : prev.filter((id) => id !== punto.id),
      );
      Alert.alert('Error', toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar favorito.');
    }
  };

  if (!punto && !isLoading) {
    return (
      <ThemedView style={styles.notFoundContainer}>
        <Stack.Screen options={{ title: 'Punto no encontrado' }} />
        <ThemedText type="title">Punto no encontrado</ThemedText>
        <ThemedText>El punto turístico solicitado no existe.</ThemedText>
      </ThemedView>
    );
  }

  if (!punto) {
    return (
      <ThemedView style={styles.notFoundContainer}>
        <ThemedText>Cargando punto...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: punto.nombre }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.frame}>
        <View style={styles.heroCard}>
          <Image source={punto.imagenes[0]} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <Pressable style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color="#fff" />
          </Pressable>
          <View style={styles.heroContent}>
            <View style={styles.categoryPill}>
              <Ionicons name="pricetag-outline" size={12} color="#fff" />
              <ThemedText style={styles.categoryPillText}>{punto.categoria}</ThemedText>
            </View>
            <ThemedText type="title" style={styles.name}>
              {punto.nombre}
            </ThemedText>
            <ThemedText style={styles.description}>{punto.descripcion}</ThemedText>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Información rápida
          </ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="time-outline" size={18} color="#256D85" />
              <ThemedText style={styles.metricLabel}>Duración</ThemedText>
              <ThemedText style={styles.metricValue}>{punto.duracionSugerida}</ThemedText>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="cash-outline" size={18} color="#256D85" />
              <ThemedText style={styles.metricLabel}>Costo</ThemedText>
              <ThemedText style={styles.metricValue}>{punto.costoEntrada}</ThemedText>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="calendar-outline" size={18} color="#256D85" />
              <ThemedText style={styles.metricLabel}>Horario</ThemedText>
              <ThemedText style={styles.metricValue}>{punto.horario}</ThemedText>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="walk-outline" size={18} color="#256D85" />
              <ThemedText style={styles.metricLabel}>Ideal para</ThemedText>
              <ThemedText style={styles.metricValue}>{punto.recomendadoPara}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Mapa
            </ThemedText>
            <ThemedText style={styles.locationSourceText}>
              {isResolvingLocation ? 'verificando...' : locationSourceLabel}
            </ThemedText>
          </View>
          <PuntoMap
            lat={location.lat}
            lng={location.lng}
            title={punto.nombre}
            description={punto.descripcion}
          />
          <View style={styles.actionRow}>
            <Pressable style={styles.mapActionButton} onPress={handleOpenInMaps}>
              <Ionicons name="navigate-outline" size={16} color="#fff" />
              <ThemedText style={styles.mapActionText} type="subtitle">
                Abrir en Maps
              </ThemedText>
            </Pressable>
            <Pressable style={styles.secondaryActionButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={16} color="#256D85" />
              <ThemedText style={styles.secondaryActionText}>Volver</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Información adicional
          </ThemedText>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Dirección</ThemedText>
            <ThemedText style={styles.detailValue}>{punto.direccion}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Categoría</ThemedText>
            <ThemedText style={styles.detailValue}>{punto.categoria}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Horario</ThemedText>
            <ThemedText style={styles.detailValue}>{punto.horario}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Costo</ThemedText>
            <ThemedText style={styles.detailValue}>{punto.costoEntrada}</ThemedText>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Servicios
          </ThemedText>
          <View style={styles.servicesWrap}>
            {punto.servicios.map((servicio) => (
              <View key={servicio} style={styles.serviceChip}>
                <ThemedText style={styles.serviceChipText}>{servicio}</ThemedText>
              </View>
            ))}
          </View>
        </View>
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
    padding: 16,
    paddingBottom: 32,
    gap: 14,
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    maxWidth: 620,
    gap: 14,
  },
  heroCard: {
    width: '100%',
    minHeight: 320,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1C3E49',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 35, 45, 0.52)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    padding: 20,
    gap: 12,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  categoryPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  name: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '800',
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 23,
    maxWidth: 500,
  },
  sectionTitle: {
    fontSize: 17,
    color: '#256D85',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    minWidth: '47%',
    backgroundColor: '#F4F8FA',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  metricLabel: {
    color: '#5A7C86',
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: '#1C3E49',
    fontSize: 14,
    lineHeight: 19,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationSourceText: {
    fontSize: 13,
    color: '#4F6F7A',
    textAlign: 'right',
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  mapActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#256D85',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 150,
  },
  mapActionText: {
    color: '#fff',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EAF2F6',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 116,
  },
  secondaryActionText: {
    color: '#256D85',
    fontWeight: '700',
  },
  detailRow: {
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F4',
  },
  detailLabel: {
    color: '#5A7C86',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: '#1C3E49',
    fontSize: 15,
    lineHeight: 21,
  },
  servicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    backgroundColor: '#EAF2F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  serviceChipText: {
    color: '#256D85',
    fontSize: 12,
    fontWeight: '700',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
});

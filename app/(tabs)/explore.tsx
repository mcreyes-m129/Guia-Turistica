import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { puntosDeInteres } from '@/assets/images/puntos-interes';
import { supabase } from '@/components/constants/supabase';
import type { User } from '@supabase/supabase-js';
import { addFavoritePoint, loadFavoritePointIds, removeFavoritePoint } from '@/services/favorites';
import { fallbackTouristPoints, loadTouristPoints, type TouristPoint } from '@/services/tourist-points';

export default function ExploreScreen() {
  const router = useRouter();
  const [points, setPoints] = React.useState<TouristPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);

  const favoriteSet = React.useMemo(() => new Set(favoriteIds), [favoriteIds]);

  React.useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    loadTouristPoints()
      .then((data) => {
        if (active) {
          setPoints(data);
        }
      })
      .catch(() => {
        if (active) {
          setPoints(fallbackTouristPoints());
          setError('No se pudo cargar desde Supabase.');
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
  }, []);

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

  const handleToggleFavorite = async (pointId: string) => {
    if (!user) {
      Alert.alert('Favoritos', 'Inicia sesion para guardar favoritos.');
      return;
    }

    const wasFavorite = favoriteSet.has(pointId);
    setFavoriteIds((prev) =>
      wasFavorite ? prev.filter((id) => id !== pointId) : [...prev, pointId],
    );

    try {
      if (wasFavorite) {
        await removeFavoritePoint(user.id, pointId);
      } else {
        await addFavoritePoint(user.id, pointId);
      }
    } catch (toggleError) {
      setFavoriteIds((prev) =>
        wasFavorite ? [...prev, pointId] : prev.filter((id) => id !== pointId),
      );
      Alert.alert('Error', toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar favorito.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Puntos turísticos de San Fernando del Valle de Catamarca
      </ThemedText>
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      {isLoading ? (
        <ThemedText style={styles.loadingText}>Cargando puntos...</ThemedText>
      ) : null}
      <ScrollView contentContainerStyle={styles.cardsContainer} showsVerticalScrollIndicator={false}>
        {(points.length ? points : puntosDeInteres).map((punto) => (
          <Pressable
            key={punto.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/punto/${punto.id}` as never)}>
            <Image
              source={punto.imagenes[0]}
              style={styles.cardImage}
              contentFit="cover"
            />
            <Pressable
              style={styles.favoriteButton}
              onPress={() => handleToggleFavorite(punto.id)}>
              <Ionicons
                name={favoriteSet.has(punto.id) ? 'heart' : 'heart-outline'}
                size={18}
                color={favoriteSet.has(punto.id) ? '#DB4437' : '#fff'}
              />
            </Pressable>
            <View style={styles.cardContent}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                {punto.nombre}
              </ThemedText>
              <ThemedText style={styles.cardDesc}>{punto.descripcion}</ThemedText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingTop: 24,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#256D85',
    textAlign: 'center',
    marginBottom: 18,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingText: {
    textAlign: 'center',
    color: '#4F6F7A',
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    color: '#B42318',
    marginBottom: 8,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    width: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardImage: {
    width: '100%',
    height: 170,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 35, 44, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#256D85',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 15,
    color: '#333',
  },
});

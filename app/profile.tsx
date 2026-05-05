import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { supabase } from '@/components/constants/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { User } from '@supabase/supabase-js';
import { loadFavoritePointIds } from '@/services/favorites';
import { fallbackTouristPoints, loadTouristPoints, type TouristPoint } from '@/services/tourist-points';

export default function ProfileModalScreen() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [points, setPoints] = React.useState<TouristPoint[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = React.useState(true);
  const [favoritePointIds, setFavoritePointIds] = React.useState<string[]>([]);
  const favoritePoints = points.filter((point) => favoritePointIds.includes(point.id));

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
      setFavoritePointIds([]);
      return;
    }

    loadFavoritePointIds(user.id)
      .then((ids) => {
        setFavoritePointIds(ids);
      })
      .catch(() => {
        setFavoritePointIds([]);
      });
  }, [user]);

  React.useEffect(() => {
    let active = true;
    setIsLoadingPoints(true);

    loadTouristPoints()
      .then((data) => {
        if (active) {
          setPoints(data);
        }
      })
      .catch(() => {
        if (active) {
          setPoints(fallbackTouristPoints());
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingPoints(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.replace('/');
  };

  const profileName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? 'Usuario';
  const profileImage = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const profileEmail = user?.email ?? 'Sin correo disponible';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.frame}>
        <View style={styles.heroCard}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="title" style={styles.title}>
                Perfil de usuario
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Gestiona tu cuenta y tus favoritos guardados.
              </ThemedText>
            </View>
            <Link href="/" dismissTo style={styles.closeLink}>
              <Ionicons name="close" size={20} color="#fff" />
            </Link>
          </View>

          <View style={styles.profileSummary}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <ThemedText type="title" style={styles.avatarPlaceholderText}>
                  {profileName.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}

            <View style={styles.profileTextGroup}>
              <ThemedText type="title" style={styles.name}>
                {profileName}
              </ThemedText>
              <ThemedText style={styles.email}>{profileEmail}</ThemedText>
            </View>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Ionicons name="heart" size={16} color="#DB4437" />
              <ThemedText type="subtitle" style={styles.quickStatValue}>
                {favoritePoints.length}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Favoritos</ThemedText>
            </View>
            <View style={styles.quickStatCard}>
              <Ionicons name="logo-google" size={16} color="#4285F4" />
              <ThemedText type="subtitle" style={styles.quickStatValue}>
                Activo
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Sesión</ThemedText>
            </View>
          </View>

          <View style={styles.infoBox}>
            <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
              Proveedor de acceso
            </ThemedText>
            <ThemedText style={styles.infoValue}>Google</ThemedText>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.exploreButton} onPress={() => router.push('/(tabs)/explore' as never)}>
              <Ionicons name="compass-outline" size={18} color="#fff" />
              <ThemedText type="subtitle" style={styles.exploreButtonText}>
                Explorar más lugares
              </ThemedText>
            </Pressable>

            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color="#DB4437" />
              <ThemedText type="subtitle" style={styles.signOutText}>
                Cerrar sesión
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.favoritesSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Favoritos
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            {favoritePoints.length > 0
              ? 'Puntos turísticos guardados por este usuario'
              : 'Aún no marcaste ningún punto como favorito'}
          </ThemedText>

          {isLoadingPoints ? (
            <ThemedText style={styles.sectionSubtitle}>Cargando favoritos...</ThemedText>
          ) : favoritePoints.length > 0 ? (
            favoritePoints.map((point) => (
              <Pressable
                key={point.id}
                style={styles.favoriteItem}
                onPress={() => router.push(`/punto/${point.id}` as never)}>
                <Image source={point.imagenes[0]} style={styles.favoriteImage} contentFit="cover" />
                <View style={styles.favoriteTextContainer}>
                  <ThemedText type="subtitle" style={styles.favoriteTitle}>
                    {point.nombre}
                  </ThemedText>
                  <ThemedText style={styles.favoriteDesc}>{point.descripcion}</ThemedText>
                  <View style={styles.favoriteMetaRow}>
                    <View style={styles.favoriteMetaChip}>
                      <Ionicons name="location-outline" size={12} color="#256D85" />
                      <ThemedText style={styles.favoriteMetaText}>Abrir detalle</ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyFavorites}>
              <Ionicons name="heart-outline" size={28} color="#256D85" />
              <ThemedText type="subtitle" style={styles.emptyFavoritesTitle}>
                Aún no guardaste favoritos
              </ThemedText>
              <ThemedText style={styles.emptyFavoritesText}>
                Volvé a Explore y tocá el corazón sobre cualquier punto turístico para guardarlo aquí.
              </ThemedText>
              <Pressable style={styles.emptyFavoritesButton} onPress={() => router.push('/(tabs)/explore' as never)}>
                <ThemedText type="subtitle" style={styles.emptyFavoritesButtonText}>
                  Ir a explorar
                </ThemedText>
              </Pressable>
            </View>
          )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    maxWidth: 620,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#256D85',
  },
  subtitle: {
    color: '#4F6F7A',
    marginTop: 4,
  },
  closeLink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#256D85',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 4,
  },
  profileTextGroup: {
    flex: 1,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#256D85',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 36,
  },
  name: {
    color: '#1C3E49',
    fontSize: 22,
  },
  email: {
    color: '#4F6F7A',
    marginTop: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#F4F8FA',
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  quickStatValue: {
    color: '#1C3E49',
  },
  quickStatLabel: {
    color: '#5A7C86',
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#EAF2F6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  infoLabel: {
    color: '#256D85',
    marginBottom: 4,
  },
  infoValue: {
    color: '#274A57',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exploreButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#256D85',
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  signOutButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F2C8C3',
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  signOutText: {
    color: '#DB4437',
  },
  favoritesSection: {
    marginTop: 18,
    marginBottom: 8,
    width: '100%',
  },
  sectionTitle: {
    color: '#256D85',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#4F6F7A',
    marginBottom: 12,
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  favoriteTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  favoriteTitle: {
    color: '#1C3E49',
    marginBottom: 4,
  },
  favoriteDesc: {
    color: '#4F6F7A',
    fontSize: 13,
    lineHeight: 18,
  },
  favoriteMetaRow: {
    marginTop: 8,
  },
  favoriteMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#EAF2F6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  favoriteMetaText: {
    color: '#256D85',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyFavorites: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyFavoritesTitle: {
    color: '#1C3E49',
    textAlign: 'center',
  },
  emptyFavoritesText: {
    color: '#4F6F7A',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyFavoritesButton: {
    backgroundColor: '#256D85',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyFavoritesButtonText: {
    color: '#fff',
  },
});
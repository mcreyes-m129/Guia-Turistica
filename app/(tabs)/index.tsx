import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/components/constants/supabase';
import { isAdminUser } from '@/constants/admin';
import type { User } from '@supabase/supabase-js';
import React from 'react';

export default function HomeScreen() {
  const [user, setUser] = React.useState<User | null>(null);
  const router = useRouter();

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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) Alert.alert('Error', error.message);
  };

  const profileName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? 'Perfil';
  const profileImage = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const isAdmin = isAdminUser(user);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/portadaHero.png')}
        style={styles.backgroundImage}
        blurRadius={0}
      />
      <View style={styles.overlay} pointerEvents="none" />
      <View style={styles.foreground}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentFrame}>

          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroMark}>
                <Ionicons name="compass" size={18} color="#fff" />
              </View>
              <ThemedText style={styles.heroEyebrow}>Experiencia turística digital</ThemedText>
            </View>

            <ThemedText type="title" style={styles.heroTitle}>
              Guía Turística Catamarca
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroSubtitle}>
              Descubre puntos de interés, guarda favoritos y abre el mapa en un solo toque.
            </ThemedText>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <ThemedText type="subtitle" style={styles.statValue}>
                  3+
                </ThemedText>
                <ThemedText style={styles.statLabel}>lugares destacados</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText type="subtitle" style={styles.statValue}>
                  Mapas
                </ThemedText>
                <ThemedText style={styles.statLabel}>web y móvil</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText type="subtitle" style={styles.statValue}>
                  Perfil
                </ThemedText>
                <ThemedText style={styles.statLabel}>favoritos privados</ThemedText>
              </View>
            </View>

            {user ? (
              <View style={styles.actionsColumn}>
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/(tabs)/explore' as never)}>
                  <Ionicons name="compass" size={18} color="#fff" />
                  <ThemedText style={styles.buttonText} type="subtitle">
                    Explorar puntos turísticos
                  </ThemedText>
                </Pressable>

                {isAdmin ? (
                  <Pressable
                    style={({ pressed }) => [styles.adminButton, pressed && styles.buttonPressed]}
                    onPress={() => router.push('/admin' as never)}>
                    <Ionicons name="settings-outline" size={18} color="#fff" />
                    <ThemedText style={styles.adminButtonText} type="subtitle">
                      Panel de administración
                    </ThemedText>
                  </Pressable>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.profileButton, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/profile' as never)}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileAvatar} contentFit="cover" />
                  ) : (
                    <View style={styles.profileAvatarPlaceholder}>
                      <ThemedText style={styles.profileAvatarPlaceholderText} type="subtitle">
                        {profileName.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.profileTextContainer}>
                    <ThemedText type="subtitle" style={styles.profileName}>
                      {profileName}
                    </ThemedText>
                    <ThemedText style={styles.profileLabel}>Abrir perfil y favoritos</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6B8791" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionsColumn}>
                <Pressable
                  style={({ pressed }) => [styles.signInButton, pressed && styles.buttonPressed]}
                  onPress={signInWithGoogle}>
                  <Ionicons name="logo-google" size={18} color="#fff" />
                  <ThemedText style={styles.buttonText} type="subtitle">
                    Iniciar sesión con Google
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.guestButton, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/(tabs)/explore' as never)}>
                  <Ionicons name="compass-outline" size={18} color="#256D85" />
                  <ThemedText style={styles.guestButtonText} type="subtitle">
                    Entrar como invitado
                  </ThemedText>
                </Pressable>
                <ThemedText style={styles.helperText}>
                  Inicia sesión para guardar favoritos y sincronizar tu perfil.
                </ThemedText>
              </View>
            )}
          </View>

            <View style={styles.featureStrip}>
              <View style={styles.featureChip}>
                <Ionicons name="heart-outline" size={14} color="#256D85" />
                <ThemedText style={styles.featureChipText}>Favoritos privados</ThemedText>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="location-outline" size={14} color="#256D85" />
                <ThemedText style={styles.featureChipText}>Mapa interactivo</ThemedText>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="phone-portrait-outline" size={14} color="#256D85" />
                <ThemedText style={styles.featureChipText}>Diseño adaptativo</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F3F7FA',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(7, 28, 38, 0.22)',
    zIndex: 1,
  },
  foreground: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    zIndex: 2,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 16,
    alignItems: 'center',
  },
  contentFrame: {
    width: '100%',
    maxWidth: 560,
    gap: 16,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: '#D8E7ED',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#256D85',
    fontSize: 13,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E4EDF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#153743',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: '#153743',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#153743',
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#415E68',
    lineHeight: 26,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statCard: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: 'rgba(245,249,251,0.88)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E1EBEF',
  },
  statValue: {
    color: '#153743',
    fontSize: 17,
    marginBottom: 4,
  },
  statLabel: {
    color: '#5A7C86',
    fontSize: 12,
  },
  actionsColumn: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#256D85',
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  adminButton: {
    backgroundColor: '#153743',
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  signInButton: {
    backgroundColor: '#DB4437',
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  guestButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: '#CFE0E6',
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  guestButtonText: {
    color: '#256D85',
    fontSize: 16,
    fontWeight: '700',
  },
  profileButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#256D85',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarPlaceholderText: {
    color: '#fff',
    fontSize: 22,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    color: '#153743',
    fontSize: 18,
  },
  profileLabel: {
    color: '#5A7C86',
    marginTop: 2,
    fontSize: 13,
  },
  helperText: {
    color: '#5A7C86',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 2,
  },
  featureStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#E1EBEF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureChipText: {
    color: '#256D85',
    fontSize: 12,
    fontWeight: '700',
  },
});

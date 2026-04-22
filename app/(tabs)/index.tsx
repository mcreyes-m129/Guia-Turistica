import { Image } from 'expo-image';
import { StyleSheet, View, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/components/constants/supabase';
import type { User } from '@supabase/supabase-js';
import React from 'react';

export default function HomeScreen() {
  const [user, setUser] = React.useState<User | null>(null);

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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/portadaHero.png')}
        style={styles.backgroundImage}
        blurRadius={1}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <ThemedText type="title" style={styles.heroTitle}>
          Guía Turística Catamarca
        </ThemedText>
        <ThemedText type="subtitle" style={styles.heroSubtitle}>
          Descubre los mejores puntos de interés de la provincia
        </ThemedText>
        {user ? (
          <>
            <View style={styles.button}>
              <ThemedText style={styles.buttonText} type="subtitle" onPress={() => window.location.href = '/explore'}>
                Explorar puntos turísticos
              </ThemedText>
            </View>
            <View style={{ marginTop: 12 }}>
              <ThemedText style={{ color: '#fff', textAlign: 'center' }} onPress={signOut}>
                Cerrar sesión
              </ThemedText>
            </View>
          </>
        ) : (
          <View style={{ ...styles.button, backgroundColor: '#DB4437', marginTop: 16 }}>
            <ThemedText style={styles.buttonText} type="subtitle" onPress={signInWithGoogle}>
              Iniciar sesión con Google
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  menu: {
    marginBottom: 32,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 22,
    marginBottom: 8,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  menuItems: {
    marginBottom: 8,
  },
  menuItem: {
    fontSize: 20,
    color: '#fff',
    marginVertical: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  button: {
    backgroundColor: '#256D85',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

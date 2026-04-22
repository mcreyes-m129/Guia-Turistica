import { Image } from 'expo-image';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { puntosDeInteres } from '@/assets/images/puntos-interes';

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Puntos turísticos de San Fernando del Valle de Catamarca
      </ThemedText>
      <ScrollView contentContainerStyle={styles.cardsContainer} showsVerticalScrollIndicator={false}>
        {puntosDeInteres.map((punto) => (
          <Pressable
            key={punto.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/punto/${punto.id}` as never)}>
            <Image
              source={punto.imagenes[0]}
              style={styles.cardImage}
              contentFit="cover"
            />
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

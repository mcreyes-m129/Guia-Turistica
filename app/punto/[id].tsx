import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import React from 'react';

import { puntosDeInteres } from '@/assets/images/puntos-interes';
import { PuntoMap } from '@/components/punto-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { resolvePuntoLocation } from '@/services/location-provider';

export default function PuntoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const punto = puntosDeInteres.find((item) => item.id === id);
  const [location, setLocation] = React.useState({ lat: punto?.ubicacion.lat ?? 0, lng: punto?.ubicacion.lng ?? 0, source: 'static' as 'google' | 'nominatim' | 'static' });
  const [isResolvingLocation, setIsResolvingLocation] = React.useState(false);

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

  if (!punto) {
    return (
      <ThemedView style={styles.notFoundContainer}>
        <Stack.Screen options={{ title: 'Punto no encontrado' }} />
        <ThemedText type="title">Punto no encontrado</ThemedText>
        <ThemedText>El punto turístico solicitado no existe.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: punto.nombre }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={punto.imagenes[0]} style={styles.image} contentFit="cover" />
        <View style={styles.infoCard}>
          <ThemedText type="title" style={styles.name}>
            {punto.nombre}
          </ThemedText>
          <ThemedText style={styles.description}>{punto.descripcion}</ThemedText>

          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Mapa
          </ThemedText>
          <PuntoMap
            lat={location.lat}
            lng={location.lng}
            title={punto.nombre}
            description={punto.descripcion}
          />
          <ThemedText style={styles.locationSourceText}>
            Fuente de ubicacion: {isResolvingLocation ? 'verificando...' : locationSourceLabel}
          </ThemedText>

          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Informacion adicional
          </ThemedText>
          <ThemedText style={styles.infoItem}>
            Categoria: {punto.categoria}
          </ThemedText>
          <ThemedText style={styles.infoItem}>
            Direccion: {punto.direccion}
          </ThemedText>
          <ThemedText style={styles.infoItem}>
            Horario: {punto.horario}
          </ThemedText>
          <ThemedText style={styles.infoItem}>
            Duracion sugerida: {punto.duracionSugerida}
          </ThemedText>
          <ThemedText style={styles.infoItem}>
            Costo: {punto.costoEntrada}
          </ThemedText>
          <ThemedText style={styles.infoItem}>
            Recomendado para: {punto.recomendadoPara}
          </ThemedText>
          <ThemedText style={styles.infoItem}>
            Servicios: {punto.servicios.join(', ')}
          </ThemedText>

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
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
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
    fontSize: 24,
    color: '#256D85',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#256D85',
    marginBottom: 6,
    marginTop: 6,
  },
  infoItem: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  locationSourceText: {
    fontSize: 13,
    color: '#4F6F7A',
    marginBottom: 10,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
});

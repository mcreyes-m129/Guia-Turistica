import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type PuntoMapProps = {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
};

export function PuntoMap({ lat, lng }: PuntoMapProps) {
  const src = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <View style={styles.webMapFallback}>
      <iframe
        title="Mapa del punto turistico"
        src={src}
        style={styles.mapFrame}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <ThemedText style={styles.webMapText}>Mapa cargado con Google Maps.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapFallback: {
    width: '100%',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#EAF2F6',
    marginBottom: 14,
  },
  mapFrame: {
    width: '100%',
    height: 240,
    border: 'none',
    borderRadius: 10,
    marginBottom: 8,
  },
  webMapText: {
    color: '#274A57',
    fontSize: 14,
  },
});

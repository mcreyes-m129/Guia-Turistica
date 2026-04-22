import MapView, { Marker } from 'react-native-maps';

type PuntoMapProps = {
  lat: number;
  lng: number;
  title: string;
  description: string;
};

export function PuntoMap({ lat, lng, title, description }: PuntoMapProps) {
  return (
    <MapView
      style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 14 }}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}>
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        title={title}
        description={description}
      />
    </MapView>
  );
}

import type { TouristPoint } from '@/services/tourist-points';

type LocationSource = 'google' | 'nominatim' | 'static';

export type ResolvedLocation = {
  lat: number;
  lng: number;
  source: LocationSource;
};

const locationCache = new Map<string, ResolvedLocation>();

function buildLocationQuery(punto: TouristPoint): string {
  return `${punto.nombre}, ${punto.direccion}, Catamarca, Argentina`;
}

async function geocodeWithGoogle(query: string): Promise<ResolvedLocation | null> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&language=es&region=ar`;

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (data?.status !== 'OK' || !Array.isArray(data?.results) || data.results.length === 0) {
    return null;
  }

  const location = data.results[0]?.geometry?.location;
  if (typeof location?.lat !== 'number' || typeof location?.lng !== 'number') {
    return null;
  }

  return {
    lat: location.lat,
    lng: location.lng,
    source: 'google',
  };
}

async function geocodeWithNominatim(query: string): Promise<ResolvedLocation | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const lat = Number(data[0]?.lat);
  const lng = Number(data[0]?.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    source: 'nominatim',
  };
}

export async function resolvePuntoLocation(punto: TouristPoint): Promise<ResolvedLocation> {
  const cached = locationCache.get(punto.id);
  if (cached) {
    return cached;
  }

  const query = buildLocationQuery(punto);

  try {
    const googleLocation = await geocodeWithGoogle(query);
    if (googleLocation) {
      locationCache.set(punto.id, googleLocation);
      return googleLocation;
    }

    const nominatimLocation = await geocodeWithNominatim(query);
    if (nominatimLocation) {
      locationCache.set(punto.id, nominatimLocation);
      return nominatimLocation;
    }
  } catch {
    // If provider calls fail, keep the static fallback location.
  }

  const fallback: ResolvedLocation = {
    lat: punto.ubicacion.lat,
    lng: punto.ubicacion.lng,
    source: 'static',
  };

  locationCache.set(punto.id, fallback);
  return fallback;
}

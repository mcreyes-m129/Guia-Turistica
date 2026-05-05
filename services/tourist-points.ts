import { supabase } from '@/components/constants/supabase';
import { puntosDeInteres, type PuntoInteres } from '@/assets/images/puntos-interes';

export type TouristPoint = PuntoInteres;

type TouristPointRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  address: string | null;
  schedule: string | null;
  recommended_duration: string | null;
  entry_fee: string | null;
  recommended_for: string | null;
  services: string[] | null;
  latitude: number;
  longitude: number;
  image_urls: string[] | null;
};

type TouristPointInput = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  address: string | null;
  schedule: string | null;
  recommended_duration: string | null;
  entry_fee: string | null;
  recommended_for: string | null;
  services: string[];
  latitude: number;
  longitude: number;
  image_urls: string[];
};

function mapRowToPoint(row: TouristPointRow): TouristPoint {
  return {
    id: row.id,
    nombre: row.name,
    descripcion: row.description,
    categoria: row.category,
    direccion: row.address ?? '',
    horario: row.schedule ?? '',
    duracionSugerida: row.recommended_duration ?? '',
    costoEntrada: row.entry_fee ?? '',
    recomendadoPara: row.recommended_for ?? '',
    servicios: row.services ?? [],
    ubicacion: {
      lat: row.latitude,
      lng: row.longitude,
    },
    imagenes: row.image_urls ?? [],
  };
}

function mapPointToInput(point: TouristPoint): TouristPointInput {
  return {
    id: point.id,
    slug: createSlug(point.nombre),
    name: point.nombre,
    description: point.descripcion,
    category: point.categoria,
    address: point.direccion || null,
    schedule: point.horario || null,
    recommended_duration: point.duracionSugerida || null,
    entry_fee: point.costoEntrada || null,
    recommended_for: point.recomendadoPara || null,
    services: point.servicios ?? [],
    latitude: point.ubicacion.lat,
    longitude: point.ubicacion.lng,
    image_urls: point.imagenes ?? [],
  };
}

export function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function fallbackTouristPoints(): TouristPoint[] {
  return puntosDeInteres;
}

export async function loadTouristPoints(): Promise<TouristPoint[]> {
  const { data, error } = await supabase
    .from('tourist_points')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToPoint(row as TouristPointRow));
}

export async function loadTouristPoint(id: string): Promise<TouristPoint | null> {
  const { data, error } = await supabase
    .from('tourist_points')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapRowToPoint(data as TouristPointRow);
}

export async function createTouristPoint(point: TouristPoint): Promise<void> {
  const payload = mapPointToInput(point);

  const { error } = await supabase.from('tourist_points').insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateTouristPoint(point: TouristPoint): Promise<void> {
  const payload = mapPointToInput(point);

  const { error } = await supabase
    .from('tourist_points')
    .update(payload)
    .eq('id', point.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTouristPoint(id: string): Promise<void> {
  const { error } = await supabase.from('tourist_points').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

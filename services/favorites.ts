import type { User } from '@supabase/supabase-js';

const FAVORITES_KEY = 'favorite_point_ids';

export function getFavoritePointIds(user: User | null): string[] {
  const value = user?.user_metadata?.[FAVORITES_KEY];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

export function isFavoritePoint(user: User | null, pointId: string): boolean {
  return getFavoritePointIds(user).includes(pointId);
}

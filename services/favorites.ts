import { supabase } from '@/components/constants/supabase';

type FavoriteRow = {
  point_id: string;
};

export async function loadFavoritePointIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('point_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => (row as FavoriteRow).point_id);
}

export async function addFavoritePoint(userId: string, pointId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, point_id: pointId });

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeFavoritePoint(userId: string, pointId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('point_id', pointId);

  if (error) {
    throw new Error(error.message);
  }
}

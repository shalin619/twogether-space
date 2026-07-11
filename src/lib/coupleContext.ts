import { supabase } from '@/lib/supabase';

export async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getCoupleId(): Promise<string> {
  const userId = await getUserId();
  const { data } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) throw new Error('No couple space found');
  return data.couple_id;
}

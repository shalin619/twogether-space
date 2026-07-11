import { supabase } from '@/lib/supabase';
import { getUserId, getCoupleId } from '@/lib/coupleContext';
import type { Transaction } from '@/data/types';

export async function addTransaction(data: Partial<Transaction>) {
  const userId = await getUserId();
  const coupleId = await getCoupleId();
  const { data: row, error } = await supabase
    .from('transactions')
    .insert({
      ...data,
      couple_id: coupleId,
      owner_id: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return row;
}

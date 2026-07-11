import { supabase } from '@/lib/supabase';
import { getUserId, getCoupleId } from '@/lib/coupleContext';

export interface TransactionInput {
  amount?: number;
  currency?: string;
  category?: string | null;
  note?: string | null;
  occurred_at?: string;
}

export async function addTransaction(data: TransactionInput) {
  const userId = await getUserId();
  const coupleId = await getCoupleId();
  const { data: row, error } = await supabase
    .from('transactions')
    .insert({
      amount: data.amount ?? 0,
      currency: data.currency ?? 'USD',
      category: data.category ?? null,
      note: data.note ?? null,
      occurred_at: data.occurred_at,
      couple_id: coupleId,
      owner_id: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return row;
}

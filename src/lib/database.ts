import { supabase } from './supabase';

// =============================================
// PAYMENT METHODS
// =============================================

const DEFAULT_PAYMENT_METHODS = [
  { name: 'Nakit', color: '#22c55e' },
  { name: 'Kredi Kartı', color: '#3b82f6' },
  { name: 'Yemek Kartı', color: '#f97316' },
];

export async function getUserCategories(userId: string) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from('payment_methods')
        .insert(
          DEFAULT_PAYMENT_METHODS.map((method) => ({
            user_id: userId,
            name: method.name,
            color: method.color,
            is_default: true,
          }))
        );

      if (insertError) throw insertError;

      const { data: seededData, error: seededError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (seededError) throw seededError;
      return { data: seededData, error: null };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Get categories error:', error);
    return { data: null, error: error.message };
  }
}

export async function addCategory(userId: string, name: string, color: string) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({ user_id: userId, name, color, is_default: false })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const { error } = await supabase.from('payment_methods').delete().eq('id', categoryId);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCategory(categoryId: string, updates: object) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// =============================================
// TRANSACTIONS
// =============================================

export async function getUserTransactions(userId: string, type: string | null = null) {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addTransaction(
  userId: string,
  type: string,
  title: string,
  amount: number,
  category: string | null = null,
  expenseType: string | null = null,
  timestamp: string | null = null
) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        title,
        amount,
        category: type === 'expense' ? category : null,
        expense_type: type === 'expense' ? expenseType : null,
        timestamp: timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateTransaction(transactionId: string, updates: object) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function calculateTotals(userId: string) {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);

    if (error) throw error;

    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    return {
      data: { totalIncome, totalExpense, netAmount: totalIncome - totalExpense },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function calculateMonthlyTotals(userId: string) {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const monthlyMap: Record<string, any> = {};
    (transactions || []).forEach((t: any) => {
      const date = new Date(t.timestamp);
      const localDate = new Date(date.getTime() + 3 * 60 * 60000);
      const year = localDate.getUTCFullYear();
      const month = localDate.getUTCMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = { year, month, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyMap[key].income += parseFloat(t.amount);
      } else {
        monthlyMap[key].expense += parseFloat(t.amount);
      }
    });

    const result = Object.values(monthlyMap)
      .map((m: any) => ({
        year: m.year,
        month: m.month,
        net: m.income - m.expense,
        key: `${m.year}-${String(m.month + 1).padStart(2, '0')}`,
      }))
      .sort((a: any, b: any) => b.key.localeCompare(a.key));

    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

// =============================================
// REALTIME
// =============================================

export function subscribeToTransactions(userId: string, callback: () => void) {
  return supabase
    .channel('transactions-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      callback
    )
    .subscribe();
}

export function subscribeToCategories(userId: string, callback: () => void) {
  return supabase
    .channel('categories-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payment_methods', filter: `user_id=eq.${userId}` },
      callback
    )
    .subscribe();
}

export function unsubscribe(subscription: any) {
  if (subscription) supabase.removeChannel(subscription);
}

// =============================================
// IBANS
// =============================================

export async function getUserIbans(userId: string) {
  try {
    const { data, error } = await supabase
      .from('ibans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addIban(userId: string, name: string, bank: string | null, ibanNumber: string) {
  try {
    const { data, error } = await supabase
      .from('ibans')
      .insert({ user_id: userId, name, bank, iban_number: ibanNumber })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateIban(ibanId: string, updates: object) {
  try {
    const { data, error } = await supabase
      .from('ibans')
      .update(updates)
      .eq('id', ibanId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteIban(ibanId: string) {
  try {
    const { error } = await supabase.from('ibans').delete().eq('id', ibanId);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetAllUserData(userId: string) {
  try {
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('payment_methods').delete().eq('user_id', userId);
    await supabase.from('ibans').delete().eq('user_id', userId);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

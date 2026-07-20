import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url!, anonKey!) : null;

export async function fetchSiteContent<T>(): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('vibra_biosite_content')
    .select('content')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data?.content as T;
}

export async function adminLogin(password: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.rpc('vibra_biosite_admin_login', {
    p_password: password,
  });
  if (error) throw error;
  if (!data) throw new Error('Senha incorreta.');
  return String(data);
}

export async function saveSiteContent<T>(token: string, content: T): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.rpc('vibra_biosite_save_content', {
    p_token: token,
    p_content: content,
  });
  if (error) throw error;
}

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url!, anonKey!) : null;

export async function fetchSiteContent<T>(): Promise<T | null> {
  if (!supabase) return null;
  const query = supabase
    .from('vibra_biosite_content')
    .select('content')
    .eq('id', 1)
    .single();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Tempo limite ao carregar conteúdo.')), 7000)
  );

  const { data, error } = await Promise.race([query, timeout]);
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

export async function changeAdminPassword(token: string, newPassword: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.rpc('vibra_biosite_change_password', {
    p_token: token,
    p_new_password: newPassword,
  });
  if (error) throw error;
}

async function optimizeImage(file: File): Promise<{ base64: string; contentType: string; filename: string }> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione uma imagem válida.');
  if (file.size > 10 * 1024 * 1024) throw new Error('A imagem original deve ter no máximo 10 MB.');

  try {
    const bitmap = await createImageBitmap(file);
    const max = 1800;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (blob) {
      const base64 = await blobToDataUrl(blob);
      return {
        base64,
        contentType: 'image/webp',
        filename: file.name.replace(/\.[^.]+$/, '') + '.webp',
      };
    }
  } catch {
    // Fallback para o arquivo original.
  }

  return {
    base64: await blobToDataUrl(file),
    contentType: file.type,
    filename: file.name,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export async function uploadAdminImage(token: string, file: File): Promise<string> {
  if (!url || !anonKey) throw new Error('Supabase não configurado.');
  if (!token) throw new Error('Sessão administrativa inválida.');

  const optimized = await optimizeImage(file);
  const response = await fetch(`${url}/functions/v1/vibra-biosite-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      token,
      filename: optimized.filename,
      contentType: optimized.contentType,
      base64: optimized.base64,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.url) throw new Error(payload?.error || 'Não foi possível enviar a imagem.');
  return String(payload.url);
}

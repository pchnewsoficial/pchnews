import { ENV } from "./_core/env";
import { getSupabaseAdmin, getSupabaseServer } from "./_core/supabase";

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "").replace(/\\/g, "/");
}

function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
  accessToken?: string | null,
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const bytes = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const supabase = accessToken ? getSupabaseServer(accessToken) : getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(ENV.supabaseStorageBucket)
    .upload(key, bytes, { contentType, upsert: false });
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  const { data: publicData } = supabase.storage
    .from(ENV.supabaseStorageBucket)
    .getPublicUrl(key);

  return { key, url: publicData.publicUrl };
}

export async function storageGet(relKey: string) {
  const key = normalizeKey(relKey);
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(ENV.supabaseStorageBucket).getPublicUrl(key);
  return { key, url: data.publicUrl };
}

export async function storageGetSignedUrl(relKey: string) {
  const key = normalizeKey(relKey);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(ENV.supabaseStorageBucket)
    .createSignedUrl(key, 60 * 60);
  if (error) throw new Error(`Supabase Storage signed URL failed: ${error.message}`);
  return data.signedUrl;
}


export async function storageList(prefix = "editorial") {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(ENV.supabaseStorageBucket)
    .list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw new Error(`Supabase Storage list failed: ${error.message}`);
  const rows = (data ?? []).filter((item: any) => item.name && item.id).map((item: any) => {
    const key = `${prefix}/${item.name}`;
    const { data: publicData } = supabase.storage.from(ENV.supabaseStorageBucket).getPublicUrl(key);
    return { id: item.id, name: item.name, key, url: publicData.publicUrl, size: item.metadata?.size ? String(item.metadata.size) : "", createdAt: item.created_at ?? null };
  });
  return rows;
}

export async function storageDelete(relKey: string) {
  const key = normalizeKey(relKey);
  if (!key.startsWith("editorial/")) throw new Error("Só é permitido remover mídia editorial.");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(ENV.supabaseStorageBucket).remove([key]);
  if (error) throw new Error(`Supabase Storage delete failed: ${error.message}`);
  return { success: true, key };
}

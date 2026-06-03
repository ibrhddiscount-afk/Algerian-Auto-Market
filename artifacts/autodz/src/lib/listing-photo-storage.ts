import { getAuthToken } from "@/lib/auth";
import type { CreateListingPhoto } from "@workspace/api-client-react";

const BUCKET_NAME = "listing-photos";
const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateListingPhoto(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return "Format non supporté. Utilisez JPG, PNG, WebP ou GIF.";
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return "Photo trop volumineuse. La taille maximale est de 5 Mo.";
  }

  return null;
}

export function getMaxListingPhotos() {
  return MAX_PHOTOS;
}

function getSupabaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL as string | undefined;
}

function getSupabaseAnonKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${baseName || "photo"}.${extension}`;
}

function createStoragePath(file: File, index: number) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `pending/${randomId}-${index}-${sanitizeFileName(file.name)}`;
}

async function parseStorageError(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  return data?.message ?? data?.error ?? `Supabase Storage a répondu ${response.status}.`;
}

function toFriendlyStorageError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("bucket") && (normalized.includes("not found") || normalized.includes("does not exist"))) {
    return "Le bucket Supabase Storage listing-photos est introuvable. Créez-le ou activez-le avant de publier avec photos.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission") || normalized.includes("unauthorized")) {
    return "Upload refusé par Supabase Storage. Vérifiez les règles du bucket listing-photos.";
  }

  return `Upload photo échoué : ${message}`;
}

export async function uploadListingPhotos(files: File[]): Promise<CreateListingPhoto[]> {
  const supabaseUrl = getSupabaseUrl()?.replace(/\/+$/, "");
  const anonKey = getSupabaseAnonKey();

  if (!files.length) return [];

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase Storage n'est pas configuré côté frontend.");
  }

  const token = getAuthToken() ?? anonKey;

  const uploadedPhotos: CreateListingPhoto[] = [];

  for (const [index, file] of files.entries()) {
    const validationError = validateListingPhoto(file);
    if (validationError) throw new Error(validationError);

    const storagePath = createStoragePath(file, index);
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${encodeURI(storagePath)}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${token}`,
        "content-type": file.type,
        "x-upsert": "false",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(toFriendlyStorageError(await parseStorageError(response)));
    }

    uploadedPhotos.push({
      url: `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${encodeURI(storagePath)}`,
      alt: file.name,
      position: index,
      isPrimary: index === 0,
    });
  }

  return uploadedPhotos;
}

import { supabase } from '@/components/constants/supabase';

type UploadOptions = {
  userId?: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const BUCKET_NAME = 'tourist-points';

function buildFilePath(options: UploadOptions, ext: string): string {
  const prefix = options.userId ?? 'admin';
  const suffix = Math.random().toString(36).slice(2, 9);
  return `${prefix}/${Date.now()}-${suffix}.${ext}`;
}

function resolveExtension(options: UploadOptions): string {
  if (options.fileName?.includes('.')) {
    const ext = options.fileName.split('.').pop();
    if (ext) {
      return ext.toLowerCase();
    }
  }

  if (options.mimeType?.includes('/')) {
    const ext = options.mimeType.split('/').pop();
    if (ext) {
      return ext.toLowerCase();
    }
  }

  return 'jpg';
}

export async function uploadTouristImage(uri: string, options: UploadOptions): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('No se pudo leer la imagen seleccionada.');
  }

  const blob = await response.blob();
  const ext = resolveExtension(options);
  const filePath = buildFilePath(options, ext);

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, blob, {
    contentType: options.mimeType ?? `image/${ext}`,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadTouristImageFile(file: File, options: UploadOptions): Promise<string> {
  const ext = resolveExtension({
    ...options,
    fileName: options.fileName ?? file.name,
    mimeType: options.mimeType ?? file.type,
  });
  const filePath = buildFilePath(options, ext);

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
    contentType: options.mimeType ?? file.type ?? `image/${ext}`,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

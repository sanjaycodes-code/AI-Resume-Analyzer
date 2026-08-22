import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface StorageUploadResult {
  fileUrl: string;
  publicId: string;
}

// Ensure local upload directory exists for development fallback
const localUploadDir = path.resolve(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

// Check if Cloudinary is fully configured
const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    '[Storage Warning] Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.'
  );
  console.warn(`[Storage Warning] Files will be stored locally in: ${localUploadDir}`);
}

export const uploadBuffer = async (
  buffer: Buffer,
  originalFileName: string
): Promise<StorageUploadResult> => {
  const sanitizedBase = path
    .parse(originalFileName)
    .name.replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  const ext = path.extname(originalFileName) || '';
  const uniqueName = `${Date.now()}_${sanitizedBase}${ext}`;

  // 1. Cloudinary Upload Path
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'ai-resume-analyzer/resumes',
          public_id: uniqueName,
        },
        (error, result) => {
          if (error || !result) {
            console.error('[Cloudinary Error]', error);
            return reject(
              ApiError.internal(
                `Failed to upload file to cloud storage: ${error?.message || 'Unknown error'}`,
                'STORAGE_UPLOAD_FAILED'
              )
            );
          }
          resolve({
            fileUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  // 2. Local Fallback Path (with explicit loud warning)
  console.warn(
    `[Storage Warning] Uploading "${originalFileName}" to local fallback storage at: ${localUploadDir}/${uniqueName}`
  );

  const localFilePath = path.join(localUploadDir, uniqueName);
  try {
    await fs.promises.writeFile(localFilePath, buffer);
    const localUrl = `http://localhost:${env.PORT}/uploads/resumes/${uniqueName}`;
    return {
      fileUrl: localUrl,
      publicId: `local_${uniqueName}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw ApiError.internal(
      `Failed to save file to local storage fallback: ${message}`,
      'LOCAL_STORAGE_WRITE_FAILED'
    );
  }
};

export const deleteFile = async (publicId: string): Promise<void> => {
  if (!publicId) return;

  if (publicId.startsWith('local_')) {
    const fileName = publicId.replace('local_', '');
    const localFilePath = path.join(localUploadDir, fileName);
    if (fs.existsSync(localFilePath)) {
      try {
        await fs.promises.unlink(localFilePath);
        console.log(`[Storage] Deleted local fallback file: ${fileName}`);
      } catch (err) {
        console.error(`[Storage Error] Failed to delete local file ${fileName}:`, err);
      }
    }
    return;
  }

  if (isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      console.log(`[Storage] Deleted cloud asset: ${publicId}`);
    } catch (err) {
      console.error(`[Storage Error] Failed to delete Cloudinary asset ${publicId}:`, err);
    }
  }
};

export default {
  uploadBuffer,
  deleteFile,
};

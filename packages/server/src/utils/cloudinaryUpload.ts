import { cloudinary } from '../config/cloudinary';
import { Readable } from 'stream';

interface UploadResult {
  url: string;
  publicId: string;
  size: number;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'skillbridge'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          size: result.bytes,
        });
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

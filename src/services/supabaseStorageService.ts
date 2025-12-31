// src/services/supabaseStorageService.ts
import { supabase } from '../lib/supabaseClient';
import { STORAGE_BUCKETS } from '../utils/constants';
import { validateFile, generateStoragePath } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

export const storageService = {
  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    bucket: keyof typeof STORAGE_BUCKETS,
    file: File,
    userId: string,
    options?: {
      path?: string;
      fileName?: string;
      onProgress?: (progress: number) => void;
    }
  ) {
    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.message || 'Invalid file');
      }
  
      // Generate unique file path
      const fileName = options?.fileName || file.name;
      const filePath = options?.path || generateStoragePath(bucket, userId, fileName); // FIXED: Pass bucket key
  
      // Upload file
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket as keyof typeof STORAGE_BUCKETS])
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
  
      if (error) throw error;
  
      // Get public URL
      const publicUrl = this.getPublicUrl(bucket, filePath);
  
      return {
        path: filePath,
        fileName: fileName,
        size: file.size,
        type: file.type,
        url: publicUrl,
        fullPath: data.fullPath,
        id: data.id,
      };
    } catch (error: any) {
      console.error('Upload file error:', error);
      
      let message = 'Failed to upload file';
      if (error.message.includes('storage quota exceeded')) {
        message = 'Storage quota exceeded. Please contact administrator';
      } else if (error.message.includes('Invalid file type')) {
        message = 'Invalid file type. Please upload an image (JPEG, PNG, WebP)';
      } else if (error.message.includes('File size limit exceeded')) {
        message = 'File too large. Maximum size is 5MB';
      }
      
      throw new Error(message);
    }
  },

  /**
   * Upload case image
   */
  async uploadCaseImage(file: File, userId: string, caseId?: string) {
    try {
      // Generate path with case context
      const fileName = `case-${caseId || uuidv4().substring(0, 8)}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `cases/${userId}/${fileName}`;

      return await this.uploadFile('CASE_IMAGES', file, userId, {
        path: filePath,
        fileName: fileName,
      });
    } catch (error: any) {
      console.error('Upload case image error:', error);
      throw new Error(`Failed to upload case image: ${error.message}`);
    }
  },

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File, userId: string) {
    try {
      // Generate path for profile picture
      const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `avatars/${userId}/${fileName}`;

      return await this.uploadFile('USER_AVATARS', file, userId, {
        path: filePath,
        fileName: fileName,
      });
    } catch (error: any) {
      console.error('Upload profile picture error:', error);
      throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: keyof typeof STORAGE_BUCKETS, path: string) {
    try {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS[bucket as keyof typeof STORAGE_BUCKETS])
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Get public URL error:', error);
      return '';
    }
  },

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: keyof typeof STORAGE_BUCKETS, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket as keyof typeof STORAGE_BUCKETS])
        .remove([path]);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Delete file error:', error);
      throw new Error('Failed to delete file');
    }
  },

  /**
   * Delete case image
   */
  async deleteCaseImage(imageUrl: string) {
    try {
      // Extract path from URL
      const path = this.extractPathFromUrl(imageUrl, STORAGE_BUCKETS.CASE_IMAGES);
      if (!path) {
        console.warn('Could not extract path from URL:', imageUrl);
        return false;
      }

      await this.deleteFile('CASE_IMAGES', path);
      return true;
    } catch (error) {
      console.error('Delete case image error:', error);
      return false;
    }
  },

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(userId: string) {
    try {
      // List all files in user's avatar directory
      const { data: files, error } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_AVATARS)
        .list(`avatars/${userId}`);

      if (error) throw error;

      // Delete all avatar files for this user
      const paths = files.map(file => `avatars/${userId}/${file.name}`);
      if (paths.length > 0) {
        await supabase.storage
          .from(STORAGE_BUCKETS.USER_AVATARS)
          .remove(paths);
      }

      return true;
    } catch (error) {
      console.error('Delete profile picture error:', error);
      return false;
    }
  },

  /**
   * List files in a directory
   */
  async listFiles(bucket: keyof typeof STORAGE_BUCKETS, path: string = '') {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket as keyof typeof STORAGE_BUCKETS])
        .list(path);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  },

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: keyof typeof STORAGE_BUCKETS, path: string) {
    try {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS[bucket as keyof typeof STORAGE_BUCKETS])
        .getPublicUrl(path);

      return {
        publicUrl: data.publicUrl,
        signedUrl: null,
      };
    } catch (error) {
      console.error('Get file metadata error:', error);
      return null;
    }
  },

  /**
   * Download file
   */
  async downloadFile(bucket: keyof typeof STORAGE_BUCKETS, path: string, fileName?: string) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket as keyof typeof STORAGE_BUCKETS])
        .download(path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || path.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error: any) {
      console.error('Download file error:', error);
      throw new Error('Failed to download file');
    }
  },

  /**
   * Extract path from Supabase Storage URL
   */
  extractPathFromUrl(url: string, bucket: string): string | null {
    if (!url) return null;

    try {
      // Remove the base URL part
      const bucketUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
      if (url.includes(bucketUrl)) {
        return url.replace(bucketUrl, '');
      }

      // Try alternative URL format
      const altBucketUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/sign/${bucket}/`;
      if (url.includes(altBucketUrl)) {
        const pathWithToken = url.replace(altBucketUrl, '');
        // Remove token part if present
        return pathWithToken.split('?')[0];
      }

      // If it's already just a path
      if (!url.startsWith('http')) {
        return url;
      }

      return null;
    } catch (error) {
      console.error('Extract path from URL error:', error);
      return null;
    }
  },

  /**
   * Check if file exists
   */
  async fileExists(bucket: keyof typeof STORAGE_BUCKETS, path: string) {
    try {
      const { data } = await supabase.storage
        .from(STORAGE_BUCKETS[bucket as keyof typeof STORAGE_BUCKETS])
        .getPublicUrl(path);

      // Try to fetch the URL to check if file exists
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get storage usage for a user
   */
  async getUserStorageUsage(userId: string) {
    try {
      // Get all files for user across buckets
      const [caseImages, profilePics] = await Promise.all([
        this.listFiles('CASE_IMAGES', `cases/${userId}`),
        this.listFiles('USER_AVATARS', `avatars/${userId}`),
      ]);

      // Calculate total size (note: this doesn't get file sizes directly)
      const totalFiles = [...caseImages, ...profilePics].length;
      
      return {
        totalFiles,
        caseImages: caseImages.length,
        profilePictures: profilePics.length,
        estimatedSize: 'N/A', // Supabase doesn't provide file sizes in list
      };
    } catch (error) {
      console.error('Get storage usage error:', error);
      return {
        totalFiles: 0,
        caseImages: 0,
        profilePictures: 0,
        estimatedSize: 'N/A',
      };
    }
  },

  /**
   * Optimize image before upload (client-side)
   */
  async optimizeImage(file: File, maxWidth: number = 1200): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if larger than max width
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(optimizedFile);
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },
};

export default storageService;

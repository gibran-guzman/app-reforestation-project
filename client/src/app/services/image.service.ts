import { Injectable } from '@angular/core';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1200;
const COMPRESS_QUALITY = 0.8;

@Injectable({ providedIn: 'root' })
export class ImageService {
  validateSize(file: File): string | null {
    if (file.size > MAX_IMAGE_SIZE) {
      return 'La foto no puede superar los 5 MB';
    }
    return null;
  }

  compress(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_IMAGE_WIDTH) {
          height = Math.round(height * MAX_IMAGE_WIDTH / width);
          width = MAX_IMAGE_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Error al obtener contexto del canvas')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Error al comprimir la imagen')); return; }
          const name = file.name.replace(/\.[^.]+$/, '.webp');
          resolve(new File([blob], name, { type: 'image/webp' }));
        }, 'image/webp', COMPRESS_QUALITY);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al cargar la imagen')); };
      img.src = url;
    });
  }

  readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer la imagen'));
      reader.readAsDataURL(file);
    });
  }
}

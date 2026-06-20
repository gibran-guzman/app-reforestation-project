import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateSize', () => {
    it('returns null for small file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(service.validateSize(file)).toBeNull();
    });

    it('returns error for oversized file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      expect(service.validateSize(file)).toContain('5 MB');
    });
  });

  describe('readAsDataUrl', () => {
    it('reads a small file as data URL', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
      const result = await service.readAsDataUrl(file);
      expect(result).toContain('data:');
    });

    it('rejects on FileReader error', async () => {
      spyOn(FileReader.prototype, 'readAsDataURL').and.callFake(function (this: FileReader) {
        setTimeout(() => {
          if (this.onerror) {
            (this.onerror as any)(new ProgressEvent('error'));
          }
        });
      });
      const file = new File(['x'], 'test.txt', { type: 'text/plain' });
      await expectAsync(service.readAsDataUrl(file)).toBeRejectedWithError('Error al leer la imagen');
    });
  });

  describe('compress', () => {
    it('compresses an image file successfully', async () => {
      const onloadFn = jasmine.createSpy('onload');
      const img = { onload: onloadFn, onerror: null, src: '', width: 800, height: 600 } as unknown as HTMLImageElement;
      spyOn(window, 'Image').and.returnValue(img);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock');
      spyOn(window.URL, 'revokeObjectURL');

      const ctx = { drawImage: jasmine.createSpy('drawImage') };
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['compressed'], { type: 'image/webp' })),
      } as unknown as HTMLCanvasElement;
      spyOn(document, 'createElement').and.callFake((tag: string) =>
        tag === 'canvas' ? canvas : document.createElement(tag),
      );

      const file = new File(['fake-image'], 'photo.jpg', { type: 'image/jpeg' });
      const promise = service.compress(file);
      (img as any).onload(new Event('load'));
      const result = await promise;

      expect(result.name).toBe('photo.webp');
      expect(result.type).toBe('image/webp');
      expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0, jasmine.any(Number), jasmine.any(Number));
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    it('rejects on image load error', async () => {
      const img = { onload: null, onerror: jasmine.createSpy('onerror'), src: '' } as unknown as HTMLImageElement;
      spyOn(window, 'Image').and.returnValue(img);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock');
      spyOn(window.URL, 'revokeObjectURL');

      const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
      const promise = service.compress(file);
      (img as any).onerror(new Event('error'));
      await expectAsync(promise).toBeRejectedWithError('Error al cargar la imagen');
    });

    it('compress resizes wide image to 1200px', async () => {
      const img = { onload: null as any, onerror: null, src: '', width: 2000, height: 1500 } as unknown as HTMLImageElement;
      spyOn(window, 'Image').and.returnValue(img);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock');
      spyOn(window.URL, 'revokeObjectURL');
      const ctx = { drawImage: jasmine.createSpy('drawImage') };
      const canvas = { width: 0, height: 0, getContext: () => ctx, toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['compressed'], { type: 'image/webp' })) } as unknown as HTMLCanvasElement;
      spyOn(document, 'createElement').and.callFake((tag: string) => tag === 'canvas' ? canvas : document.createElement(tag));
      const file = new File(['fake-image'], 'photo.jpg', { type: 'image/jpeg' });
      const promise = service.compress(file);
      (img as any).onload(new Event('load'));
      const result = await promise;
      expect(canvas.width).toBe(1200);
      expect(result).toBeDefined();
    });

    it('compress rejects when toBlob returns null', async () => {
      const img = { onload: null as any, onerror: null, src: '', width: 800, height: 600 } as unknown as HTMLImageElement;
      spyOn(window, 'Image').and.returnValue(img);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock');
      spyOn(window.URL, 'revokeObjectURL');
      const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: jasmine.createSpy('drawImage') }), toBlob: (cb: (b: Blob | null) => void) => cb(null) } as unknown as HTMLCanvasElement;
      spyOn(document, 'createElement').and.callFake((tag: string) => tag === 'canvas' ? canvas : document.createElement(tag));
      const file = new File(['fake-image'], 'photo.jpg', { type: 'image/jpeg' });
      const promise = service.compress(file);
      (img as any).onload(new Event('load'));
      await expectAsync(promise).toBeRejectedWithError('Error al comprimir la imagen');
    });
  });
});

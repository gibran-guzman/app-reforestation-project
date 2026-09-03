import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockStorageBucket = {
  upload: vi.fn(),
  createSignedUrl: vi.fn(() => ({ data: { signedUrl: 'https://example.com/signed/photo.jpg?token=abc' }, error: null })),
  remove: vi.fn(),
};

const mockSupabaseClient = {
  storage: {
    listBuckets: vi.fn(),
    createBucket: vi.fn(),
    updateBucket: vi.fn(),
    from: vi.fn(() => mockStorageBucket),
  },
};

const photoService = proxyquire('./photoService', {
  '../config/supabase': { supabase: mockSupabaseClient },
});

describe('photoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureBucket', () => {
    it('creates bucket if it does not exist', async () => {
      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'other-bucket' }],
        error: null,
      });
      mockSupabaseClient.storage.createBucket.mockResolvedValue({ data: {}, error: null });

      await photoService.ensureBucket();
      expect(mockSupabaseClient.storage.createBucket).toHaveBeenCalledWith('planting-photos', {
        public: false,
        fileSizeLimit: 5 * 1024 * 1024,
      });
    });

    it('updates existing bucket to ensure private access', async () => {
      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'planting-photos' }],
        error: null,
      });
      mockSupabaseClient.storage.updateBucket.mockResolvedValue({ data: { message: 'ok' }, error: null });

      await photoService.ensureBucket();
      expect(mockSupabaseClient.storage.createBucket).not.toHaveBeenCalled();
      expect(mockSupabaseClient.storage.updateBucket).toHaveBeenCalledWith('planting-photos', {
        public: false,
        fileSizeLimit: 5 * 1024 * 1024,
      });
    });

    it('throws error if update bucket fails', async () => {
      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'planting-photos' }],
        error: null,
      });
      mockSupabaseClient.storage.updateBucket.mockResolvedValue({
        data: null,
        error: new Error('Permission denied'),
      });

      await expect(photoService.ensureBucket()).rejects.toThrow();
    });

    it('throws error if create bucket fails', async () => {
      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [],
        error: null,
      });
      mockSupabaseClient.storage.createBucket.mockResolvedValue({
        data: null,
        error: new Error('Permission denied'),
      });

      await expect(photoService.ensureBucket()).rejects.toThrow();
    });
  });

  describe('uploadPhoto', () => {
    const mockFile = {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    };

    it('uploads photo and returns filePath', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: {}, error: null });

      const result = await photoService.uploadPhoto(1, mockFile);
      expect(result.filePath).toMatch(/^plantings\/1\//);
      expect(result.publicUrl).toBeUndefined();
      expect(mockStorageBucket.upload).toHaveBeenCalledTimes(1);
    });

    it('uses extension based on mimetype', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: {}, error: null });

      await photoService.uploadPhoto(1, { mimetype: 'image/png', buffer: Buffer.from('png-data') });
      const uploadCall = mockStorageBucket.upload.mock.calls[0][0];
      expect(uploadCall).toMatch(/\.png$/);
    });

    it('rejects unknown mimetype instead of defaulting to webp', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: {}, error: null });

      await expect(
        photoService.uploadPhoto(1, { mimetype: 'image/gif', buffer: Buffer.from('gif-data') }),
      ).rejects.toThrow('Tipo de archivo no permitido');
      expect(mockStorageBucket.upload).not.toHaveBeenCalled();
    });

    it('throws error if storage upload fails', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: null, error: new Error('Storage full') });

      await expect(photoService.uploadPhoto(1, mockFile)).rejects.toThrow();
    });
  });

  describe('getSignedUrl', () => {
    it('returns signed url for a filePath', async () => {
      mockStorageBucket.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/plantings/1/photo.jpg?token=abc' },
        error: null,
      });

      const url = await photoService.getSignedUrl('plantings/1/photo.jpg');

      expect(mockStorageBucket.createSignedUrl).toHaveBeenCalledWith('plantings/1/photo.jpg', 3600);
      expect(url).toBe('https://example.com/signed/plantings/1/photo.jpg?token=abc');
    });

    it('returns null for empty path', async () => {
      const url = await photoService.getSignedUrl(null);
      expect(url).toBeNull();
      expect(mockStorageBucket.createSignedUrl).not.toHaveBeenCalled();
    });

    it('returns null if signing fails', async () => {
      mockStorageBucket.createSignedUrl.mockResolvedValue({ data: null, error: new Error('Sign failed') });

      const url = await photoService.getSignedUrl('plantings/1/photo.jpg');
      expect(url).toBeNull();
    });
  });

  describe('deletePhoto', () => {
    it('deletes a photo by filePath', async () => {
      mockStorageBucket.remove.mockResolvedValue({ data: {}, error: null });

      await photoService.deletePhoto('plantings/1/photo.jpg');

      expect(mockStorageBucket.remove).toHaveBeenCalledWith(['plantings/1/photo.jpg']);
    });

    it('throws on remove error', async () => {
      mockStorageBucket.remove.mockResolvedValue({ data: null, error: new Error('Remove failed') });

      await expect(photoService.deletePhoto('plantings/1/photo.jpg')).rejects.toThrow('Error al limpiar la foto anterior');
    });
  });
});

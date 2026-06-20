import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockStorageBucket = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/photo.jpg' } })),
};

const mockSupabaseClient = {
  storage: {
    listBuckets: vi.fn(),
    createBucket: vi.fn(),
    from: vi.fn(() => mockStorageBucket),
  },
};

const photoService = proxyquire('./photoService', {
  '../config/supabase': mockSupabaseClient,
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
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
    });

    it('does not create bucket if it already exists', async () => {
      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'planting-photos' }],
        error: null,
      });

      await photoService.ensureBucket();
      expect(mockSupabaseClient.storage.createBucket).not.toHaveBeenCalled();
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

    it('uploads photo and returns public url', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: {}, error: null });

      const result = await photoService.uploadPhoto(1, mockFile);
      expect(result).toBe('https://example.com/photo.jpg');
      expect(mockStorageBucket.upload).toHaveBeenCalledTimes(1);
    });

    it('uses extension based on mimetype', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: {}, error: null });

      await photoService.uploadPhoto(1, { mimetype: 'image/png', buffer: Buffer.from('png-data') });
      const uploadCall = mockStorageBucket.upload.mock.calls[0][0];
      expect(uploadCall).toMatch(/\.png$/);
    });

    it('defaults to webp for unknown mimetype', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: {}, error: null });

      await photoService.uploadPhoto(1, { mimetype: 'image/gif', buffer: Buffer.from('gif-data') });
      const uploadCall = mockStorageBucket.upload.mock.calls[0][0];
      expect(uploadCall).toMatch(/\.webp$/);
    });

    it('throws error if storage upload fails', async () => {
      mockStorageBucket.upload.mockResolvedValue({ data: null, error: new Error('Storage full') });

      await expect(photoService.uploadPhoto(1, mockFile)).rejects.toThrow();
    });
  });
});

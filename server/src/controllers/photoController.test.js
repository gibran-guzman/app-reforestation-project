import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockPhotoService = { uploadPhoto: vi.fn() };
const mockPlantingService = { getById: vi.fn(), updatePhotoUrl: vi.fn() };

const controller = proxyquire('./photoController', {
  '../services/photoService': mockPhotoService,
  '../services/plantingService': mockPlantingService,
});

describe('photoController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { params: { id: '1' }, file: null };
    res = { json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('upload', () => {
    it('uploads photo successfully', async () => {
      mockPlantingService.getById.mockResolvedValue({ id: 1 });
      mockPhotoService.uploadPhoto.mockResolvedValue('https://example.com/photo.jpg');
      mockPlantingService.updatePhotoUrl.mockResolvedValue({ id: 1, photo_url: 'https://example.com/photo.jpg' });
      req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };

      await controller.upload(req, res, next);

      expect(mockPhotoService.uploadPhoto).toHaveBeenCalledWith('1', req.file);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Foto subida correctamente',
        data: { photo_url: 'https://example.com/photo.jpg' },
      });
    });

    it('throws error if no file provided', async () => {
      mockPlantingService.getById.mockResolvedValue({ id: 1 });
      req.file = null;

      await controller.upload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('passes error to next if planting does not exist', async () => {
      mockPlantingService.getById.mockRejectedValue(new Error('Not found'));

      await controller.upload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('passes error to next if uploadPhoto fails', async () => {
      mockPlantingService.getById.mockResolvedValue({ id: 1 });
      mockPhotoService.uploadPhoto.mockRejectedValue(new Error('Upload failed'));
      req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };

      await controller.upload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('passes error to next if updatePhotoUrl fails', async () => {
      mockPlantingService.getById.mockResolvedValue({ id: 1 });
      mockPhotoService.uploadPhoto.mockResolvedValue('https://example.com/photo.jpg');
      mockPlantingService.updatePhotoUrl.mockRejectedValue(new Error('Update failed'));
      req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };

      await controller.upload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

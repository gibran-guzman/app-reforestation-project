import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockPhotoService = { uploadPhoto: vi.fn(), deletePhoto: vi.fn() };
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
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('upload', () => {
    it('uploads photo successfully', async () => {
      mockPlantingService.getById.mockResolvedValue({ id: 1 });
      mockPhotoService.uploadPhoto.mockResolvedValue({ publicUrl: 'https://example.com/photo.jpg', filePath: 'plantings/1/photo.jpg' });
      mockPlantingService.updatePhotoUrl.mockResolvedValue({ id: 1, photo_url: 'https://example.com/photo.jpg' });
      req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };

      await controller.upload(req, res, next);

      expect(mockPhotoService.uploadPhoto).toHaveBeenCalledWith(1, req.file);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Foto subida correctamente',
        data: { photo_url: 'https://example.com/photo.jpg' },
      });
    });

    it('throws error if no file provided', async () => {
      req.file = null;

      await controller.upload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(mockPlantingService.getById).not.toHaveBeenCalled();
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

    it('cleans up orphaned photo if updatePhotoUrl fails', async () => {
      mockPlantingService.getById.mockResolvedValue({ id: 1 });
      mockPhotoService.uploadPhoto.mockResolvedValue({ publicUrl: 'https://example.com/photo.jpg', filePath: 'plantings/1/photo.jpg' });
      mockPlantingService.updatePhotoUrl.mockRejectedValue(new Error('Update failed'));
      req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };

      await controller.upload(req, res, next);

      expect(mockPhotoService.deletePhoto).toHaveBeenCalledWith('plantings/1/photo.jpg');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('preserves original error when cleanup fails during rollback', async () => {
      mockPlantingService.getById.mockResolvedValue({ id: 1 });
      mockPhotoService.uploadPhoto.mockResolvedValue({ publicUrl: 'https://example.com/photo.jpg', filePath: 'plantings/1/photo.jpg' });
      mockPlantingService.updatePhotoUrl.mockRejectedValue(new Error('Update failed'));
      mockPhotoService.deletePhoto.mockRejectedValue(new Error('Cleanup failed'));
      req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };

      await controller.upload(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Update failed'));
    });

    it('throws error for invalid id param', async () => {
      req.params.id = 'abc';
      req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };

      await controller.upload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(mockPlantingService.getById).not.toHaveBeenCalled();
    });
  });
});

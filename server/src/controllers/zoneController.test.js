import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockService = { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() };
const controller = proxyquire('./zoneController', {
  '../services/zoneService': mockService,
});

describe('zoneController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, params: {}, query: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('list', () => {
    it('returns zones', async () => {
      mockService.list.mockResolvedValue([{ id: 1, name: 'Zona Norte' }]);

      await controller.list(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1, name: 'Zona Norte' }] });
    });
  });

  describe('getById', () => {
    it('returns zone by id', async () => {
      mockService.getById.mockResolvedValue({ id: 1, name: 'Zona Norte' });
      req.params.id = '1';

      await controller.getById(req, res, next);
      expect(mockService.getById).toHaveBeenCalledWith(1);
    });

    it('rejects non-numeric id', async () => {
      req.params.id = 'abc';

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(mockService.getById).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('creates and returns 201', async () => {
      mockService.create.mockResolvedValue({ id: 1, name: 'Zona Nueva' });
      req.body = { name: 'Zona Nueva' };

      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('updates zone', async () => {
      mockService.update.mockResolvedValue({ id: 1, name: 'Actualizada' });
      req.params.id = '1';
      req.body = { name: 'Actualizada' };

      await controller.update(req, res, next);
      expect(mockService.update).toHaveBeenCalledWith(1, { name: 'Actualizada' });
    });

    it('rejects non-numeric id on update', async () => {
      req.params.id = 'abc';

      await controller.update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(mockService.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes zone', async () => {
      mockService.remove.mockResolvedValue(undefined);
      req.params.id = '1';

      await controller.remove(req, res, next);
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });

    it('rejects non-numeric id on remove', async () => {
      req.params.id = 'abc';

      await controller.remove(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(mockService.remove).not.toHaveBeenCalled();
    });
  });

  describe('error paths', () => {
    it('passes list error to next', async () => {
      const error = new Error('List failed');
      mockService.list.mockRejectedValue(error);

      await controller.list(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getById error to next', async () => {
      const error = new Error('Get by id failed');
      mockService.getById.mockRejectedValue(error);
      req.params.id = '1';

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes create error to next', async () => {
      const error = new Error('Create failed');
      mockService.create.mockRejectedValue(error);

      await controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes update error to next', async () => {
      const error = new Error('Update failed');
      mockService.update.mockRejectedValue(error);
      req.params.id = '1';

      await controller.update(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes remove error to next', async () => {
      const error = new Error('Remove failed');
      mockService.remove.mockRejectedValue(error);
      req.params.id = '1';

      await controller.remove(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

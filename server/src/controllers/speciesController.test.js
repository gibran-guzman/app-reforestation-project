import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockService = { createSpecies: vi.fn(), list: vi.fn(), getById: vi.fn(), update: vi.fn(), remove: vi.fn() };
const controller = proxyquire('./speciesController', {
  '../services/speciesService': mockService,
});

describe('speciesController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, params: {}, query: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('createSpecies', () => {
    it('creates and returns 201', async () => {
      mockService.createSpecies.mockResolvedValue({ message: 'Creada', data: { id: 1 } });
      req.body = { scientific_name: 'Test', common_name: 'Test' };

      await controller.createSpecies(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Creada', data: { id: 1 } });
    });
  });

  describe('list', () => {
    it('returns list of species', async () => {
      mockService.list.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);

      await controller.list(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1, common_name: 'Cedro' }] });
    });
  });

  describe('getById', () => {
    it('returns species by id', async () => {
      mockService.getById.mockResolvedValue({ id: 1, common_name: 'Cedro' });
      req.params.id = '1';

      await controller.getById(req, res, next);

      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ data: { id: 1, common_name: 'Cedro' } });
    });
  });

  describe('update', () => {
    it('updates and returns', async () => {
      mockService.update.mockResolvedValue({ id: 1, common_name: 'Actualizado' });
      req.params.id = '1';
      req.body = { common_name: 'Actualizado' };

      await controller.update(req, res, next);

      expect(mockService.update).toHaveBeenCalledWith(1, { common_name: 'Actualizado' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Especie actualizada correctamente' }));
    });
  });

  describe('remove', () => {
    it('removes and returns message', async () => {
      mockService.remove.mockResolvedValue(undefined);
      req.params.id = '1';

      await controller.remove(req, res, next);

      expect(mockService.remove).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Especie eliminada correctamente' });
    });
  });

  describe('error paths', () => {
    it('passes createSpecies error to next', async () => {
      const error = new Error('Create failed');
      mockService.createSpecies.mockRejectedValue(error);

      await controller.createSpecies(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

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

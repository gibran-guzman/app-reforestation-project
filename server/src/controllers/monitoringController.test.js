import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockService = { create: vi.fn(), getByPlantingSiteId: vi.fn(), getById: vi.fn() };
const controller = proxyquire('./monitoringController', {
  '../services/monitoringService': mockService,
});

describe('monitoringController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, params: {}, user: { id: 'user-123' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('create', () => {
    it('creates monitoring record and returns 201', async () => {
      mockService.create.mockResolvedValue({ id: 1, survival_status: 'alive' });
      req.body = { planting_site_id: 1, survival_status: 'alive' };

      await controller.create(req, res, next);

      expect(mockService.create).toHaveBeenCalledWith(req.body, 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getByPlantingSiteId', () => {
    it('returns monitoring history with pagination', async () => {
      mockService.getByPlantingSiteId.mockResolvedValue({ rows: [{ id: 1, survival_status: 'alive' }], total: 1 });
      req.params.plantingSiteId = '1';
      req.query = {};

      await controller.getByPlantingSiteId(req, res, next);

      expect(mockService.getByPlantingSiteId).toHaveBeenCalledWith(1, 1, 50);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ id: 1, survival_status: 'alive' }],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });
    });

    it('respects page and limit query params', async () => {
      mockService.getByPlantingSiteId.mockResolvedValue({ rows: [], total: 0 });
      req.params.plantingSiteId = '1';
      req.query = { page: '3', limit: '20' };

      await controller.getByPlantingSiteId(req, res, next);

      expect(mockService.getByPlantingSiteId).toHaveBeenCalledWith(1, 3, 20);
    });

    it('caps limit at MAX_PAGE_SIZE', async () => {
      mockService.getByPlantingSiteId.mockResolvedValue({ rows: [], total: 0 });
      req.params.plantingSiteId = '1';
      req.query = { page: '1', limit: '500' };

      await controller.getByPlantingSiteId(req, res, next);

      expect(mockService.getByPlantingSiteId).toHaveBeenCalledWith(1, 1, 100);
    });

    it('caps page at MAX_PAGE', async () => {
      mockService.getByPlantingSiteId.mockResolvedValue({ rows: [], total: 0 });
      req.params.plantingSiteId = '1';
      req.query = { page: '999999999', limit: '10' };

      await controller.getByPlantingSiteId(req, res, next);

      expect(mockService.getByPlantingSiteId).toHaveBeenCalledWith(1, 100000, 10);
    });
  });

  describe('getById', () => {
    it('returns record by id', async () => {
      mockService.getById.mockResolvedValue({ id: 1, survival_status: 'alive' });
      req.params.id = '1';

      await controller.getById(req, res, next);

      expect(mockService.getById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ data: { id: 1, survival_status: 'alive' } });
    });

    it('rejects non-numeric id', async () => {
      req.params.id = 'abc';

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(mockService.getById).not.toHaveBeenCalled();
    });
  });

  describe('error paths', () => {
    it('passes create error to next', async () => {
      const error = new Error('Create failed');
      mockService.create.mockRejectedValue(error);

      await controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getByPlantingSiteId error to next', async () => {
      const error = new Error('Get history failed');
      mockService.getByPlantingSiteId.mockRejectedValue(error);
      req.params.plantingSiteId = '1';
      req.query = {};

      await controller.getByPlantingSiteId(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getById error to next', async () => {
      const error = new Error('Get by id failed');
      mockService.getById.mockRejectedValue(error);
      req.params.id = '1';

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

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
    it('returns monitoring history', async () => {
      mockService.getByPlantingSiteId.mockResolvedValue([{ id: 1, survival_status: 'alive' }]);
      req.params.plantingSiteId = '1';

      await controller.getByPlantingSiteId(req, res, next);

      expect(mockService.getByPlantingSiteId).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1, survival_status: 'alive' }] });
    });
  });

  describe('getById', () => {
    it('returns record by id', async () => {
      mockService.getById.mockResolvedValue({ id: 1, survival_status: 'alive' });
      req.params.id = '1';

      await controller.getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { id: 1, survival_status: 'alive' } });
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

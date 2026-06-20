import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockService = { create: vi.fn(), getAll: vi.fn(), getById: vi.fn(), syncBatch: vi.fn(), getGeoJson: vi.fn() };
const controller = proxyquire('./plantingController', {
  '../services/plantingService': mockService,
});

describe('plantingController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, params: {}, query: {}, user: { id: 'user-123' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('create', () => {
    it('creates planting and returns 201', async () => {
      mockService.create.mockResolvedValue({ id: 1 });
      req.body = { zone_id: 1, species_id: 1, location: { lat: -0.229, lng: -78.524 } };

      await controller.create(req, res, next);

      expect(mockService.create).toHaveBeenCalledWith(req.body, 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getAll', () => {
    it('returns paginated plantings', async () => {
      mockService.getAll.mockResolvedValue({ rows: [{ id: 1 }], total: 1 });
      req.query = { page: '1', limit: '50', zone_id: '2' };

      await controller.getAll(req, res, next);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 50, { zone_id: 2 });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [{ id: 1 }],
        meta: expect.objectContaining({ page: 1, total: 1 }),
      }));
    });

    it('uses default pagination values', async () => {
      mockService.getAll.mockResolvedValue({ rows: [], total: 0 });
      req.query = {};

      await controller.getAll(req, res, next);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 50, {});
    });

    it('applies maximum limit of 100', async () => {
      mockService.getAll.mockResolvedValue({ rows: [], total: 0 });
      req.query = { limit: '999' };

      await controller.getAll(req, res, next);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 100, {});
    });

    it('ensures minimum page is 1', async () => {
      mockService.getAll.mockResolvedValue({ rows: [], total: 0 });
      req.query = { page: '-5' };

      await controller.getAll(req, res, next);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 50, {});
    });

    it('filters by species_id, from, and to', async () => {
      mockService.getAll.mockResolvedValue({ rows: [], total: 0 });
      req.query = { species_id: '3', from: '2026-01-01', to: '2026-12-31' };

      await controller.getAll(req, res, next);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 50, { species_id: 3, from: '2026-01-01', to: '2026-12-31' });
    });
  });

  describe('getById', () => {
    it('returns planting by id', async () => {
      mockService.getById.mockResolvedValue({ id: 1, species_name: 'Cedro' });
      req.params.id = '1';

      await controller.getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { id: 1, species_name: 'Cedro' } });
    });
  });

  describe('getGeoJson', () => {
    it('returns geojson', async () => {
      mockService.getGeoJson.mockResolvedValue({ type: 'FeatureCollection', features: [] });
      req.query = { zone_id: '1' };

      await controller.getGeoJson(req, res, next);

      expect(mockService.getGeoJson).toHaveBeenCalledWith({ zone_id: 1 });
      expect(res.json).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [] });
    });

    it('filters by species_id, from, and to', async () => {
      mockService.getGeoJson.mockResolvedValue({ type: 'FeatureCollection', features: [] });
      req.query = { species_id: '3', from: '2026-06-01', to: '2026-06-30' };

      await controller.getGeoJson(req, res, next);

      expect(mockService.getGeoJson).toHaveBeenCalledWith({ species_id: 3, from: '2026-06-01', to: '2026-06-30' });
    });
  });

  describe('syncBatch', () => {
    it('syncs batch successfully', async () => {
      mockService.syncBatch.mockResolvedValue([{ index: 0, status: 'success' }]);
      req.body = { items: [{ zone_id: 1, species_id: 1, location: { lat: -0.229, lng: -78.524 } }] };

      await controller.syncBatch(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: [{ index: 0, status: 'success' }] });
    });

    it('returns 400 if items is not an array', async () => {
      req.body = { items: 'not-array' };

      await controller.syncBatch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('items') });
    });

    it('returns 400 if items is empty', async () => {
      req.body = { items: [] };

      await controller.syncBatch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('error paths', () => {
    it('passes create error to next', async () => {
      const error = new Error('Create failed');
      mockService.create.mockRejectedValue(error);

      await controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getAll error to next', async () => {
      const error = new Error('Get all failed');
      mockService.getAll.mockRejectedValue(error);

      await controller.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getById error to next', async () => {
      const error = new Error('Get by id failed');
      mockService.getById.mockRejectedValue(error);
      req.params.id = '1';

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getGeoJson error to next', async () => {
      const error = new Error('GeoJSON failed');
      mockService.getGeoJson.mockRejectedValue(error);

      await controller.getGeoJson(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes syncBatch error to next', async () => {
      const error = new Error('Sync failed');
      mockService.syncBatch.mockRejectedValue(error);
      req.body = { items: [{ zone_id: 1 }] };

      await controller.syncBatch(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

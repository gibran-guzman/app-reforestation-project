import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockPlantingRepository = {
  create: vi.fn(), findAll: vi.fn(), findById: vi.fn(),
  findByConflictKey: vi.fn(), update: vi.fn(), isPointInZone: vi.fn(),
  updatePhotoUrl: vi.fn(), findGeoJson: vi.fn(),
};
const mockSpeciesRepository = { findById: vi.fn(), findByIds: vi.fn() };
const mockZoneRepository = { findById: vi.fn(), findByIds: vi.fn() };
const mockMonitoringRepository = { create: vi.fn() };

const plantingService = proxyquire('./plantingService', {
  '../repositories/plantingRepository': mockPlantingRepository,
  '../repositories/speciesRepository': mockSpeciesRepository,
  '../repositories/zoneRepository': mockZoneRepository,
  '../repositories/monitoringRepository': mockMonitoringRepository,
});

describe('plantingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const validPayload = {
      zone_id: 1,
      species_id: 1,
      location: { lat: -0.229, lng: -78.524 },
      planted_at: '2026-06-01',
      initial_survival_status: 'alive',
    };

    it('creates a planting successfully', async () => {
      mockZoneRepository.findById.mockResolvedValue({ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } });
      mockSpeciesRepository.findById.mockResolvedValue({ id: 1, common_name: 'Cedro' });
      mockPlantingRepository.isPointInZone.mockResolvedValue(true);
      mockPlantingRepository.create.mockResolvedValue({ id: 10, zone_id: 1, species_id: 1 });

      const result = await plantingService.create(validPayload, 'user-123');
      expect(result.id).toBe(10);
      expect(mockPlantingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ planted_by: 'user-123' }),
      );
      expect(mockMonitoringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ planting_site_id: 10, survival_status: 'alive' }),
      );
    });

    it('throws not found if zone does not exist', async () => {
      mockZoneRepository.findById.mockResolvedValue(null);
      mockSpeciesRepository.findById.mockResolvedValue({ id: 1, common_name: 'Cedro' });

      await expect(plantingService.create(validPayload, 'user-123')).rejects.toThrow();
      expect(mockPlantingRepository.isPointInZone).not.toHaveBeenCalled();
    });

    it('throws not found if species does not exist', async () => {
      mockZoneRepository.findById.mockResolvedValue({ id: 1, name: 'Zona Norte' });
      mockSpeciesRepository.findById.mockResolvedValue(null);

      await expect(plantingService.create(validPayload, 'user-123')).rejects.toThrow();
      expect(mockPlantingRepository.isPointInZone).not.toHaveBeenCalled();
    });

    it('throws validation error if point is outside zone', async () => {
      mockZoneRepository.findById.mockResolvedValue({ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } });
      mockSpeciesRepository.findById.mockResolvedValue({ id: 1, common_name: 'Cedro' });
      mockPlantingRepository.isPointInZone.mockResolvedValue(false);

      await expect(plantingService.create(validPayload, 'user-123')).rejects.toThrow();
      expect(mockPlantingRepository.create).not.toHaveBeenCalled();
    });

  });

  describe('getAll', () => {
    it('returns paginated plantings', async () => {
      mockPlantingRepository.findAll.mockResolvedValue({
        rows: [{ id: 1, species_name: 'Cedro' }],
        total: 1,
      });

      const result = await plantingService.getAll(1, 50, {});
      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('passes filters to repository', async () => {
      mockPlantingRepository.findAll.mockResolvedValue({ rows: [], total: 0 });

      await plantingService.getAll(1, 10, { zone_id: 2, species_id: 3 });
      expect(mockPlantingRepository.findAll).toHaveBeenCalledWith(1, 10, { zone_id: 2, species_id: 3 });
    });
  });

  describe('getById', () => {
    it('returns a planting by id', async () => {
      mockPlantingRepository.findById.mockResolvedValue({ id: 1, species_name: 'Cedro' });

      const result = await plantingService.getById(1);
      expect(result.id).toBe(1);
    });

    it('throws not found if it does not exist', async () => {
      mockPlantingRepository.findById.mockResolvedValue(null);

      await expect(plantingService.getById(999)).rejects.toThrow();
    });
  });

  describe('updatePhotoUrl', () => {
    it('updates photo url', async () => {
      mockPlantingRepository.findById.mockResolvedValue({ id: 1 });
      mockPlantingRepository.updatePhotoUrl.mockResolvedValue({ id: 1, photo_url: 'https://example.com/photo.jpg' });

      const result = await plantingService.updatePhotoUrl(1, 'https://example.com/photo.jpg');
      expect(result.photo_url).toBe('https://example.com/photo.jpg');
    });

    it('throws not found if planting does not exist', async () => {
      mockPlantingRepository.updatePhotoUrl.mockResolvedValue(null);

      await expect(plantingService.updatePhotoUrl(999, 'url')).rejects.toThrow();
    });
  });

  describe('getGeoJson', () => {
    it('returns geojson of plantings', async () => {
      const mockGeoJson = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: {}, properties: {} }],
      };
      mockPlantingRepository.findGeoJson.mockResolvedValue(mockGeoJson);

      const result = await plantingService.getGeoJson({ zone_id: 1 });
      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
    });
  });

  describe('syncBatch', () => {
    const validItem = {
      zone_id: 1,
      species_id: 1,
      location: { lat: -0.229, lng: -78.524 },
      planted_at: '2026-06-01',
    };

    it('syncs a complete batch successfully', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockResolvedValue(true);
      mockPlantingRepository.create.mockResolvedValue({ id: 10, ...validItem });

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('success');
    });

    it('resolves conflicts with last writer wins (atomic upsert)', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockResolvedValue(true);
      mockPlantingRepository.create.mockRejectedValue({ code: '23505' });
      mockPlantingRepository.findByConflictKey.mockResolvedValue({ id: 5, planted_by: 'user-123' });
      mockPlantingRepository.update.mockResolvedValue({ id: 5, ...validItem });

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('success');
      expect(results[0].conflict).toBe('resolved');
      expect(results[0].data.id).toBe(5);
    });

    it('reports error if conflicting record belongs to another user', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockResolvedValue(true);
      mockPlantingRepository.create.mockRejectedValue({ code: '23505' });
      mockPlantingRepository.findByConflictKey.mockResolvedValue({ id: 5, planted_by: 'other-user' });

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].error).toContain('El registro en conflicto pertenece a otro usuario');
    });

    it('reports error if zone does not exist in batch', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([]);

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].error).toContain('Zona');
    });

    it('reports error if species does not exist in batch', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([]);

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].error).toContain('Especie');
    });

    it('reports error if point is outside zone in batch', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockResolvedValue(false);

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].error).toContain('coordenadas');
    });

    it('processes a batch with valid and invalid items', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockResolvedValue(true);
      mockPlantingRepository.create.mockResolvedValue({ id: 10 });

      const items = [validItem, { ...validItem, zone_id: 999 }, validItem];
      const results = await plantingService.syncBatch(items, 'user-123');

      expect(results[0].status).toBe('success');
      expect(results[1].status).toBe('error');
      expect(results[2].status).toBe('success');
    });

    it('handles non-unique-violation error during create', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockResolvedValue(true);
      mockPlantingRepository.create.mockRejectedValue(new Error('DB constraint error'));

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].error).toContain('DB constraint error');
    });

    it('handles pre-fetch errors', async () => {
      mockZoneRepository.findByIds.mockRejectedValue(new Error('DB crash'));

      await expect(plantingService.syncBatch([validItem], 'user-123')).rejects.toThrow('DB crash');
    });

    it('catches unexpected errors thrown during item processing', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockRejectedValue(new Error('DB connection lost'));

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].error).toBe('Error al validar la ubicación contra la zona de intervención');
    });

    it('uses fallback message when error has no message property', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);
      mockPlantingRepository.isPointInZone.mockRejectedValue({ code: 500 });

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].error).toBe('Error al validar la ubicación contra la zona de intervención');
    });

    it('handles rejected promise via allSettled fallback', async () => {
      mockZoneRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Zona Norte', geometry: { type: 'Polygon', coordinates: [[[-78.6, -0.3], [-78.5, -0.3], [-78.5, -0.2], [-78.6, -0.2], [-78.6, -0.3]]] } }]);
      mockSpeciesRepository.findByIds.mockResolvedValue([{ id: 1, common_name: 'Cedro' }]);

      const allSettledSpy = vi.spyOn(Promise, 'allSettled');
      allSettledSpy.mockResolvedValueOnce([
        { status: 'rejected', reason: new Error('Unexpected') },
      ]);

      const results = await plantingService.syncBatch([validItem], 'user-123');
      expect(results[0].status).toBe('error');
      expect(results[0].index).toBe(0);
      expect(results[0].error).toContain('Error interno');

      allSettledSpy.mockRestore();
    });
  });
});

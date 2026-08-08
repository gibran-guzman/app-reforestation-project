import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockMonitoringRepository = { create: vi.fn(), findByPlantingSiteId: vi.fn(), findById: vi.fn() };
const mockPlantingRepository = { findById: vi.fn() };

const monitoringService = proxyquire('./monitoringService', {
  '../repositories/monitoringRepository': mockMonitoringRepository,
  '../repositories/plantingRepository': mockPlantingRepository,
  '../utils/signPhoto': {
    signPhotoRow: vi.fn(async (row) => row),
    signPhotoRows: vi.fn(async (rows) => rows),
  },
});

describe('monitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const validData = {
      planting_site_id: 1,
      survival_status: 'alive',
      ph: 6.5,
      humidity: 45,
    };

    it('creates a monitoring record successfully', async () => {
      mockPlantingRepository.findById.mockResolvedValue({ id: 1, species_name: 'Cedro' });
      mockMonitoringRepository.create.mockResolvedValue({ id: 5, ...validData, monitored_by: 'user-123' });

      const result = await monitoringService.create(validData, 'user-123');
      expect(result.id).toBe(5);
      expect(mockMonitoringRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ monitored_by: 'user-123' }),
      );
    });

    it('throws not found if planting does not exist', async () => {
      mockPlantingRepository.findById.mockResolvedValue(null);

      await expect(monitoringService.create(validData, 'user-123')).rejects.toThrow();
      expect(mockMonitoringRepository.create).not.toHaveBeenCalled();
    });

  });

  describe('getByPlantingSiteId', () => {
    it('returns monitoring history with pagination', async () => {
      mockPlantingRepository.findById.mockResolvedValue({ id: 1 });
      mockMonitoringRepository.findByPlantingSiteId.mockResolvedValue({
        rows: [
          { id: 1, survival_status: 'alive', visit_date: '2026-06-15' },
          { id: 2, survival_status: 'dead', visit_date: '2026-07-01' },
        ],
        total: 2,
      });

      const result = await monitoringService.getByPlantingSiteId(1, 1, 50);
      expect(result).toEqual({
        rows: [
          { id: 1, survival_status: 'alive', visit_date: '2026-06-15' },
          { id: 2, survival_status: 'dead', visit_date: '2026-07-01' },
        ],
        total: 2,
      });
      expect(mockMonitoringRepository.findByPlantingSiteId).toHaveBeenCalledWith(1, 1, 50);
    });

    it('returns empty list if no monitoring records', async () => {
      mockPlantingRepository.findById.mockResolvedValue({ id: 1 });
      mockMonitoringRepository.findByPlantingSiteId.mockResolvedValue({ rows: [], total: 0 });

      const result = await monitoringService.getByPlantingSiteId(1);
      expect(result).toEqual({ rows: [], total: 0 });
    });

    it('throws not found if planting does not exist', async () => {
      mockPlantingRepository.findById.mockResolvedValue(null);

      await expect(monitoringService.getByPlantingSiteId(999)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('returns a record by id', async () => {
      mockMonitoringRepository.findById.mockResolvedValue({ id: 1, survival_status: 'alive' });

      const result = await monitoringService.getById(1);
      expect(result.id).toBe(1);
    });

    it('throws not found if it does not exist', async () => {
      mockMonitoringRepository.findById.mockResolvedValue(null);

      await expect(monitoringService.getById(999)).rejects.toThrow();
    });
  });
});

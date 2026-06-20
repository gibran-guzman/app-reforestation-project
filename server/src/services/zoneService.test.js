import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockZoneRepository = { findAll: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() };

const zoneService = proxyquire('./zoneService', {
  '../repositories/zoneRepository': mockZoneRepository,
});

describe('zoneService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns a list of zones', async () => {
      mockZoneRepository.findAll.mockResolvedValue([
        { id: 1, name: 'Zona Norte' },
        { id: 2, name: 'Zona Sur' },
      ]);

      const result = await zoneService.list();
      expect(result).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('returns a zone by id', async () => {
      mockZoneRepository.findById.mockResolvedValue({ id: 1, name: 'Zona Norte' });

      const result = await zoneService.getById(1);
      expect(result.name).toBe('Zona Norte');
    });

    it('throws not found if it does not exist', async () => {
      mockZoneRepository.findById.mockResolvedValue(null);
      await expect(zoneService.getById(999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates a zone successfully', async () => {
      const zoneData = { name: 'Zona Test', description: 'Descripción' };
      mockZoneRepository.create.mockResolvedValue({ id: 1, ...zoneData });

      const result = await zoneService.create(zoneData);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Zona Test');
    });

    it('throws error with invalid data', async () => {
      await expect(zoneService.create({ name: '' })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates a zone successfully', async () => {
      mockZoneRepository.findById.mockResolvedValue({ id: 1, name: 'Zona Norte' });
      mockZoneRepository.update.mockResolvedValue({ id: 1, name: 'Zona Norte Actualizada' });

      const result = await zoneService.update(1, { name: 'Zona Norte Actualizada' });
      expect(result.name).toBe('Zona Norte Actualizada');
    });

    it('throws not found if it does not exist', async () => {
      mockZoneRepository.findById.mockResolvedValue(null);
      await expect(zoneService.update(999, { name: 'Test' })).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('removes a zone successfully', async () => {
      mockZoneRepository.findById.mockResolvedValue({ id: 1 });
      mockZoneRepository.remove.mockResolvedValue({ id: 1 });

      await expect(zoneService.remove(1)).resolves.toBeUndefined();
    });

    it('throws not found if it does not exist', async () => {
      mockZoneRepository.findById.mockResolvedValue(null);
      await expect(zoneService.remove(999)).rejects.toThrow();
    });
  });
});

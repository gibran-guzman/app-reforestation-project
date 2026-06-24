import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockSpeciesRepository = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), update: vi.fn(), remove: vi.fn() };

const speciesService = proxyquire('./speciesService', {
  '../repositories/speciesRepository': mockSpeciesRepository,
});

describe('speciesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSpecies', () => {
    const newSpecies = {
      scientific_name: 'Cedrela odorata',
      common_name: 'Cedro',
    };

    it('creates a species successfully', async () => {
      mockSpeciesRepository.create.mockResolvedValue({ id: 1, ...newSpecies });

      const result = await speciesService.createSpecies(newSpecies);
      expect(result.id).toBe(1);
      expect(result.scientific_name).toBe('Cedrela odorata');
    });

    it('throws conflict error if scientific name is duplicated', async () => {
      mockSpeciesRepository.create.mockRejectedValue({ code: '23505' });

      await expect(speciesService.createSpecies(newSpecies)).rejects.toThrow();
    });

    it('throws validation error for not null violation (code 23502)', async () => {
      const dbError = { code: '23502', column: 'scientific_name' };
      mockSpeciesRepository.create.mockRejectedValue(dbError);

      try {
        await speciesService.createSpecies(newSpecies);
      } catch (err) {
        expect(err.status).toBe(400);
      }
    });

    it('throws raw error for unknown error code', async () => {
      const dbError = new Error('Unknown DB error');
      mockSpeciesRepository.create.mockRejectedValue(dbError);

      await expect(speciesService.createSpecies(newSpecies)).rejects.toThrow('Unknown DB error');
    });
  });

  describe('list', () => {
    it('returns a list of species', async () => {
      const mockSpecies = [
        { id: 1, scientific_name: 'Cedrela odorata', common_name: 'Cedro' },
        { id: 2, scientific_name: 'Pinus radiata', common_name: 'Pino' },
      ];
      mockSpeciesRepository.findAll.mockResolvedValue(mockSpecies);

      const result = await speciesService.list();
      expect(result).toHaveLength(2);
      expect(result[0].common_name).toBe('Cedro');
    });

    it('returns empty list if no species', async () => {
      mockSpeciesRepository.findAll.mockResolvedValue([]);
      const result = await speciesService.list();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns a species by id', async () => {
      mockSpeciesRepository.findById.mockResolvedValue({ id: 1, common_name: 'Cedro' });

      const result = await speciesService.getById(1);
      expect(result.id).toBe(1);
    });

    it('throws not found if it does not exist', async () => {
      mockSpeciesRepository.findById.mockResolvedValue(null);

      await expect(speciesService.getById(999)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates a species successfully', async () => {
      mockSpeciesRepository.update.mockResolvedValue({ id: 1, common_name: 'Cedro rojo' });

      const result = await speciesService.update(1, { common_name: 'Cedro rojo' });
      expect(result.common_name).toBe('Cedro rojo');
    });

    it('throws not found if species does not exist', async () => {
      mockSpeciesRepository.update.mockResolvedValue(null);

      await expect(speciesService.update(999, { common_name: 'Test' })).rejects.toThrow();
    });

    it('throws conflict on unique violation during update', async () => {
      mockSpeciesRepository.update.mockRejectedValue({ code: '23505' });

      await expect(speciesService.update(1, { scientific_name: 'Duplicate' })).rejects.toThrow();
    });

    it('throws validation on not null violation during update', async () => {
      mockSpeciesRepository.update.mockRejectedValue({ code: '23502', column: 'scientific_name' });

      try {
        await speciesService.update(1, { common_name: 'Test' });
      } catch (err) {
        expect(err.status).toBe(400);
      }
    });

    it('re-throws unknown error during update', async () => {
      mockSpeciesRepository.update.mockRejectedValue(new Error('DB error'));

      await expect(speciesService.update(1, { common_name: 'Test' })).rejects.toThrow('DB error');
    });

  });

  describe('remove', () => {
    it('removes a species successfully', async () => {
      mockSpeciesRepository.remove.mockResolvedValue({ id: 1 });

      await expect(speciesService.remove(1)).resolves.toBeUndefined();
    });

    it('throws not found if it does not exist', async () => {
      mockSpeciesRepository.remove.mockResolvedValue(null);

      await expect(speciesService.remove(999)).rejects.toThrow();
    });
  });
});

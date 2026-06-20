import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const plantingRepository = proxyquire('./plantingRepository', {
  '../config/db': mockDb,
});

const fakeColumnsRow = {
  id: 1, zone_id: 10, species_id: 20, location: { type: 'Point', coordinates: [-78.524, -0.229] }, planted_at: '2026-06-01', planted_by: 'user-1', initial_ph: 6.5, initial_humidity: 70, initial_soil_texture: 'loam', photo_url: null, created_at: new Date(),
};

describe('plantingRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('inserts and returns the created planting site', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeColumnsRow] });

      const data = { zone_id: 10, species_id: 20, location: { lng: -78.524, lat: -0.229 }, planted_at: '2026-06-01', planted_by: 'user-1', initial_ph: 6.5, initial_humidity: 70, initial_soil_texture: 'loam' };
      const result = await plantingRepository.create(data);

      expect(result).toEqual(fakeColumnsRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO planting_sites'),
        [10, 20, -78.524, -0.229, '2026-06-01', 'user-1', 6.5, 70, 'loam'],
      );
    });
  });

  describe('findById', () => {
    it('returns the planting site with joins when found', async () => {
      const row = { ...fakeColumnsRow, species_name: 'Oak', zone_name: 'Zone A' };
      mockDb.query.mockResolvedValue({ rows: [row] });

      const result = await plantingRepository.findById(1);

      expect(result).toEqual(row);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM planting_sites ps'),
        [1],
      );
    });

    it('returns null when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await plantingRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByConflictKey', () => {
    it('returns matching site when found', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeColumnsRow] });

      const result = await plantingRepository.findByConflictKey(10, 20, '2026-06-01', 'user-1');

      expect(result).toEqual(fakeColumnsRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('zone_id = $1 AND species_id = $2'),
        [10, 20, '2026-06-01', 'user-1'],
      );
    });

    it('returns null when no conflict', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await plantingRepository.findByConflictKey(10, 20, '2026-06-01', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates specified fields and returns updated record', async () => {
      const updatedRow = { ...fakeColumnsRow, initial_ph: 7 };
      mockDb.query.mockResolvedValue({ rows: [updatedRow] });

      const result = await plantingRepository.update(1, { initial_ph: 7 });

      expect(result).toEqual(updatedRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE planting_sites'),
        [7, 1],
      );
    });

    it('updates initial_humidity and initial_soil_texture', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ ...fakeColumnsRow }] });

      await plantingRepository.update(1, { initial_humidity: 80, initial_soil_texture: 'clay' });

      const params = mockDb.query.mock.calls[0][1];
      expect(params).toContain(80);
      expect(params).toContain('clay');
    });

    it('updates location', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ ...fakeColumnsRow }] });

      await plantingRepository.update(1, { location: { lng: -78.5, lat: -0.2 } });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ST_SetSRID(ST_MakePoint'),
        [-78.5, -0.2, 1],
      );
    });

    it('returns existing record when no fields to update', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeColumnsRow] });

      const result = await plantingRepository.update(1, {});

      expect(result).toEqual(fakeColumnsRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1],
      );
    });
  });

  describe('isPointInZone', () => {
    it('returns true when point is valid', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ valid: true }] });

      const result = await plantingRepository.isPointInZone(-0.229, -78.524, 1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT is_point_in_zone($1, $2, $3) AS valid',
        [-78.524, -0.229, 1],
      );
    });

    it('returns false when point is invalid', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ valid: false }] });

      const result = await plantingRepository.isPointInZone(-0.229, -78.524, 1);

      expect(result).toBe(false);
    });

    it('returns false when result is missing', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await plantingRepository.isPointInZone(-0.229, -78.524, 1);

      expect(result).toBe(false);
    });

    it('returns false when valid is null', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ valid: null }] });

      const result = await plantingRepository.isPointInZone(-0.229, -78.524, 1);

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('returns paginated results with count', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [fakeColumnsRow, fakeColumnsRow, fakeColumnsRow] });

      const result = await plantingRepository.findAll(1, 50);

      expect(result.total).toBe(3);
      expect(result.rows).toHaveLength(3);
    });

    it('applies filters to count and data queries', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await plantingRepository.findAll(1, 10, { zone_id: 5, species_id: 3, from: '2026-01-01', to: '2026-12-31' });

      expect(mockDb.query.mock.calls[0][0]).toContain('ps.zone_id = $1');
      expect(mockDb.query.mock.calls[0][0]).toContain('ps.species_id = $2');
      expect(mockDb.query.mock.calls[0][1]).toEqual([5, 3, '2026-01-01', '2026-12-31']);
    });

    it('handles empty result set', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await plantingRepository.findAll(1, 50);

      expect(result.total).toBe(0);
      expect(result.rows).toEqual([]);
    });

    it('uses default pagination values', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [fakeColumnsRow] });

      const result = await plantingRepository.findAll();

      expect(result.rows).toHaveLength(1);
      expect(mockDb.query.mock.calls[1][0]).toContain('LIMIT $1 OFFSET $2');
      expect(mockDb.query.mock.calls[1][1]).toContain(50);
      expect(mockDb.query.mock.calls[1][1]).toContain(0);
    });
  });

  describe('findGeoJson', () => {
    it('returns FeatureCollection with features', async () => {
      const dbRow = {
        id: 1, geometry: { type: 'Point', coordinates: [-78.524, -0.229] }, properties: { planting_id: 1, species_name: 'Oak', survival_status: 'alive' },
      };
      mockDb.query.mockResolvedValue({ rows: [dbRow] });

      const result = await plantingRepository.findGeoJson();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      expect(result.features[0].type).toBe('Feature');
      expect(result.features[0].geometry).toEqual(dbRow.geometry);
      expect(result.features[0].properties).toEqual(dbRow.properties);
    });

    it('applies filters', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await plantingRepository.findGeoJson({ zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-12-31' });

      const call = mockDb.query.mock.calls[0];
      expect(call[0]).toContain('ps.zone_id = $1');
      expect(call[0]).toContain('ps.species_id = $2');
      expect(call[0]).toContain('ps.planted_at >= $3');
      expect(call[0]).toContain('ps.planted_at <= $4');
      expect(call[1]).toEqual([1, 2, '2026-01-01', '2026-12-31', 100000]);
    });

    it('returns empty features array when no data', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await plantingRepository.findGeoJson();

      expect(result.features).toEqual([]);
    });

    it('handles partial filters', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await plantingRepository.findGeoJson({ zone_id: 1 });

      expect(mockDb.query.mock.calls[0][1]).toEqual([1, 100000]);
      expect(mockDb.query.mock.calls[0][0]).toContain('ps.zone_id = $1');
      expect(mockDb.query.mock.calls[0][0]).not.toContain('ps.species_id =');
    });
  });

  describe('updatePhotoUrl', () => {
    it('updates photo_url and returns the row', async () => {
      const updated = { ...fakeColumnsRow, photo_url: 'http://example.com/photo.jpg' };
      mockDb.query.mockResolvedValue({ rows: [updated] });

      const result = await plantingRepository.updatePhotoUrl(1, 'http://example.com/photo.jpg');

      expect(result).toEqual(updated);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE planting_sites SET photo_url'),
        ['http://example.com/photo.jpg', 1],
      );
    });
  });
});

const SOIL_TEXTURES = [
  { value: 'sandy', label: 'Arenoso' },
  { value: 'loamy', label: 'Franco' },
  { value: 'clay', label: 'Arcilloso' },
  { value: 'silty', label: 'Limoso' },
  { value: 'peaty', label: 'Turboso' },
  { value: 'chalky', label: 'Calcáreo' },
];

const SOIL_TEXTURE_VALUES = SOIL_TEXTURES.map(t => t.value);

const ALLOWED_ROLES = ['admin', 'technician'];

const MAX_LIST_LIMIT = 1000;

const MAX_HEATMAP_POINTS = 100000;

const MAX_GEOJSON_FEATURES = 100000;

const MAX_REPORT_LIMIT = 10000;

const MAX_BATCH_ITEMS = 500;

const CONCURRENCY_LIMIT = 10;

const DEFAULT_PAGE = 1;

const DEFAULT_PAGE_SIZE = 50;

const MAX_PAGE_SIZE = 100;

const REQUEST_BODY_LIMIT = '1mb';

const FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PHOTO_BUCKET = 'planting-photos';

module.exports = {
  SOIL_TEXTURES,
  SOIL_TEXTURE_VALUES,
  ALLOWED_ROLES,
  MAX_LIST_LIMIT,
  MAX_HEATMAP_POINTS,
  MAX_GEOJSON_FEATURES,
  MAX_REPORT_LIMIT,
  MAX_BATCH_ITEMS,
  CONCURRENCY_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  REQUEST_BODY_LIMIT,
  FILE_SIZE_LIMIT_BYTES,
  ALLOWED_MIME_TYPES,
  PHOTO_BUCKET,
};

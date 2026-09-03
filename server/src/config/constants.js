const SOIL_TEXTURES = [
  { value: 'sandy', label: 'Arenoso' },
  { value: 'loamy', label: 'Franco' },
  { value: 'clay', label: 'Arcilloso' },
  { value: 'silty', label: 'Limoso' },
  { value: 'peaty', label: 'Turboso' },
  { value: 'chalky', label: 'Calcáreo' },
];

const SOIL_TEXTURE_VALUES = SOIL_TEXTURES.map(t => t.value);

const SURVIVAL_STATUS_VALUES = ['alive', 'struggling', 'dead'];
const SURVIVAL_STATUS_LABELS = [
  { value: 'alive', label: 'Viva' },
  { value: 'struggling', label: 'Estresada' },
  { value: 'dead', label: 'Muerta' },
];

const VIGOR_VALUES = ['high', 'medium', 'low'];
const VIGOR_LABELS = [
  { value: 'high', label: 'Alto' },
  { value: 'medium', label: 'Medio' },
  { value: 'low', label: 'Bajo' },
];

const ALLOWED_ROLES = ['admin', 'technician'];
const ROLE_LABELS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'technician', label: 'Técnico' },
];

const MAX_LIST_LIMIT = 1000;

const MAX_GEOJSON_FEATURES = 100000;

const MAX_REPORT_LIMIT = 10000;

const MAX_BATCH_ITEMS = 500;

const CONCURRENCY_LIMIT = 10;

const DEFAULT_PAGE = 1;

const MAX_PAGE = 100000;

const DEFAULT_PAGE_SIZE = 50;

const MAX_PAGE_SIZE = 100;

const REQUEST_BODY_LIMIT = '1mb';

const FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PHOTO_BUCKET = 'planting-photos';

const MAX_NOTE_LENGTH = 2000;

const MAX_DESCRIPTION_LENGTH = 2000;

const MAX_SCIENTIFIC_NAME_LENGTH = 500;

const MAX_COMMON_NAME_LENGTH = 300;

const MAX_FULL_NAME_LENGTH = 300;

const MAX_ZONE_NAME_LENGTH = 255;

const MAX_SOIL_TYPE_LENGTH = 200;

const MAX_PASSWORD_LENGTH = 128;

module.exports = {
  SOIL_TEXTURES,
  SOIL_TEXTURE_VALUES,
  SURVIVAL_STATUS_VALUES,
  SURVIVAL_STATUS_LABELS,
  VIGOR_VALUES,
  VIGOR_LABELS,
  ALLOWED_ROLES,
  ROLE_LABELS,
  MAX_LIST_LIMIT,
  MAX_GEOJSON_FEATURES,
  MAX_REPORT_LIMIT,
  MAX_BATCH_ITEMS,
  CONCURRENCY_LIMIT,
  DEFAULT_PAGE,
  MAX_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  REQUEST_BODY_LIMIT,
  FILE_SIZE_LIMIT_BYTES,
  ALLOWED_MIME_TYPES,
  PHOTO_BUCKET,
  MAX_NOTE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_SCIENTIFIC_NAME_LENGTH,
  MAX_COMMON_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_ZONE_NAME_LENGTH,
  MAX_SOIL_TYPE_LENGTH,
  MAX_PASSWORD_LENGTH,
};

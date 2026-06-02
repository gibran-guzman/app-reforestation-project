const SOIL_TEXTURES = [
  { value: 'sandy', label: 'Arenoso' },
  { value: 'loamy', label: 'Franco' },
  { value: 'clay', label: 'Arcilloso' },
  { value: 'silty', label: 'Limoso' },
  { value: 'peaty', label: 'Turboso' },
  { value: 'chalky', label: 'Calcáreo' },
];

const SOIL_TEXTURE_VALUES = SOIL_TEXTURES.map(t => t.value);

module.exports = { SOIL_TEXTURES, SOIL_TEXTURE_VALUES };

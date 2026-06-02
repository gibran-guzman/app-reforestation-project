const analyticsRepository = require('../repositories/analyticsRepository');

const getHeatmap = async (filters = {}) => {
  const points = await analyticsRepository.getHeatmapData(filters);

  const filtered = points.filter((p) => p.weight !== null);

  if (filters.interval) {
    const groups = {};
    for (const p of filtered) {
      const d = new Date(p.planted_at);
      let key;
      if (filters.interval === 'year') key = d.getFullYear().toString();
      else if (filters.interval === 'quarter') key = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
      else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[key]) groups[key] = [];
      groups[key].push({ lat: p.lat, lng: p.lng, weight: p.weight });
    }

    const periods = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, data]) => ({ label, data }));

    return { periods, total: filtered.length };
  }

  return {
    periods: [{ label: 'general', data: filtered.map((p) => ({ lat: p.lat, lng: p.lng, weight: p.weight })) }],
    total: filtered.length,
  };
};

module.exports = { getHeatmap };

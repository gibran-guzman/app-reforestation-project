const analyticsRepository = require('../repositories/analyticsRepository');

const getHeatmap = async (filters = {}) => {
  const points = await analyticsRepository.getHeatmapData(filters);

  const grouped = points.reduce(
    (acc, p) => {
      if (p.weight !== null) {
        const key = filters.interval ? p.period_label : 'general';
        if (!acc.groups[key]) acc.groups[key] = [];
        acc.groups[key].push({ lat: p.lat, lng: p.lng, weight: p.weight });
      }
      return acc;
    },
    { groups: {}, total: 0 }
  );

  const total = Object.values(grouped.groups).reduce((sum, arr) => sum + arr.length, 0);

  const periods = Object.entries(grouped.groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({ label, data }));

  return { periods, total };
};

module.exports = { getHeatmap };

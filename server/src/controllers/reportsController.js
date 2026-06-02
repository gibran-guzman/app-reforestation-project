const reportsService = require('../services/reportsService');
const { validateReportFilters } = require('../validators/reportsValidator');

const parseFilters = (query) => {
  const filters = {};
  if (query.zone_id) filters.zone_id = parseInt(query.zone_id, 10);
  if (query.species_id) filters.species_id = parseInt(query.species_id, 10);
  if (query.from) filters.from = query.from;
  if (query.to) filters.to = query.to;
  return filters;
};

const getSurvivalRate = async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    validateReportFilters(filters);
    const result = await reportsService.getSurvivalRate(filters);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

const getSpeciesStats = async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    validateReportFilters(filters);
    const result = await reportsService.getSpeciesStats(filters);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

const getZoneSummary = async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    validateReportFilters(filters);
    const result = await reportsService.getZoneSummary(filters);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

const exportPdf = async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    validateReportFilters(filters);
    const pdfBuffer = await reportsService.generatePdf(filters);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reporte-plantaciones-${Date.now()}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSurvivalRate, getSpeciesStats, getZoneSummary, exportPdf };

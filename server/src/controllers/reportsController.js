const reportsService = require('../services/reportsService');
const { respond } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @description All handlers in this controller expect `req.filters` to be populated
 * by the `parseFilters` middleware in `reportsRoutes.js`. That middleware runs
 * `parseQueryFilters(req.query)` + `validateReportFilters()` before reaching
 * these handlers. Without that middleware, `req.filters` will be undefined.
 */

const getSurvivalRate = asyncHandler(async (req, res) => {
  const result = await reportsService.getSurvivalRate(req.filters);
  respond(res, result);
});

const getSpeciesStats = asyncHandler(async (req, res) => {
  const result = await reportsService.getSpeciesStats(req.filters);
  respond(res, result);
});

const getZoneSummary = asyncHandler(async (req, res) => {
  const result = await reportsService.getZoneSummary(req.filters);
  respond(res, result);
});

const exportPdf = asyncHandler(async (req, res) => {
  const pdfBuffer = await reportsService.generatePdf(req.filters);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=reporte-plantaciones-${Date.now()}.pdf`,
    'Content-Length': pdfBuffer.length,
  });
  res.send(pdfBuffer);
});

const getPlantingEvolution = asyncHandler(async (req, res) => {
  const result = await reportsService.getPlantingEvolution(req.filters);
  respond(res, result);
});

module.exports = { getSurvivalRate, getSpeciesStats, getZoneSummary, exportPdf, getPlantingEvolution };

const reportsService = require('../services/reportsService');
const asyncHandler = require('../utils/asyncHandler');

const getSurvivalRate = asyncHandler(async (req, res) => {
  const result = await reportsService.getSurvivalRate(req.filters);
  res.json({ data: result });
});

const getSpeciesStats = asyncHandler(async (req, res) => {
  const result = await reportsService.getSpeciesStats(req.filters);
  res.json({ data: result });
});

const getZoneSummary = asyncHandler(async (req, res) => {
  const result = await reportsService.getZoneSummary(req.filters);
  res.json({ data: result });
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
  res.json({ data: result });
});

module.exports = { getSurvivalRate, getSpeciesStats, getZoneSummary, exportPdf, getPlantingEvolution };

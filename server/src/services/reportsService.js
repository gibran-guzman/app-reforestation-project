const reportsRepository = require('../repositories/reportsRepository');
const PDFDocument = require('pdfkit');

const getSurvivalRate = async (filters = {}) => {
  const [overall, bySpecies, byZone] = await Promise.all([
    reportsRepository.getSurvivalRate(filters),
    reportsRepository.getSurvivalRateBySpecies(filters),
    reportsRepository.getSurvivalRateByZone(filters),
  ]);

  return { overall, bySpecies, byZone };
};

const generatePdf = async (filters = {}) => {
  const data = await reportsRepository.getAllPlantingsForReport(filters);
  const overall = await reportsRepository.getSurvivalRate(filters);

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const buffers = [];

  doc.on('data', (chunk) => buffers.push(chunk));

  const font = 'Helvetica';
  const bold = 'Helvetica-Bold';
  const pageWidth = doc.page.width - 100;
  const startX = 50;

  const addFooter = () => {
    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(range.start + i);
      doc.fontSize(7).font(font).fillColor('#999');
      doc.text(
        `GAD Municipal de Lloa — Página ${i + 1} de ${pageCount}`,
        startX,
        doc.page.height - 40,
        { align: 'center', width: pageWidth }
      );
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' })}`,
        startX,
        doc.page.height - 30,
        { align: 'center', width: pageWidth }
      );
      doc.fillColor('#000');
    }
  };

  const addHeader = () => {
    doc.fontSize(14).font(bold).fillColor('#2d6a4f')
      .text('GOBIERNO AUTÓNOMO DESCENTRALIZADO MUNICIPAL DE LLOA', { align: 'center' })
      .fillColor('#000');
    doc.moveDown(0.3);
    doc.fontSize(22).font(bold).text('Programa Lloa Reforestación', { align: 'center' });
    doc.fontSize(10).font(font).fillColor('#666')
      .text('Informe de Plantaciones y Monitoreo', { align: 'center' })
      .moveDown(0.3)
      .text(`Generado el ${new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' })}`, { align: 'center' })
      .fillColor('#000');
    doc.moveDown(1.5);
  };

  const addSummaryTable = () => {
    doc.fontSize(14).font(bold).text('Resumen General', { underline: true });
    doc.moveDown(0.5);

    const totals = [
      { label: 'Total plantaciones', value: overall.total },
      { label: 'Monitoreadas', value: overall.monitored },
      { label: 'Vivas', value: overall.alive },
      { label: 'Estresadas', value: overall.struggling },
      { label: 'Muertas', value: overall.dead },
      { label: 'Sin monitoreo', value: overall.unmonitored },
    ];

    doc.fontSize(10).font(font);
    totals.forEach((t) => {
      doc.text(`${t.label}: ${t.value}`, { indent: 20 });
    });
    doc.moveDown(1);
  };

  const addBarChart = () => {
    if (overall.monitored === 0) return;

    doc.fontSize(14).font(bold).text('Distribución de Supervivencia', { underline: true });
    doc.moveDown(0.8);

    const chartY = doc.y;
    const barWidth = 60;
    const barGap = 30;
    const maxBarHeight = 100;
    const maxValue = Math.max(overall.alive, overall.struggling, overall.dead, 1);

    const bars = [
      { label: 'Vivas', value: overall.alive, color: '#2d6a4f' },
      { label: 'Estresadas', value: overall.struggling, color: '#e9c46a' },
      { label: 'Muertas', value: overall.dead, color: '#d62828' },
    ];

    bars.forEach((bar, i) => {
      const x = startX + i * (barWidth + barGap);
      const barH = (bar.value / maxValue) * maxBarHeight;
      const barY = chartY + (maxBarHeight - barH);

      doc.rect(x, barY, barWidth, barH).fill(bar.color);
      doc.fillColor('#000').fontSize(9).font(bold)
        .text(String(bar.value), x, barY - 12, { width: barWidth, align: 'center' });
      doc.fontSize(8).font(font).fillColor('#666')
        .text(bar.label, x, chartY + maxBarHeight + 4, { width: barWidth, align: 'center' });
    });

    doc.fillColor('#000');
    doc.moveDown(3);
  };

  const addDetailTable = () => {
    if (data.length === 0) {
      doc.fontSize(10).font(font).text('No hay registros para mostrar.');
      return;
    }

    doc.fontSize(14).font(bold).text('Detalle de Plantaciones', { underline: true });
    doc.moveDown(0.5);

    const columns = [
      { header: 'ID', width: 30 },
      { header: 'Especie', width: 100 },
      { header: 'Zona', width: 100 },
      { header: 'Fecha', width: 80 },
      { header: 'Estado', width: 70 },
      { header: 'pH', width: 40 },
    ];

    let y = doc.y;
    doc.fontSize(8).font(bold);
    let x = startX;
    columns.forEach((col) => {
      doc.text(col.header, x, y, { width: col.width, align: 'left' });
      x += col.width;
    });

    doc.moveDown(0.3);
    doc.fontSize(7).font(font);
    y = doc.y;

    for (const row of data) {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      x = startX;
      const status = row.survival_status || '—';
      doc.text(String(row.id), x, y, { width: 30 });
      x += 30;
      doc.text(row.species_name || '—', x, y, { width: 100 });
      x += 100;
      doc.text(row.zone_name || '—', x, y, { width: 100 });
      x += 100;
      doc.text(row.planted_at ? new Date(row.planted_at).toLocaleDateString() : '—', x, y, { width: 80 });
      x += 80;
      doc.text(status, x, y, { width: 70 });
      x += 70;
      doc.text(row.initial_ph != null ? String(row.initial_ph) : '—', x, y, { width: 40 });

      y += 14;
    }
  };

  addHeader();
  addSummaryTable();
  addBarChart();
  addDetailTable();

  addFooter();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.end();
  });
};

const getSpeciesStats = async (filters = {}) => {
  return reportsRepository.getSurvivalRateBySpecies(filters);
};

const getZoneSummary = async (filters = {}) => {
  return reportsRepository.getSurvivalRateByZone(filters);
};

const getPlantingEvolution = async (filters = {}) => {
  return reportsRepository.getPlantingEvolution(filters);
};

module.exports = { getSurvivalRate, getSpeciesStats, getZoneSummary, generatePdf, getPlantingEvolution };

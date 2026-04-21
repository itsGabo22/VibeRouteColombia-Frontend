import { jsPDF } from 'jspdf';

export const generateDailyReportPdf = (stats: any, financials: any, ranking: any[]): Blob => {
  const doc = new jsPDF();
  
  // Título principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Reporte de Operación Logística - VibeRoute', 20, 25);
  
  // Fecha de generación
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateStr = new Date().toLocaleString('es-CO', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  doc.text(`Fecha de emisión: ${dateStr}`, 20, 35);
  
  // Línea divisoria
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(20, 42, 190, 42);

  // 1. Resumen Financiero
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Resumen Financiero', 20, 55);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Ingresos Totales (Revenue): $${financials?.totalRevenue?.toLocaleString() || 0}`, 25, 65);
  doc.text(`Gastos Operativos (Costos Transporte): $${financials?.operationalCosts?.toLocaleString() || 0}`, 25, 75);
  
  // Destacar utilidad
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`Utilidad Neta: $${financials?.netProfit?.toLocaleString() || 0}`, 25, 87);
  doc.text(`Margen de Ganancia: ${financials?.profitMarginPercentage || 0}%`, 25, 97);
  doc.setTextColor(15, 23, 42);

  // 2. Resumen de Entregas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text('2. Resumen de Entregas', 20, 115);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Entregas Exitosas Hoy: ${stats?.today || 0}`, 25, 125);
  doc.text(`Entregas Exitosas Semana: ${stats?.thisWeek || 0}`, 25, 135);
  doc.text(`Entregas Exitosas Mes: ${stats?.thisMonth || 0}`, 25, 145);

  // 3. Top Operadores (Ranking)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text('3. Desempeño Top 5 Conductores', 20, 165);
  
  doc.setFont("helvetica", "normal");
  let y = 175;
  if (ranking && ranking.length > 0) {
    ranking.forEach((driver: any, idx: number) => {
      doc.setFontSize(11);
      doc.text(`${idx + 1}. ${driver.driverName} - ${driver.successfulDeliveries} entregas (Eficiencia: ${driver.effectivenessPercentage}%) | ${driver.efficiencyTag}`, 25, y);
      y += 10;
    });
  } else {
    doc.setFontSize(11);
    doc.text('No hay datos suficientes de operadores activos en este periodo.', 25, y);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Documento clasificado. Generado automáticamente por VibeRoute Intelligence Colombia.', 20, 280);

  // Convertimos a Blob para poder enviarlo por HTTP form-data
  return doc.output('blob');
};

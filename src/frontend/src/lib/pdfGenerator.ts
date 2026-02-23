import { ControlCalidad, Defecto, Empacador } from '../backend';
import { formatDateUTC3 } from './utc3';

interface PDFReportData {
  fecha: string;
  controles: (ControlCalidad & { empacadorInfo: Empacador; controladorNombre: string })[];
  totalMuestras: number;
  totalFrutasAfectadas: number;
  totalFrutasSinDefectos: number;
  porcentajeDefectos: string;
  porcentajeSinDefectos: string;
  dentroRangoPesoCount: number;
  fueraRangoPesoCount: number;
  porcentajeDentroRangoPeso: string;
  porcentajeFueraRangoPeso: string;
  defectosPorTipo: Record<Defecto, number>;
  defectoLabels: Record<Defecto, string>;
}

export async function generateDailyReportPDF(data: PDFReportData): Promise<void> {
  const fechaFormateada = formatDateUTC3(BigInt(Math.floor(new Date(data.fecha).getTime() / 1000)));
  const fileName = `Reporte_Diario_${data.fecha.replace(/-/g, '_')}`;
  
  // Create HTML content for the report
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${fileName}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #000;
          background: #fff;
          padding: 20px;
          max-width: 210mm;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #BFA76F;
          padding-bottom: 15px;
        }
        
        .header h1 {
          color: #BFA76F;
          font-size: 24px;
          margin: 0 0 10px 0;
          font-weight: bold;
        }
        
        .header h2 {
          color: #000;
          font-size: 18px;
          margin: 0 0 8px 0;
          font-weight: 600;
        }
        
        .header p {
          color: #6B7280;
          font-size: 14px;
          margin: 0;
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section-title {
          background-color: #BFA76F;
          color: #fff;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        
        .section-title-light {
          background-color: #E5E5E5;
          color: #000;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 15px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 12px;
        }
        
        .stat-label {
          font-weight: bold;
        }
        
        .stat-value {
          font-weight: normal;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 10px;
        }
        
        table thead {
          background-color: #BFA76F;
          color: #fff;
        }
        
        table th {
          padding: 8px 6px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #BFA76F;
        }
        
        table td {
          padding: 6px 6px;
          border: 1px solid #E5E5E5;
        }
        
        table tbody tr:nth-child(even) {
          background-color: #FAFAFA;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #E5E5E5;
          text-align: center;
          font-size: 10px;
          color: #6B7280;
        }
        
        .no-defects {
          font-style: italic;
          color: #6B7280;
          font-size: 12px;
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #BFA76F;
          color: #fff;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 1000;
        }
        
        .print-button:hover {
          background-color: #A89560;
        }
        
        .print-instructions {
          position: fixed;
          top: 70px;
          right: 20px;
          background-color: #FFF9E6;
          border: 1px solid #BFA76F;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          max-width: 250px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        
        .print-instructions strong {
          display: block;
          margin-bottom: 6px;
          color: #BFA76F;
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
      
      <div class="print-instructions no-print">
        <strong>Instrucciones:</strong>
        1. Haga clic en el botón "Imprimir"<br>
        2. Seleccione "Guardar como PDF" como destino<br>
        3. Haga clic en "Guardar"
      </div>
      
      <div class="header">
        <h1>Rimonim Control de Calidad</h1>
        <h2>Reporte Diario - Variedad Wonderful</h2>
        <p>Fecha del Reporte: ${fechaFormateada} (UTC-3)</p>
      </div>
      
      <div class="section">
        <div class="section-title">Resumen General</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total de Muestras:</span>
            <span class="stat-value">${data.controles.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de Frutas:</span>
            <span class="stat-value">${data.totalMuestras}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Frutas Afectadas:</span>
            <span class="stat-value">${data.totalFrutasAfectadas}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Frutas Sin Defectos:</span>
            <span class="stat-value">${data.totalFrutasSinDefectos}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">% Defectos:</span>
            <span class="stat-value">${data.porcentajeDefectos}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">% Sin Defectos:</span>
            <span class="stat-value">${data.porcentajeSinDefectos}%</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title-light">Estadísticas de Rango de Peso</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Dentro del Rango:</span>
            <span class="stat-value">${data.dentroRangoPesoCount} (${data.porcentajeDentroRangoPeso}%)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Fuera del Rango:</span>
            <span class="stat-value">${data.fueraRangoPesoCount} (${data.porcentajeFueraRangoPeso}%)</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title-light">Defectos por Tipo</div>
        ${Object.entries(data.defectosPorTipo).filter(([, count]) => count > 0).length > 0 ? `
          <div class="stats-grid">
            ${Object.entries(data.defectosPorTipo)
              .filter(([, count]) => count > 0)
              .map(([defecto, count]) => `
                <div class="stat-item">
                  <span class="stat-label">${data.defectoLabels[defecto as Defecto]}:</span>
                  <span class="stat-value">${count}</span>
                </div>
              `).join('')}
          </div>
        ` : '<p class="no-defects">No se registraron defectos</p>'}
      </div>
      
      <div class="section">
        <div class="section-title">Detalle de Controles Registrados</div>
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Hora</th>
              <th style="width: 18%;">Empacador</th>
              <th style="width: 18%;">Controlador</th>
              <th style="width: 10%;">Muestras</th>
              <th style="width: 10%;">Peso OK</th>
              <th style="width: 32%;">Defectos Principales</th>
            </tr>
          </thead>
          <tbody>
            ${data.controles.map(control => {
              const empacador = control.empacadorInfo.identificador;
              const controlador = control.controladorNombre;
              const hora = control.lote;
              const muestras = Number(control.cantidadMuestras);
              const rangoPeso = control.dentroRangoPeso ? 'Sí' : 'No';
              const defectosStr = control.defectos && control.defectos.length > 0
                ? control.defectos
                    .slice(0, 2)
                    .map(d => `${data.defectoLabels[d.defecto]}: ${Number(d.cantidad)}`)
                    .join(', ')
                : 'Sin defectos';
              
              return `
                <tr>
                  <td>${hora}</td>
                  <td>${empacador}</td>
                  <td>${controlador}</td>
                  <td>${muestras}</td>
                  <td>${rangoPeso}</td>
                  <td>${defectosStr}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>© 2025 Rimonim Control de Calidad</p>
        <p>Generado el ${new Date().toLocaleString('es-ES', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
      </div>
    </body>
    </html>
  `;
  
  // Open the HTML in a new window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
      }, 250);
    };
  } else {
    throw new Error('No se pudo abrir la ventana de impresión. Por favor, permita ventanas emergentes.');
  }
}

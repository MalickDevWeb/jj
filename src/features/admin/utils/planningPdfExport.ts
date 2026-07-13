import { jsPDF } from 'jspdf';
import { addEcole221Footer, addEcole221Header, ECOLE_221_PALETTE } from '@/shared/lib/pdfTheme';
import { CalendarSlot, DAYS, SLOTS } from '../domain/PlanningModels';

export async function exportPlanningToPDF(
  slots: CalendarSlot[],
  viewMode: 'classe' | 'salle' | 'prof',
  activeFilter: string
) {
  // Create jsPDF instance (A4, Landscape, unit mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Margins
  const marginX = 15;
  let currentY = 15;

  const { primary, secondary, neutral, lightBg, border } = ECOLE_221_PALETTE;

  // Fetch bulletin-settings for custom logo if configured
  let logoUrl: string | undefined = undefined;
  try {
    const response = await fetch('/api/bulletin-settings');
    if (response.ok) {
      const data = await response.json();
      if (data.logoUrl) {
        logoUrl = data.logoUrl;
      }
    }
  } catch (err) {
    console.error('Failed to load custom logo for planning PDF:', err);
  }

  // Header Title and Subtitle based on view mode and filter
  const filterText = activeFilter === 'ALL' ? 'Toutes les catégories' : activeFilter;
  const viewModeLabel = viewMode === 'classe' ? 'Par Classe' : viewMode === 'salle' ? 'Par Salle' : 'Par Enseignant';

  const { currentY: headerY } = await addEcole221Header(doc, {
    title: 'ÉCOLE 221 — GESTION DU TEMPS ET DES RESSOURCES',
    subtitle: `EMPLOI DU TEMPS GLOBAL (Vue : ${viewModeLabel})`,
    meta: `Filtre actif : ${filterText} | Année Académique 2026-2027`,
    generatedAt: new Date(),
    logoUrl,
  }, {
    marginX,
    currentY,
    height: 30,
  });

  currentY = headerY - 2;

  // --- PLANNING GRID TABLE ---
  // We'll render a landscape planning grid
  // Days columns (6 columns: Time Slot, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
  const columns = ['Créneau', ...DAYS];
  const colWidths = [38, 38, 38, 38, 38, 38, 38]; // 7 columns fitting inside 297mm page (A4 landscape)
  const totalGridWidth = colWidths.reduce((sum, w) => sum + w, 0); // 266mm
  const startX = (pageWidth - totalGridWidth) / 2; // Centers the grid on landscape page

  // Draw Grid Header Row
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(startX, currentY, totalGridWidth, 9, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  let currentX = startX;
  columns.forEach((col, index) => {
    doc.text(col.toUpperCase(), currentX + colWidths[index] / 2, currentY + 6, { align: 'center' });
    currentX += colWidths[index];
  });

  currentY += 9;

  // Draw Rows
  SLOTS.forEach((slotTime) => {
    // Check page height limit
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;

      // Small header on new page
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.text('ÉCOLE 221 — EMPLOI DU TEMPS GLOBAL (Suite)', marginX, currentY);
      currentY += 4;
      doc.setDrawColor(border[0], border[1], border[2]);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 8;

      // Repeat Grid Header Row on new page
      doc.setFillColor(secondary[0], secondary[1], secondary[2]);
      doc.rect(startX, currentY, totalGridWidth, 9, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);

      let innerX = startX;
      columns.forEach((col, index) => {
        doc.text(col.toUpperCase(), innerX + colWidths[index] / 2, currentY + 6, { align: 'center' });
        innerX += colWidths[index];
      });

      currentY += 9;
    }

    const rowHeight = 22; // Height of each time slot row

    // Background for time slot header
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(startX, currentY, colWidths[0], rowHeight, 'F');

    // Draw borders of slot cells
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.15);
    doc.rect(startX, currentY, totalGridWidth, rowHeight, 'S');

    // Draw slot text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(neutral[0], neutral[1], neutral[2]);
    doc.text(slotTime, startX + colWidths[0] / 2, currentY + rowHeight / 2 + 1, { align: 'center' });

    // Draw cells for each day
    let cellX = startX + colWidths[0];
    DAYS.forEach((day, dayIndex) => {
      // Draw cell border
      doc.setDrawColor(border[0], border[1], border[2]);
      doc.line(cellX, currentY, cellX, currentY + rowHeight);

      // Find slot
      const cellSlot = slots.find((s) => s.day === day && s.slot === slotTime);

      if (cellSlot) {
        // Highlight active schedule cells
        doc.setFillColor(253, 244, 245); // Soft red background tint
        doc.rect(cellX + 0.8, currentY + 0.8, colWidths[dayIndex + 1] - 1.6, rowHeight - 1.6, 'F');

        // Colored vertical edge
        doc.setFillColor(primary[0], primary[1], primary[2]);
        doc.rect(cellX + 0.8, currentY + 0.8, 1, rowHeight - 1.6, 'F');

        // Course details
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(secondary[0], secondary[1], secondary[2]);

        // Truncate course name if needed
        let truncatedSubj = cellSlot.subject;
        if (truncatedSubj.length > 22) {
          truncatedSubj = truncatedSubj.substring(0, 20) + '..';
        }
        doc.text(truncatedSubj, cellX + 3.5, currentY + 5);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(neutral[0], neutral[1], neutral[2]);
        doc.text(`Ensg: ${cellSlot.prof}`, cellX + 3.5, currentY + 10);
        doc.text(`Salle: ${cellSlot.room}`, cellX + 3.5, currentY + 14);

        // Class tag
        doc.setFillColor(secondary[0], secondary[1], secondary[2]);
        doc.rect(cellX + 3.5, currentY + 16.5, colWidths[dayIndex + 1] - 8, 3.8, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(255, 255, 255);
        let truncatedClass = cellSlot.classe;
        if (truncatedClass.length > 26) {
          truncatedClass = truncatedClass.substring(0, 24) + '..';
        }
        doc.text(truncatedClass, cellX + 3.5 + (colWidths[dayIndex + 1] - 8) / 2, currentY + 19.2, { align: 'center' });
      } else {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(190, 190, 190);
        doc.text('-', cellX + colWidths[dayIndex + 1] / 2, currentY + rowHeight / 2 + 1, { align: 'center' });
      }

      cellX += colWidths[dayIndex + 1];
    });

    currentY += rowHeight;
  });

  // --- FOOTER ---
  addEcole221Footer(doc, [
    "Ce planning est un document administratif officiel d'Université École 221.",
    "Toute modification ou falsification non autorisée fera l'objet de poursuites pénales et disciplinaires. Rapprochez-vous du secrétariat général pour toute mise à jour.",
  ]);

  // Save the PDF
  doc.save(`planning_global_${viewMode}_${filterText.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}

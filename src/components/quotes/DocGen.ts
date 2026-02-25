import jsPDF from 'jspdf';

interface ReferenceGroup {
  id: string;
  reference: string;
  designations: Array<{
    id: string;
    designation: string;
    unite: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
  }>;
}

interface QuoteRecord {
  id: string;
  type: 'devis' | 'facture';
  clientId: string;
  client: any;
  items: ReferenceGroup[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  date: string;
  docNumber?: string;
  created?: string;
}

function getDocNumber(quote: QuoteRecord): string {
  if (quote.docNumber) return quote.docNumber;
  const year = new Date(quote.date || quote.created || Date.now()).getFullYear();
  const suffix = (quote.id || '').slice(-6).toUpperCase() || 'XXXX';
  const prefix = quote.type === 'devis' ? 'DEV' : 'FAC';
  return `${prefix}-${year}-${suffix}`;
}

function numberToFrenchLetters(n: number): string {
  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  const u = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const d10 = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const d20 = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function f(num: number): string {
    if (num === 0) return '';
    if (num < 10) return u[num];
    if (num < 20) return d10[num - 10];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const o = num % 10;
      if (t === 7) return 'soixante-' + (o > 0 ? d10[o] : 'dix');  // 71 = soixante-onze
      if (t === 9) return 'quatre-vingt-' + (o > 0 ? d10[o] : 'dix');  // 91 = quatre-vingt-onze
      if (o === 0) return d20[t] + (t === 8 ? 's' : '');
      const link = (t === 1 || t === 7 || t === 9) && o === 1 ? ' et ' : '-';
      return d20[t] + link + f(o);
    }
    if (num < 200) return (num === 100 ? 'cent' : 'cent ' + f(num - 100));
    if (num < 1000) {
      const h = Math.floor(num / 100);
      const r = num % 100;
      return u[h] + ' cent' + (r === 0 ? 's' : ' ') + f(r);
    }
    if (num < 2000) return 'mille' + (num % 1000 === 0 ? '' : ' ' + f(num % 1000));
    if (num < 1000000) return f(Math.floor(num / 1000)) + ' mille' + (num % 1000 === 0 ? '' : ' ' + f(num % 1000));
    if (num < 2000000) return 'un million' + (num % 1000000 === 0 ? '' : ' ' + f(num % 1000000));
    return f(Math.floor(num / 1000000)) + ' million' + (num % 1000000 === 0 ? 's' : ' ' + f(num % 1000000));
  }

  const main = f(intPart) || 'zéro';
  const dirhams = intPart <= 1 ? 'dirham' : 'dirhams';
  if (decPart === 0) return main + ' ' + dirhams;
  return main + ' ' + dirhams + ' et ' + f(decPart) + (decPart <= 1 ? ' centime' : ' centimes');
}

export async function generatePDF(quote: QuoteRecord): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const headerHeight = 32;
  let yPos = margin;

  // Company header image – full width at top of page (cache-bust to pick up changes)
  try {
    const headerUrl = `/header.png?t=${Date.now()}`;
    const res = await fetch(headerUrl);
    if (res.ok) {
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.replace(/^data:image\/\w+;base64,/, ''));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', 0, 0, pageWidth, headerHeight);
    }
  } catch (e) {
    console.warn('Could not load header image:', e);
  }

  // Document number and date – on top of the header (right-aligned)
  const docNumber = getDocNumber(quote);
  const dateStr = quote.date ? new Date(quote.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const docType = quote.type === 'devis' ? 'DEVIS' : 'FACTURE';

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`${docType} N° ${docNumber}`, pageWidth - 15, 12, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${dateStr}`, pageWidth - 15, 20, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  yPos = headerHeight + 12;

  // Client Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (quote.client) {
    if (quote.client.type === 'personne_morale') {
      if (quote.client.company_name) doc.text(`Nom: ${quote.client.company_name}`, margin, yPos);
      yPos += 5;
      if (quote.client.ice) doc.text(`ICE: ${quote.client.ice}`, margin, yPos);
      yPos += 5;
      if (quote.client.company_address) doc.text(`Adresse: ${quote.client.company_address}`, margin, yPos);
      yPos += 5;
      if (quote.client.company_phone) doc.text(`Téléphone: ${quote.client.company_phone}`, margin, yPos);
      yPos += 5;
      if (quote.client.company_email) doc.text(`Email: ${quote.client.company_email}`, margin, yPos);
      yPos += 5;
    } else {
      if (quote.client.full_name) doc.text(`Nom: ${quote.client.full_name}`, margin, yPos);
      yPos += 5;
      if (quote.client.address) doc.text(`Adresse: ${quote.client.address}`, margin, yPos);
      yPos += 5;
      if (quote.client.phone) doc.text(`Téléphone: ${quote.client.phone}`, margin, yPos);
      yPos += 5;
      if (quote.client.email) doc.text(`Email: ${quote.client.email}`, margin, yPos);
      yPos += 5;
    }
  }

  yPos += 10;

  // Items Table Header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const colWidths = {
    ref: 25,
    designation: 60,
    unite: 20,
    quantite: 20,
    prixUnitaire: 25,
    prixTotal: 25
  };
  const colXPositions = {
    ref: margin,
    designation: margin + colWidths.ref,
    unite: margin + colWidths.ref + colWidths.designation,
    quantite: margin + colWidths.ref + colWidths.designation + colWidths.unite,
    prixUnitaire: margin + colWidths.ref + colWidths.designation + colWidths.unite + colWidths.quantite,
    prixTotal: margin + colWidths.ref + colWidths.designation + colWidths.unite + colWidths.quantite + colWidths.prixUnitaire
  };

  doc.text('Réf.', colXPositions.ref, yPos);
  doc.text('Désignation', colXPositions.designation, yPos);
  doc.text('Unité', colXPositions.unite, yPos);
  doc.text('Qté', colXPositions.quantite, yPos);
  doc.text('Prix U.', colXPositions.prixUnitaire, yPos);
  doc.text('Total', colXPositions.prixTotal, yPos);
  
  yPos += 5;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  quote.items?.forEach((group) => {
    group.designations.forEach((des) => {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      const refText = group.reference || '—';
      const desText = des.designation || '—';
      const uniteText = des.unite || '—';
      const quantiteText = (des.quantite || 0).toString();
      const prixUnitaireText = `${(des.prixUnitaire || 0).toFixed(2)} MAD`;
      const prixTotalText = `${(des.prixTotal || 0).toFixed(2)} MAD`;

      // Split text if too long
      const lines = doc.splitTextToSize(desText, colWidths.designation - 2);

      doc.text(refText, colXPositions.ref, yPos);
      doc.text(lines[0] || '—', colXPositions.designation, yPos);
      doc.text(uniteText, colXPositions.unite, yPos);
      doc.text(quantiteText, colXPositions.quantite, yPos);
      doc.text(prixUnitaireText, colXPositions.prixUnitaire, yPos);
      doc.text(prixTotalText, colXPositions.prixTotal, yPos);

      // If designation spans multiple lines
      if (lines.length > 1) {
        for (let i = 1; i < lines.length; i++) {
          yPos += 4;
          doc.text(lines[i], colXPositions.designation, yPos);
        }
      }

      yPos += 5;
    });
  });

  yPos += 5;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Totals – with more spacing
  const totalsX = pageWidth - margin;
  const labelX = pageWidth - margin - 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text('Total HT:', labelX, yPos);
  doc.text(`${(quote.totalHT || 0).toFixed(2)} MAD`, totalsX, yPos, { align: 'right' });
  yPos += 10;

  doc.text('TVA (20%):', labelX, yPos);
  doc.text(`${(quote.tva || 0).toFixed(2)} MAD`, totalsX, yPos, { align: 'right' });
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total TTC:', labelX, yPos);
  doc.text(`${(quote.totalTTC || 0).toFixed(2)} MAD`, totalsX, yPos, { align: 'right' });
  yPos += 14;

  // TTC en toutes lettres
  const ttcLetters = numberToFrenchLetters(quote.totalTTC || 0);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const letterLines = doc.splitTextToSize(`Arrêté à la somme de : ${ttcLetters}`, pageWidth - 2 * margin);
  letterLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  // Footer – company info (slate/grey color)
  const footerY = pageHeight - 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 70, 65);
  doc.text('STE INOKECH HOLDING SARL', pageWidth / 2, footerY, { align: 'center' });
  doc.text('ADRESS: MHAMID 9 ABRAJ KOUTOUBIA GH 14 IMM 21 N 3, MARRAKECH', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text('ICE: 003820252000086  |  RC: 171781  |  IF: 68743513  |  TP: 64603861', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Save PDF
  const fileName = `${quote.type === 'devis' ? 'Devis' : 'Facture'}_${docNumber}_${dateStr.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

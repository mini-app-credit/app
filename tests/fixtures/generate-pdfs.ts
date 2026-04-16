import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(__dirname, 'pdf');

async function createPdf(filename: string, lines: string[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  let y = 800;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font });
    y -= 20;
  }
  const bytes = await doc.save();
  fs.writeFileSync(path.join(OUT, filename), bytes);
  console.log(`Created ${filename}`);
}

async function createEmptyPdf(filename: string) {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  const bytes = await doc.save();
  fs.writeFileSync(path.join(OUT, filename), bytes);
  console.log(`Created ${filename}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  await createPdf('kyc-form.pdf', [
    'KYC Application Form',
    '',
    'Full Name: Ivan Petrov',
    'Date of Birth: 1990-05-15',
    'Nationality: Russian',
    'Passport Number: AB1234567',
    'Issue Date: 2015-03-20',
    'Expiry Date: 2025-03-20',
    '',
    'Address: ul. Lenina 42, Moscow, 101000, Russia',
    'Email: ivan@example.com',
    'Phone: +7-999-123-4567',
    '',
    'Employment Status: Employed',
    'Employer: Acme Corp',
    'Position: Senior Engineer',
    'Annual Income: $85,000',
  ]);

  await createPdf('invoice.pdf', [
    'INVOICE #INV-2024-001',
    '',
    'Bill To: Alice Johnson',
    'Company: Tech Solutions LLC',
    'Address: 456 Oak Ave, San Francisco, CA 94102',
    '',
    'Item: Consulting Services - 40 hours @ $150/hr',
    'Subtotal: $6,000.00',
    'Tax (8.5%): $510.00',
    'Total: $6,510.00',
    '',
    'Payment Terms: Net 30',
    'Due Date: 2024-02-15',
  ]);

  await createPdf('contract.pdf', [
    'SERVICE AGREEMENT',
    '',
    'Party A: Easy Validate Inc.',
    'Party B: Client Corporation',
    '',
    'Effective Date: January 1, 2024',
    'Term: 12 months',
    '',
    'Scope of Services:',
    '1. Document validation and review',
    '2. Automated compliance checking',
    '3. Report generation',
    '',
    'Fees: $5,000/month',
    'Payment: First business day of each month',
    '',
    'Governing Law: State of California',
  ]);

  await createEmptyPdf('empty.pdf');

  await createPdf('single-line.pdf', [
    'This PDF contains only a single line of text.',
  ]);

  await createPdf('multiline-data.pdf', [
    'Name: John Doe',
    'Age: 35',
    'Status: Active',
    'Score: 92.5',
    'Country: USA',
    'Department: Engineering',
    'Role: Lead',
    'Clearance: Level 3',
    'Start Date: 2020-01-15',
    'Badge ID: EMP-00142',
  ]);

  console.log('All PDFs generated.');
}

main().catch(console.error);

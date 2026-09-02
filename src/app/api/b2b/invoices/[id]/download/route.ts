import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import PDFDocument from 'pdfkit';

const TAX_RATE = 0.16;
const BRAND_PRIMARY = '#0F172A';    // dark navy
const BRAND_ACCENT = '#3B82F6';     // blue
const BRAND_MUTED = '#64748B';      // slate
const BRAND_LIGHT = '#F1F5F9';      // light gray bg

const paymentTermsMap: Record<string, number> = {
  NET_15: 15,
  NET_30: 30,
  NET_60: 60,
  NET_90: 90,
};

function fmt(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        user: { company: { isNot: null } },
      },
      include: {
        buyer: { select: { name: true, email: true, phone: true } },
        company: {
          select: {
            id: true, name: true, registrationNo: true, email: true,
            phone: true, county: true, city: true, address: true, paymentTerms: true,
          },
        },
        orderItems: {
          include: {
            product: { select: { name: true } },
            seller: { select: { storeName: true } },
          },
        },
      },
    });

    if (!order || !order.company) {
      return NextResponse.json({ error: 'B2B invoice not found' }, { status: 404 });
    }

    const subtotal = order.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax + order.deliveryFee) * 100) / 100;

    const daysOffset = paymentTermsMap[order.company.paymentTerms || 'NET_30'] || 30;
    const dueDate = new Date(order.createdAt);
    dueDate.setDate(dueDate.getDate() + daysOffset);

    const invoiceNumber = `INV-${order.id.substring(0, 8).toUpperCase()}`;

    // Build PDF
    const buffers: Buffer[] = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    const pageWidth = doc.page.width - 100; // 50 margin each side
    let y = 50;

    // ---- Header band ----
    doc.rect(0, 0, doc.page.width, 80).fill(BRAND_PRIMARY);

    // SHARKONE text logo
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#FFFFFF')
      .text('SHARKONE', 50, 28);
    doc.font('Helvetica').fontSize(11).fillColor('#94A3B8')
      .text('B2B Commerce Platform', 50, 58);

    // INVOICE label
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#FFFFFF')
      .text('INVOICE', doc.page.width - 200, 30, { width: 150, align: 'right' });

    y = 100;

    // ---- Invoice meta row ----
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_MUTED)
      .text('Invoice Number:', 50, y);
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY)
      .text(invoiceNumber, 170, y);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_MUTED)
      .text('Date:', 350, y);
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY)
      .text(order.createdAt.toLocaleDateString(), 400, y);

    y += 18;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_MUTED)
      .text('Due Date:', 50, y);
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY)
      .text(dueDate.toLocaleDateString(), 170, y);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_MUTED)
      .text('PO Number:', 350, y);
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY)
      .text(order.poNumber || 'N/A', 400, y);

    y += 18;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_MUTED)
      .text('Payment Terms:', 50, y);
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY)
      .text(order.company.paymentTerms || 'NET_30', 170, y);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_MUTED)
      .text('Status:', 350, y);
    doc.font('Helvetica').fontSize(10).fillColor(
      order.paymentStatus === 'PAID' ? '#16A34A' : '#F59E0B'
    )
      .text(order.paymentStatus, 400, y);

    y += 30;

    // ---- Bill To / Ship To columns ----
    const colW = (pageWidth - 30) / 2;

    // Bill To box
    doc.rect(50, y, colW, 80).lineWidth(0.5).stroke(BRAND_LIGHT);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND_ACCENT)
      .text('BILL TO', 60, y + 8);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_PRIMARY)
      .text(order.company.name, 60, y + 22);
    doc.font('Helvetica').fontSize(9).fillColor(BRAND_MUTED);
    let billY = y + 36;
    if (order.company.address) { doc.text(order.company.address, 60, billY); billY += 13; }
    if (order.company.city) { doc.text(`${order.company.city}, ${order.company.county}`, 60, billY); billY += 13; }
    doc.text(order.company.email, 60, billY);

    // Contact box
    const rx = 50 + colW + 30;
    doc.rect(rx, y, colW, 80).lineWidth(0.5).stroke(BRAND_LIGHT);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND_ACCENT)
      .text('BUYER CONTACT', rx + 10, y + 8);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_PRIMARY)
      .text(order.buyer.name, rx + 10, y + 22);
    doc.font('Helvetica').fontSize(9).fillColor(BRAND_MUTED);
    let contactY = y + 36;
    doc.text(order.buyer.email, rx + 10, contactY); contactY += 13;
    if (order.buyer.phone) doc.text(order.buyer.phone, rx + 10, contactY);

    y += 100;

    // ---- Items table ----
    const tableColumns = [200, 60, 80, 100, 100];
    const colX: number[] = [50];
    for (let i = 0; i < tableColumns.length - 1; i++) {
      colX.push(colX[i] + tableColumns[i]);
    }
    const headers = ['Product', 'Qty', 'Unit Price', 'Total', 'Seller'];

    // Header row
    doc.rect(50, y, pageWidth, 22).fill(BRAND_PRIMARY);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 6, y + 6, { width: tableColumns[i] - 12 });
    });
    y += 22;

    // Data rows
    order.orderItems.forEach((item, idx) => {
      if (y > 680) {
        doc.addPage();
        y = 50;
      }
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : BRAND_LIGHT;
      doc.rect(50, y, pageWidth, 20).fill(rowBg);
      doc.font('Helvetica').fontSize(9).fillColor(BRAND_PRIMARY);
      doc.text(item.product.name, colX[0] + 6, y + 5, { width: tableColumns[0] - 12 });
      doc.text(String(item.quantity), colX[1] + 6, y + 5, { width: tableColumns[1] - 12 });
      doc.text(fmt(item.price), colX[2] + 6, y + 5, { width: tableColumns[2] - 12, align: 'right' });
      doc.text(fmt(item.price * item.quantity), colX[3] + 6, y + 5, { width: tableColumns[3] - 12, align: 'right' });
      doc.font('Helvetica').fontSize(8).fillColor(BRAND_MUTED);
      doc.text(item.seller.storeName, colX[4] + 6, y + 5, { width: tableColumns[4] - 12 });
      y += 20;
    });

    y += 15;

    // ---- Totals section ----
    const totalsX = 350;
    const totalsW = pageWidth - (totalsX - 50);

    // Light background for totals
    doc.rect(totalsX, y, totalsW, 90).fill(BRAND_LIGHT);

    doc.font('Helvetica').fontSize(10).fillColor(BRAND_MUTED);
    doc.text('Subtotal:', totalsX + 10, y + 10, { width: 100, align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY);
    doc.text(fmt(subtotal), totalsX + 120, y + 10, { width: totalsW - 130, align: 'right' });

    doc.font('Helvetica').fontSize(10).fillColor(BRAND_MUTED);
    doc.text(`Tax (16%):`, totalsX + 10, y + 28, { width: 100, align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY);
    doc.text(fmt(tax), totalsX + 120, y + 28, { width: totalsW - 130, align: 'right' });

    if (order.deliveryFee > 0) {
      doc.font('Helvetica').fontSize(10).fillColor(BRAND_MUTED);
      doc.text('Delivery:', totalsX + 10, y + 46, { width: 100, align: 'right' });
      doc.font('Helvetica').fontSize(10).fillColor(BRAND_PRIMARY);
      doc.text(fmt(order.deliveryFee), totalsX + 120, y + 46, { width: totalsW - 130, align: 'right' });
    }

    // Grand total line
    doc.moveTo(totalsX + 10, y + 68).lineTo(totalsX + totalsW - 10, y + 68)
      .lineWidth(1).stroke(BRAND_ACCENT);

    doc.font('Helvetica-Bold').fontSize(12).fillColor(BRAND_PRIMARY);
    doc.text('Grand Total:', totalsX + 10, y + 72, { width: 100, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(BRAND_ACCENT);
    doc.text(`KSH ${fmt(total)}`, totalsX + 120, y + 72, { width: totalsW - 130, align: 'right' });

    y += 110;

    // ---- Footer ----
    doc.moveTo(50, y).lineTo(50 + pageWidth, y).lineWidth(0.5).stroke(BRAND_LIGHT);
    y += 10;
    doc.font('Helvetica').fontSize(8).fillColor(BRAND_MUTED);
    doc.text(`Payment is due within ${daysOffset} days of the invoice date. Late payments may incur interest.`, 50, y, { width: pageWidth, align: 'center' });
    y += 14;
    doc.text('Thank you for your business!', 50, y, { width: pageWidth, align: 'center' });
    y += 14;
    doc.font('Helvetica').fontSize(7).fillColor('#CBD5E1');
    doc.text('SHARKONE B2B Commerce  |  support@sharkone.com  |  www.sharkone.com', 50, y, { width: pageWidth, align: 'center' });

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json({ error: 'Failed to generate invoice PDF' }, { status: 500 });
  }
}

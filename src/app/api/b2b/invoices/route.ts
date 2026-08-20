import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        company: {
          select: {
            id: true, name: true, registrationNo: true, email: true,
            phone: true, county: true, city: true, address: true, paymentTerms: true,
          },
        },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        orderItems: {
          include: {
            product: { select: { id: true, name: true, image: true } },
            seller: { select: { id: true, storeName: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.company) {
      return NextResponse.json({ error: 'This order is not a B2B order' }, { status: 400 });
    }

    // Calculate payment terms due date
    const paymentTermsMap: Record<string, number> = {
      NET_15: 15,
      NET_30: 30,
      NET_60: 60,
      NET_90: 90,
    };
    const daysOffset = paymentTermsMap[order.company.paymentTerms] || 30;
    const dueDate = new Date(order.createdAt);
    dueDate.setDate(dueDate.getDate() + daysOffset);

    // Calculate subtotal and tax
    const subtotal = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = 0.16; // 16% VAT
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax + order.deliveryFee) * 100) / 100;

    const invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      poNumber: order.poNumber,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      dueDate: dueDate.toISOString(),
      paymentTerms: order.company.paymentTerms,
      status: order.paymentStatus,

      // Company (billing) details
      billing: {
        companyName: order.company.name,
        registrationNo: order.company.registrationNo,
        email: order.company.email,
        phone: order.company.phone,
        county: order.company.county,
        city: order.company.city,
        address: order.company.address,
      },

      // Contact person
      contact: {
        name: order.buyer.name,
        email: order.buyer.email,
        phone: order.buyer.phone,
      },

      // Line items
      lineItems: order.orderItems.map((item) => ({
        id: item.id,
        productName: item.product.name,
        sellerName: item.seller.storeName,
        quantity: item.quantity,
        unitPrice: item.price,
        total: Math.round(item.price * item.quantity * 100) / 100,
      })),

      // Totals
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate,
      tax,
      deliveryFee: order.deliveryFee,
      total,
    };

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}

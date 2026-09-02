import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const TAX_RATE = 0.16;

const paymentTermsMap: Record<string, number> = {
  NET_15: 15,
  NET_30: 30,
  NET_60: 60,
  NET_90: 90,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');

    const where: Record<string, unknown> = {
      user: {
        company: { isNot: null },
      },
    };

    if (status) {
      where.paymentStatus = status;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        company: {
          select: {
            id: true,
            name: true,
            registrationNo: true,
            email: true,
            phone: true,
            county: true,
            city: true,
            address: true,
            paymentTerms: true,
          },
        },
        orderItems: {
          include: {
            product: { select: { id: true, name: true, image: true } },
            seller: { select: { id: true, storeName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const invoices = orders.map((order) => {
      const subtotal = order.orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const total = Math.round((subtotal + tax + order.deliveryFee) * 100) / 100;

      const daysOffset = paymentTermsMap[order.company?.paymentTerms || 'NET_30'] || 30;
      const dueDate = new Date(order.createdAt);
      dueDate.setDate(dueDate.getDate() + daysOffset);

      return {
        invoiceNumber: `INV-${order.id.substring(0, 8).toUpperCase()}`,
        date: order.createdAt,
        dueDate: dueDate.toISOString(),
        company: order.company
          ? {
              id: order.company.id,
              name: order.company.name,
              email: order.company.email,
              phone: order.company.phone,
              county: order.company.county,
              city: order.company.city,
              address: order.company.address,
            }
          : null,
        buyer: order.buyer,
        items: order.orderItems.map((item) => ({
          id: item.id,
          productName: item.product.name,
          sellerName: item.seller.storeName,
          quantity: item.quantity,
          price: item.price,
          total: Math.round(item.price * item.quantity * 100) / 100,
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        tax,
        total,
        status: order.paymentStatus,
        poNumber: order.poNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    });

    return NextResponse.json({ invoices, count: invoices.length });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

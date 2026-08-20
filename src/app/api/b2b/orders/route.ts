import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all orders that belong to a company
    const b2bOrders = await db.order.findMany({
      where: { companyId: { not: null } },
      include: {
        company: {
          select: { id: true, name: true, email: true, phone: true, county: true, city: true, address: true, paymentTerms: true },
        },
        buyer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        orderItems: {
          include: {
            product: { select: { id: true, name: true, image: true, price: true },
            },
            seller: { select: { id: true, storeName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(b2bOrders);
  } catch (error) {
    console.error('Error fetching B2B orders:', error);
    return NextResponse.json({ error: 'Failed to fetch B2B orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderNumber,
      poNumber,
      companyId,
      buyerId,
      items,
      shippingAddress,
      totalAmount,
      deliveryFee = 0,
      platformFee = 0,
    } = body;

    if (!orderNumber || !companyId || !buyerId || !items?.length || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify company exists
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const order = await db.order.create({
      data: {
        orderNumber,
        buyerId,
        companyId,
        poNumber: poNumber || null,
        totalAmount,
        deliveryFee,
        platformFee,
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress || company.address),
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    // Create order items
    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      const sellerId = product?.sellerId || '';
      const seller = sellerId ? await db.seller.findUnique({ where: { id: sellerId } }) : null;
      const commissionRate = seller?.commissionRate || 0.1;
      const sellerEarnings = Math.round(item.price * item.quantity * (1 - commissionRate) * 100) / 100;

      await db.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          sellerId,
          sellerEarnings,
          status: 'PENDING',
        },
      });
    }

    // Update company credit used
    const newCreditUsed = company.creditUsed + totalAmount;
    await db.company.update({
      where: { id: companyId },
      data: { creditUsed: newCreditUsed },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating B2B order:', error);
    return NextResponse.json({ error: 'Failed to create B2B order' }, { status: 500 });
  }
}

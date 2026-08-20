import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { audit } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: { include: { user: { select: { name: true, email: true } } } },
        orderItems: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.originalPrice !== undefined && {
          originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.sellerId !== undefined && { sellerId: body.sellerId }),
        ...(body.stock !== undefined && { stock: parseInt(body.stock) }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: {
        category: true,
        seller: { include: { user: { select: { name: true } } } },
      },
    });

    if (body.status === 'ARCHIVED' || existing.status !== body.status) {
      audit({ action: 'UPDATE_PRODUCT', resource: 'product', resourceId: id, details: `Status: ${existing.status} → ${body.status}`, req: request });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await db.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    audit({ action: 'UPDATE_PRODUCT', resource: 'product', resourceId: id, details: `Product archived: ${existing.name}`, req: request });

    return NextResponse.json({ message: 'Product archived' });
  } catch (error) {
    console.error('Error archiving product:', error);
    return NextResponse.json({ error: 'Failed to archive product' }, { status: 500 });
  }
}

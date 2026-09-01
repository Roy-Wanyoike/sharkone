import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ProductStatus } from '@prisma/client';
import { audit } from '@/lib/audit';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status && status !== 'ALL' && Object.values(ProductStatus).includes(status as ProductStatus)) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: {
            select: { id: true, storeName: true, user: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      images,
      categoryId,
      sellerId,
      stock,
      featured,
      status,
    } = body;

    if (!name || !description || !price || !image || !categoryId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price, image, categoryId, sellerId' },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);

    // Ensure unique slug
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        images: images || null,
        categoryId,
        sellerId,
        stock: parseInt(stock) || 100,
        featured: featured || false,
        status: status || 'ACTIVE',
      },
      include: {
        category: true,
        seller: { include: { user: { select: { name: true } } } },
      },
    });

    audit({ action: 'CREATE_PRODUCT', resource: 'product', resourceId: product.id, details: `Product: ${product.name}`, req: request });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

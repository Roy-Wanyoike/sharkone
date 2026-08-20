import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const seller = searchParams.get('seller') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (category) {
      where.category = { slug: category };
    }
    if (seller) {
      where.seller = { storeSlug: seller };
    }
    if (search) {
      where.name = { contains: search };
    }

    const products = await db.$queryRaw<
      {
        id: string;
        name: string;
        price: number;
        totalSold: number;
        revenue: number;
        rating: number;
        reviewCount: number;
        stock: number;
        image: string;
        category: string;
        sellerName: string;
      }[]
    >`
      SELECT 
        p.id, p.name, p.price, p.image, p.rating, p.reviewCount, p.stock,
        COALESCE(SUM(oi.quantity), 0) as totalSold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
        c.name as category,
        s.storeName as sellerName
      FROM Product p
      LEFT JOIN OrderItem oi ON oi.productId = p.id
      LEFT JOIN Category c ON p.categoryId = c.id
      LEFT JOIN Seller s ON p.sellerId = s.id
      WHERE p.status = 'ACTIVE'
        ${category ? `AND c.slug = '${category.replace(/'/g, "''")}'` : ''}
        ${seller ? `AND s.storeSlug = '${seller.replace(/'/g, "''")}'` : ''}
        ${search ? `AND p.name LIKE '%${search.replace(/'/g, "''")}%'` : ''}
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 100
    `;

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        totalSold: Number(p.totalSold) || 0,
        revenue: Number(p.revenue) || 0,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviewCount) || 0,
        stock: Number(p.stock) || 0,
        image: p.image,
        category: p.category,
        sellerName: p.sellerName,
      })),
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}

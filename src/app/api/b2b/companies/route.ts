import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = companies.map((c) => ({
      id: c.id,
      name: c.name,
      registrationNo: c.registrationNo,
      email: c.email,
      phone: c.phone,
      county: c.county,
      city: c.city,
      address: c.address,
      logo: c.logo,
      creditLimit: c.creditLimit,
      creditUsed: c.creditUsed,
      paymentTerms: c.paymentTerms,
      isVerified: c.isVerified,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      user: c.user,
      orderCount: c._count.orders,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      companyName,
      registrationNo,
      email,
      phone,
      county,
      city,
      address,
      paymentTerms,
      contactName,
      contactEmail,
      password,
    } = body;

    if (!companyName || !email || !county || !contactName || !contactEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if company email already exists
    const existingCompany = await prisma.company.findFirst({ where: { email } });
    if (existingCompany) {
      return NextResponse.json({ error: 'Company email already registered' }, { status: 409 });
    }

    // Check if contact email (user email) already exists
    const existingUser = await prisma.user.findUnique({ where: { email: contactEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Contact email already registered' }, { status: 409 });
    }

    // Create the user first (with BUYER role)
    const user = await prisma.user.create({
      data: {
        name: contactName,
        email: contactEmail,
        phone: phone || null,
        role: 'BUYER',
      },
    });

    // Create the company with the same id as the user
    const company = await prisma.company.create({
      data: {
        id: user.id,
        name: companyName,
        registrationNo: registrationNo || null,
        email,
        phone: phone || null,
        county,
        city: city || null,
        address: address || null,
        paymentTerms: paymentTerms || 'NET_30',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    // Link the user to the company
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

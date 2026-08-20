import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the buyer user
  const buyer = await prisma.user.findFirst({
    where: { role: 'BUYER' },
  });

  if (!buyer) {
    console.error('No buyer user found. Please run seed.ts first.');
    process.exit(1);
  }

  console.log(`Found buyer: ${buyer.name} (${buyer.id})`);

  // Upsert sample addresses
  const addresses = await Promise.all([
    prisma.address.upsert({
      where: { id: `${buyer.id}-home` },
      update: {},
      create: {
        id: `${buyer.id}-home`,
        userId: buyer.id,
        label: 'Home',
        fullName: buyer.name,
        phone: buyer.phone || '+254712345678',
        county: 'Nairobi',
        city: 'Kilimani',
        addressLine: 'Argwings Kodhek Road, near Yaya Centre, Kilimani',
        isDefault: true,
      },
    }),
    prisma.address.upsert({
      where: { id: `${buyer.id}-office` },
      update: {},
      create: {
        id: `${buyer.id}-office`,
        userId: buyer.id,
        label: 'Office',
        fullName: buyer.name,
        phone: buyer.phone || '+254712345678',
        county: 'Nairobi',
        city: 'Westlands',
        addressLine: 'Sarit Centre, 4th Floor, Westlands',
        isDefault: false,
      },
    }),
    prisma.address.upsert({
      where: { id: `${buyer.id}-parents` },
      update: {},
      create: {
        id: `${buyer.id}-parents`,
        userId: buyer.id,
        label: 'Other',
        fullName: 'Wanyoike Family',
        phone: '+254722345678',
        county: 'Kiambu',
        city: 'Kiambu Town',
        addressLine: 'Along Kiambu Road, near KNH Gate B',
        isDefault: false,
      },
    }),
  ]);

  console.log(`Seeded ${addresses.length} addresses for ${buyer.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

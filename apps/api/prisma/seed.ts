import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SEED_USERS_DATA = [
  { email: "alice@example.com", name: "Alice" },
  { email: "bob@example.com", name: "Bob" },
  { email: "joe@example.com", name: "Joe" },
  { email: "charlie@example.com", name: "Charlie" },
  { email: "dave@example.com", name: "Dave" },
  { email: "eve@example.com", name: "Eve" },
  { email: "frank@example.com", name: "Frank" },
  { email: "grace@example.com", name: "Grace" },
  { email: "heidi@example.com", name: "Heidi" },
  { email: "ivan@example.com", name: "Ivan" },
  { email: "judy@example.com", name: "Judy" },
  { email: "kevin@example.com", name: "Kevin" },
  { email: "laura@example.com", name: "Laura" },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.reviewVote.deleteMany();
    await tx.refreshToken.deleteMany();
    await tx.review.deleteMany();
    await tx.product.deleteMany();
    await tx.user.deleteMany();

    const passwordHash = await bcrypt.hash("Password123!", 10);

    const admin = await tx.user.create({
      data: {
        email: "admin@example.com",
        passwordHash,
        name: "Admin User",
        role: "ADMIN",
      },
    });

    const seedUsers = await Promise.all(
      SEED_USERS_DATA.map((u) =>
        tx.user.create({
          data: {
            email: u.email,
            passwordHash,
            name: u.name,
          },
        }),
      ),
    );

    function randomSeedUser() {
      const user = seedUsers[Math.floor(Math.random() * seedUsers.length)];
      if (!user) throw new Error("No seed users available");
      return user;
    }

    const products = await Promise.all([
      tx.product.create({
        data: {
          name: "Ergonomic Wireless Mouse",
          description:
            "A comfortable wireless mouse with precision tracking and long battery life.",
          price: 49.99,
          category: "Electronics",
          images: [],
          averageRating: 0,
          reviewCount: 0,
        },
      }),
      tx.product.create({
        data: {
          name: "Mechanical Keyboard",
          description:
            "Tactile mechanical keyboard with RGB backlight and hot-swappable switches.",
          price: 129.99,
          category: "Electronics",
          images: [],
          averageRating: 0,
          reviewCount: 0,
        },
      }),
      tx.product.create({
        data: {
          name: "Noise-Canceling Headphones",
          description:
            "Over-ear headphones with active noise cancellation and premium sound quality.",
          price: 249.99,
          category: "Electronics",
          images: [],
          averageRating: 0,
          reviewCount: 0,
        },
      }),
      tx.product.create({
        data: {
          name: "Ceramic Coffee Mug Set",
          description:
            "A set of four handcrafted ceramic coffee mugs, microwave and dishwasher safe.",
          price: 34.99,
          category: "Home",
          images: [],
          averageRating: 0,
          reviewCount: 0,
        },
      }),
    ]);

    const [mouse, keyboard, headphones, mugs] = products;

    const reviews = await Promise.all([
      tx.review.create({
        data: {
          productId: mouse.id,
          userId: randomSeedUser().id,
          rating: 5,
          title: "Great mouse for daily use",
          content:
            "The mouse is very comfortable and the battery lasts for weeks. Highly recommended.",
          images: [],
          pros: [],
          cons: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: mouse.id,
          userId: randomSeedUser().id,
          rating: 4,
          title: "Good, but a bit small",
          content:
            "Works well, but the shape is a little too small for my hands.",
          images: [],
          pros: [],
          cons: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: keyboard.id,
          userId: randomSeedUser().id,
          rating: 5,
          title: "Best keyboard I have owned",
          content:
            "The tactile feel and customization options make this keyboard a joy to use.",
          images: [],
          pros: [],
          cons: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: headphones.id,
          userId: randomSeedUser().id,
          rating: 3,
          title: "Decent, but expensive",
          content:
            "Sound quality is good but I expected better noise cancellation at this price.",
          images: [],
          pros: [],
          cons: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: mugs.id,
          userId: randomSeedUser().id,
          rating: 5,
          title: "Beautiful mugs",
          content: "The colors are vibrant and the mugs feel high quality.",
          images: [],
          pros: [],
          cons: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
    ]);

    await tx.product.update({
      where: { id: mouse.id },
      data: {
        averageRating:
          (reviews
            .filter((r) => r.productId === mouse.id)
            .reduce((sum, r) => sum + r.rating, 0) ?? 0) /
          (reviews.filter((r) => r.productId === mouse.id).length || 1),
        reviewCount: reviews.filter((r) => r.productId === mouse.id).length,
      },
    });

    await tx.product.update({
      where: { id: keyboard.id },
      data: {
        averageRating: 5,
        reviewCount: 1,
      },
    });

    await tx.product.update({
      where: { id: headphones.id },
      data: {
        averageRating: 3,
        reviewCount: 1,
      },
    });

    await tx.product.update({
      where: { id: mugs.id },
      data: {
        averageRating: 5,
        reviewCount: 1,
      },
    });

    console.log(
      `Seeded admin ${admin.email}, ${products.length} products and ${reviews.length} reviews.`,
    );
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

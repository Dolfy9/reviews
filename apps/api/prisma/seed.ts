import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

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

    const alice = await tx.user.create({
      data: {
        email: "alice@example.com",
        passwordHash,
        name: "Alice",
      },
    });

    const bob = await tx.user.create({
      data: {
        email: "bob@example.com",
        passwordHash,
        name: "Bob",
      },
    });

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
          userId: alice.id,
          rating: 5,
          title: "Great mouse for daily use",
          content:
            "The mouse is very comfortable and the battery lasts for weeks. Highly recommended.",
          images: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: mouse.id,
          userId: bob.id,
          rating: 4,
          title: "Good, but a bit small",
          content:
            "Works well, but the shape is a little too small for my hands.",
          images: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: keyboard.id,
          userId: alice.id,
          rating: 5,
          title: "Best keyboard I have owned",
          content:
            "The tactile feel and customization options make this keyboard a joy to use.",
          images: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: headphones.id,
          userId: bob.id,
          rating: 3,
          title: "Decent, but expensive",
          content:
            "Sound quality is good but I expected better noise cancellation at this price.",
          images: [],
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: "APPROVED",
        },
      }),
      tx.review.create({
        data: {
          productId: mugs.id,
          userId: alice.id,
          rating: 5,
          title: "Beautiful mugs",
          content: "The colors are vibrant and the mugs feel high quality.",
          images: [],
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

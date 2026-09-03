import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { Prisma, ReviewVote } from "@prisma/client";

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.review.findUnique({ where: { id } });
  }

  findByProduct(productId: string, skip: number, take: number) {
    return this.prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  countByProduct(productId: string) {
    return this.prisma.review.count({
      where: { productId, status: "APPROVED" },
    });
  }

  findByProductAndUser(productId: string, userId: string) {
    return this.prisma.review.findFirst({
      where: { productId, userId },
    });
  }

  create(data: Prisma.ReviewCreateInput) {
    return this.prisma.review.create({ data });
  }

  update(id: string, data: Prisma.ReviewUpdateInput) {
    return this.prisma.review.update({ where: { id }, data });
  }

  async setEmbedding(id: string, vector: number[]): Promise<void> {
    const vectorString = `[${vector.join(",")}]`;
    await this.prisma
      .$executeRaw`UPDATE "Review" SET embedding = ${vectorString}::vector WHERE id = ${id}`;
  }

  delete(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }

  findVote(reviewId: string, userId: string) {
    return this.prisma.reviewVote.findFirst({
      where: { reviewId, userId },
    });
  }

  createVote(data: Prisma.ReviewVoteCreateInput) {
    return this.prisma.reviewVote.create({ data });
  }

  updateVote(id: string, type: string) {
    return this.prisma.reviewVote.update({
      where: { id },
      data: { type: type as ReviewVote["type"] },
    });
  }

  deleteVote(id: string) {
    return this.prisma.reviewVote.delete({ where: { id } });
  }

  async aggregateVotes(reviewId: string) {
    const [helpful, notHelpful] = await Promise.all([
      this.prisma.reviewVote.count({
        where: { reviewId, type: "HELPFUL" },
      }),
      this.prisma.reviewVote.count({
        where: { reviewId, type: "NOT_HELPFUL" },
      }),
    ]);
    return { helpful, notHelpful };
  }

  async updateVoteCounts(reviewId: string) {
    const { helpful, notHelpful } = await this.aggregateVotes(reviewId);
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: helpful, notHelpfulCount: notHelpful },
    });
  }
}

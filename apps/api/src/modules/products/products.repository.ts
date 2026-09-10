import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    skip: number,
    take: number,
    filters: Prisma.ProductWhereInput,
    orderBy:
      | Prisma.ProductOrderByWithRelationInput
      | Prisma.ProductOrderByWithRelationInput[],
  ) {
    return this.prisma.product.findMany({
      where: filters,
      orderBy,
      skip,
      take,
    });
  }

  count(filters: Prisma.ProductWhereInput) {
    return this.prisma.product.count({ where: filters });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async setEmbedding(id: string, vector: number[]): Promise<void> {
    const vectorString = `[${vector.join(",")}]`;
    await this.prisma
      .$executeRaw`UPDATE "Product" SET embedding = ${vectorString}::vector WHERE id = ${id}`;
  }

  findDistinctCategories() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
  }

  async findDistinctSubcategories(category: string) {
    const rows = await this.prisma.product.groupBy({
      by: ["subcategory"],
      where: {
        isActive: true,
        category,
        subcategory: { not: null },
      },
      _count: { subcategory: true },
      orderBy: { _count: { subcategory: "desc" } },
      take: 50,
    });
    return rows
      .map((r) => r.subcategory)
      .filter(
        (s): s is string =>
          s !== null &&
          s.length >= 2 &&
          s.length <= 25 &&
          s.split(/\s+/).length <= 3 &&
          !/[=:,;\d()[\]{}]/.test(s) &&
          !s.startsWith("nyt:") &&
          !s.startsWith("serie:") &&
          !s.startsWith("fr:") &&
          !s.startsWith("collectionid:"),
      )
      .slice(0, 12);
  }
}

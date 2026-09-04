import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { EmbeddingService } from "./embedding.service";
import {
  SearchQuery,
  ProductDto,
  ReviewDto,
  PaginatedResponse,
} from "@product-reviews/shared";
import { buildPaginatedResponse } from "../../common/pagination";
import { toProductDto, toReviewDto } from "../../common/mappers";

const RRF_K = 60;

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async search(query: SearchQuery): Promise<
    | PaginatedResponse<ProductDto>
    | PaginatedResponse<ReviewDto>
    | {
        products: PaginatedResponse<ProductDto>;
        reviews: PaginatedResponse<ReviewDto>;
      }
  > {
    if (query.mode === "semantic" && !this.embeddingService.isEnabled()) {
      throw new BadRequestException("Semantic search is disabled");
    }

    if (query.target === "all") {
      const [products, reviews] = await Promise.all([
        this.searchProducts(query),
        this.searchReviews(query),
      ]);
      return { products, reviews };
    }

    if (query.target === "reviews") {
      return this.searchReviews(query);
    }

    return this.searchProducts(query);
  }

  async searchProducts(
    query: SearchQuery,
  ): Promise<PaginatedResponse<ProductDto>> {
    const { q, mode, page, limit } = query;
    const skip = (page - 1) * limit;

    if (mode === "fulltext") {
      const rows = await this.fulltextProducts(q, skip, limit);
      const total = await this.fulltextProductsCount(q);
      return buildPaginatedResponse(rows, page, limit, total);
    }

    if (mode === "semantic") {
      const rows = await this.semanticProducts(q, skip, limit);
      const total = await this.semanticProductsCount(q);
      return buildPaginatedResponse(rows, page, limit, total);
    }

    // hybrid
    return this.hybridProducts(q, skip, limit, page);
  }

  async searchReviews(
    query: SearchQuery,
  ): Promise<PaginatedResponse<ReviewDto>> {
    const { q, mode, page, limit } = query;
    const skip = (page - 1) * limit;

    if (mode === "fulltext") {
      const rows = await this.fulltextReviews(q, skip, limit);
      const total = await this.fulltextReviewsCount(q);
      return buildPaginatedResponse(rows, page, limit, total);
    }

    if (mode === "semantic") {
      const rows = await this.semanticReviews(q, skip, limit);
      const total = await this.semanticReviewsCount(q);
      return buildPaginatedResponse(rows, page, limit, total);
    }

    return this.hybridReviews(q, skip, limit, page);
  }

  private async fulltextProducts(
    q: string,
    skip: number,
    limit: number,
  ): Promise<ProductDto[]> {
    const rows = (await this.prisma.$queryRaw`
      SELECT "id", "name", "description", "price", "category", "subcategory", "images", "metadata",
             "averageRating", "reviewCount", "isActive", "createdAt", "updatedAt",
             ts_rank_cd(to_tsvector('english', "name" || ' ' || "description" || ' ' || COALESCE("metadata"::text, '')), plainto_tsquery('english', ${q})) AS rank
      FROM "Product"
      WHERE "isActive" = true
        AND to_tsvector('english', "name" || ' ' || "description" || ' ' || COALESCE("metadata"::text, '')) @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${limit} OFFSET ${skip}
    `) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapRawProduct(row));
  }

  private async fulltextProductsCount(q: string): Promise<number> {
    const result = (await this.prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Product"
      WHERE "isActive" = true
        AND to_tsvector('english', "name" || ' ' || "description" || ' ' || COALESCE("metadata"::text, '')) @@ plainto_tsquery('english', ${q})
    `) as Array<{ count: number }>;
    return result[0]?.count ?? 0;
  }

  private async semanticProducts(
    q: string,
    skip: number,
    limit: number,
  ): Promise<ProductDto[]> {
    const vector = await this.embeddingService.embedQuery(q);
    if (!vector) return [];
    const vectorString = `[${vector.join(",")}]`;

    const rows = (await this.prisma.$queryRaw`
      SELECT "id", "name", "description", "price", "category", "subcategory", "images", "metadata",
             "averageRating", "reviewCount", "isActive", "createdAt", "updatedAt",
             embedding <=> ${vectorString}::vector AS distance
      FROM "Product"
      WHERE "isActive" = true
        AND embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET ${skip}
    `) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapRawProduct(row));
  }

  private async semanticProductsCount(q: string): Promise<number> {
    const vector = await this.embeddingService.embedQuery(q);
    if (!vector) return 0;
    const vectorString = `[${vector.join(",")}]`;

    const result = (await this.prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Product"
      WHERE "isActive" = true
        AND embedding IS NOT NULL
        AND embedding <=> ${vectorString}::vector IS NOT NULL
    `) as Array<{ count: number }>;
    return result[0]?.count ?? 0;
  }

  private async hybridProducts(
    q: string,
    skip: number,
    limit: number,
    page: number,
  ): Promise<PaginatedResponse<ProductDto>> {
    const fulltext = await this.fulltextProducts(q, 0, 100);
    const semantic = await this.semanticProducts(q, 0, 100);

    const merged = this.reciprocalRankFusion<ProductDto>(
      fulltext,
      semantic,
      (item) => item.id,
    );

    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);
    return buildPaginatedResponse(paginated, page, limit, total);
  }

  private async fulltextReviews(
    q: string,
    skip: number,
    limit: number,
  ): Promise<ReviewDto[]> {
    const rows = (await this.prisma.$queryRaw`
      SELECT r."id", r."productId", r."userId", u.name AS "authorName", r."rating",
             r."title", r."content", r."images", r."helpfulCount", r."notHelpfulCount",
             r."status", r."createdAt", r."updatedAt",
             ts_rank_cd(to_tsvector('english', r."title" || ' ' || r."content"), plainto_tsquery('english', ${q})) AS rank
      FROM "Review" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."status" = 'APPROVED'
        AND to_tsvector('english', r."title" || ' ' || r."content") @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${limit} OFFSET ${skip}
    `) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapRawReview(row));
  }

  private async fulltextReviewsCount(q: string): Promise<number> {
    const result = (await this.prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Review"
      WHERE "status" = 'APPROVED'
        AND to_tsvector('english', "title" || ' ' || "content") @@ plainto_tsquery('english', ${q})
    `) as Array<{ count: number }>;
    return result[0]?.count ?? 0;
  }

  private async semanticReviews(
    q: string,
    skip: number,
    limit: number,
  ): Promise<ReviewDto[]> {
    const vector = await this.embeddingService.embedQuery(q);
    if (!vector) return [];
    const vectorString = `[${vector.join(",")}]`;

    const rows = (await this.prisma.$queryRaw`
      SELECT r."id", r."productId", r."userId", u.name AS "authorName", r."rating",
             r."title", r."content", r."images", r."helpfulCount", r."notHelpfulCount",
             r."status", r."createdAt", r."updatedAt",
             r.embedding <=> ${vectorString}::vector AS distance
      FROM "Review" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."status" = 'APPROVED'
        AND r.embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET ${skip}
    `) as Array<Record<string, unknown>>;

    return rows.map((row) => this.mapRawReview(row));
  }

  private async semanticReviewsCount(q: string): Promise<number> {
    const vector = await this.embeddingService.embedQuery(q);
    if (!vector) return 0;
    const vectorString = `[${vector.join(",")}]`;

    const result = (await this.prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Review"
      WHERE "status" = 'APPROVED'
        AND embedding IS NOT NULL
        AND embedding <=> ${vectorString}::vector IS NOT NULL
    `) as Array<{ count: number }>;
    return result[0]?.count ?? 0;
  }

  private async hybridReviews(
    q: string,
    skip: number,
    limit: number,
    page: number,
  ): Promise<PaginatedResponse<ReviewDto>> {
    const fulltext = await this.fulltextReviews(q, 0, 100);
    const semantic = await this.semanticReviews(q, 0, 100);

    const merged = this.reciprocalRankFusion<ReviewDto>(
      fulltext,
      semantic,
      (item) => item.id,
    );

    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);
    return buildPaginatedResponse(paginated, page, limit, total);
  }

  private mapRawProduct(row: Record<string, unknown>): ProductDto {
    return toProductDto({
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      price: Number(row.price),
      category: String(row.category),
      subcategory: row.subcategory != null ? String(row.subcategory) : null,
      images: Array.isArray(row.images) ? (row.images as string[]) : [],
      averageRating: Number(row.averageRating),
      reviewCount: Number(row.reviewCount),
      isActive: Boolean(row.isActive),
      metadata: row.metadata ?? null,
      createdAt: new Date(String(row.createdAt)),
      updatedAt: new Date(String(row.updatedAt)),
    } as unknown as import("@prisma/client").Product);
  }

  private mapRawReview(row: Record<string, unknown>): ReviewDto {
    return toReviewDto({
      id: String(row.id),
      productId: String(row.productId),
      userId: String(row.userId),
      authorName: row.authorName ? String(row.authorName) : null,
      rating: Number(row.rating),
      title: String(row.title),
      content: String(row.content),
      images: Array.isArray(row.images) ? (row.images as string[]) : [],
      helpfulCount: Number(row.helpfulCount),
      notHelpfulCount: Number(row.notHelpfulCount),
      status: String(row.status) as "PENDING" | "APPROVED" | "REJECTED",
      createdAt: new Date(String(row.createdAt)),
      updatedAt: new Date(String(row.updatedAt)),
    } as unknown as import("@prisma/client").Review & {
      user?: { name: string | null } | null;
    });
  }

  private reciprocalRankFusion<T>(
    fulltext: T[],
    semantic: T[],
    idFn: (item: T) => string,
  ): T[] {
    const scores = new Map<string, number>();
    const items = new Map<string, T>();

    fulltext.forEach((item, index) => {
      const id = idFn(item);
      items.set(id, item);
      scores.set(id, (scores.get(id) ?? 0) + 1 / (RRF_K + index + 1));
    });

    semantic.forEach((item, index) => {
      const id = idFn(item);
      items.set(id, item);
      scores.set(id, (scores.get(id) ?? 0) + 1 / (RRF_K + index + 1));
    });

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => items.get(id)!);
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ProductListQuery,
  CreateProductInput,
  UpdateProductInput,
} from "@product-reviews/shared";
import { Prisma } from "@prisma/client";
import { ProductsRepository } from "./products.repository";
import { toProductDto } from "../../common/mappers";
import { buildPaginatedResponse } from "../../common/pagination";
import { EmbeddingService } from "../search/embedding.service";

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async findAll(query: ProductListQuery) {
    const { page, limit, category, categories, subcategory, minRating, search, sort } = query;
    const skip = (page - 1) * limit;

    const categoryList = categories
      ? Array.isArray(categories)
        ? categories
        : [categories]
      : category
        ? [category]
        : undefined;

    const filters: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryList && categoryList.length > 0 && { category: { in: categoryList } }),
      ...(subcategory && { subcategory }),
      ...(minRating !== undefined && { averageRating: { gte: minRating } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const orderBy = this.buildSortOrder(sort);

    const [products, total] = await Promise.all([
      this.productsRepository.findMany(skip, limit, filters, orderBy),
      this.productsRepository.count(filters),
    ]);

    return buildPaginatedResponse(
      products.map(toProductDto),
      page,
      limit,
      total,
    );
  }

  async findById(id: string) {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return toProductDto(product);
  }

  async create(dto: CreateProductInput) {
    const product = await this.productsRepository.create({
      ...dto,
      price: new Prisma.Decimal(dto.price),
    });

    const embedding = await this.embeddingService.embedPassage(
      `${dto.name}. ${dto.description}`,
    );
    if (embedding) {
      await this.productsRepository.setEmbedding(product.id, embedding);
    }

    return toProductDto(product);
  }

  async update(id: string, dto: UpdateProductInput) {
    await this.findById(id);

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);

    const product = await this.productsRepository.update(id, data);

    if (dto.name !== undefined || dto.description !== undefined) {
      const existing = await this.productsRepository.findById(id);
      const text = `${dto.name ?? existing?.name}. ${dto.description ?? existing?.description}`;
      const embedding = await this.embeddingService.embedPassage(text);
      if (embedding) {
        await this.productsRepository.setEmbedding(product.id, embedding);
      }
    }

    return toProductDto(product);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.productsRepository.delete(id);
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.productsRepository.findDistinctCategories();
    return rows.map((r) => r.category);
  }

  async getSubcategories(category: string): Promise<string[]> {
    const rows = await this.productsRepository.findDistinctSubcategories(category);
    return rows
      .map((r) => r.subcategory)
      .filter((s): s is string => s !== null);
  }

  async findSimilar(id: string, limit = 6) {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    const products = await this.productsRepository.findMany(
      0,
      limit,
      {
        isActive: true,
        category: product.category,
        id: { not: id },
      },
      [{ averageRating: "desc" }, { reviewCount: "desc" }],
    );
    return products.map(toProductDto);
  }

  private buildSortOrder(
    sort: ProductListQuery["sort"],
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case "rating":
        return { averageRating: "desc" };
      case "reviews":
        return { reviewCount: "desc" };
      case "price_asc":
        return { price: "asc" };
      case "price_desc":
        return { price: "desc" };
      case "newest":
      default:
        return { createdAt: "desc" };
    }
  }
}

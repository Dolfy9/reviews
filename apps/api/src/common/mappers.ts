import { User, Product, Review, ReviewVote } from "@prisma/client";
import { UserDto, ProductDto, ReviewDto } from "@product-reviews/shared";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    subcategory: product.subcategory,
    images: product.images,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    isActive: product.isActive,
    metadata: product.metadata as Record<string, unknown> | null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toReviewDto(
  review: Review & {
    authorName?: string | null;
    user?: { name: string | null } | null;
    votes?: ReviewVote[];
  },
  userId?: string,
): ReviewDto {
  const userVote =
    userId && review.votes
      ? (review.votes.find((v) => v.userId === userId)?.type ?? null)
      : null;
  return {
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    authorName:
      (review as { authorName?: string | null }).authorName ??
      review.user?.name ??
      null,
    rating: review.rating,
    title: review.title,
    content: review.content,
    images: review.images,
    pros: review.pros,
    cons: review.cons,
    helpfulCount: review.helpfulCount,
    notHelpfulCount: review.notHelpfulCount,
    userVote: userVote ?? null,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

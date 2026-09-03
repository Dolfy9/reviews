import { Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { UsersRepository } from "../users/users.repository";
import { toUserDto } from "../../common/mappers";
import { buildPaginatedResponse } from "../../common/pagination";
import { UserDto } from "@product-reviews/shared";
import type { ReviewListQuery } from "@product-reviews/shared";

@Injectable()
export class AdminService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findUsers(query: ReviewListQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.usersRepository.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.usersRepository.count(),
    ]);

    return buildPaginatedResponse(
      users.map((user) => toUserDto(user)),
      page,
      limit,
      total,
    );
  }

  async updateRole(userId: string, role: "USER" | "ADMIN"): Promise<UserDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updated = await this.usersRepository.update(userId, {
      role: role as Role,
    });
    return toUserDto(updated);
  }
}

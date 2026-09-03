import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateProfileInput, UserDto } from "@product-reviews/shared";
import { UsersRepository } from "./users.repository";
import { toUserDto } from "../../common/mappers";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return toUserDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileInput,
  ): Promise<UserDto> {
    const data: Parameters<typeof this.usersRepository.update>[1] = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    const user = await this.usersRepository.update(userId, data);
    return toUserDto(user);
  }
}

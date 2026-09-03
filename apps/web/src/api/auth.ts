import { api } from "./client";
import { RegisterInput, LoginInput, UserDto } from "@product-reviews/shared";

export const authApi = {
  register: (data: RegisterInput) =>
    api.post<UserDto>("/auth/register", data).then((res) => res.data),
  login: (data: LoginInput) =>
    api.post<UserDto>("/auth/login", data).then((res) => res.data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<UserDto>("/auth/me").then((res) => res.data),
};

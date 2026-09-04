import axios from "axios";

const FRIENDLY_ERRORS: Record<number, string> = {
  400: "The request was invalid. Please check your input and try again.",
  401: "Please sign in to continue.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "This already exists. Try a different approach.",
  422: "Some of the information provided was invalid.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. We're working on it!",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

export function friendlyErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status && FRIENDLY_ERRORS[status]) {
      return FRIENDLY_ERRORS[status];
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "The request took too long. Please try again.";
    }
    if (error.code === "ERR_NETWORK") {
      return "Can't connect to the server. Is it running?";
    }
    if (status) {
      return `Something went wrong (error ${status}). Please try again.`;
    }
    return "Network error. Please check your connection and try again.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

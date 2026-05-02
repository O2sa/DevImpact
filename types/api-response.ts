import { UserResult } from "./user-result";

export type ApiResponse = {
  success: boolean;
  users?: UserResult[];
  error?: string;
};
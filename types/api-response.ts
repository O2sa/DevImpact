import { UserResult } from "./user-result";

export type ApiResponse = {
  success: boolean;
  users?: UserResult[];
  winner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number;
  };
  languageWinner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number;
    selectedLanguages: string[];
  };
  error?: string;
};

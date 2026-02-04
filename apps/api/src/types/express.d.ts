import { TokenPayload } from "@/utils/jwt";

// Extend Express Request type to include id and user
declare namespace Express {
  export interface Request {
    id: string;
    user?: TokenPayload;
  }
}

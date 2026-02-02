// Extend Express Request type to include id
declare namespace Express {
  export interface Request {
    id: string;
  }
}

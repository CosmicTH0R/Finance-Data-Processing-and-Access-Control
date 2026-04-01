import { Request } from 'express';

export interface AuthPayload {
  id: string;
  role: 'VIEWER' | 'ANALYST' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {};

import { Request } from 'express';
import { IUser } from '../models/User';

export interface HealthResponse {
  status: string;
}

export interface AuthenticatedRequest extends Request {
  userId: string;
  user?: IUser;
}

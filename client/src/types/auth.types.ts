import { UserRole, AuthMethod } from '@expertmri/shared';

export interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  authMethod: AuthMethod;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
}

export function createAuthContext(user: User | null): AuthContext {
  return {
    user,
    isAuthenticated: user !== null,
  };
}


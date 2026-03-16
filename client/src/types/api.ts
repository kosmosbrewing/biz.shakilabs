export interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PublicConstants {
  siteUrl: string;
  feeDataUpdated: string;
  feeDataVerified: string;
  supportEmail: string;
}

export interface AuthSessionResponse {
  user: User | null;
}

export interface LoginResponse {
  user: User;
}

export interface ConstantsResponse {
  constants: Partial<PublicConstants>;
}

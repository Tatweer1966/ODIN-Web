export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  displayNameEn: string;
  displayNameAr: string;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}
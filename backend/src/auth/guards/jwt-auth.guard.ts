import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { verify } from "jsonwebtoken";
import { JwtPayload } from "../auth.types";

export interface AuthenticatedRequest extends Request {
  auth?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing access token");
    }

    const token = authorization.slice(7);
    const secret = this.config.get<string>("JWT_SECRET");

    if (!secret) {
      throw new UnauthorizedException("Authentication is not configured");
    }

    try {
      request.auth = verify(token, secret) as JwtPayload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}

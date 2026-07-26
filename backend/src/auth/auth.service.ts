import {
  Injectable,
  OnModuleDestroy,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { Pool } from "pg";
import { AuthenticatedUser, JwtPayload } from "./auth.types";
import { LoginDto } from "./dto/login.dto";

interface UserRow {
  id: string;
  username: string;
  email: string;
  display_name_en: string;
  display_name_ar: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly jwtSecret: string;

  constructor(config: ConfigService) {
    this.jwtSecret = config.get<string>(
      "JWT_SECRET",
      "odin_development_secret_change_before_production"
    );

    this.pool = new Pool({
      host: config.get<string>("DB_HOST", "localhost"),
      port: config.get<number>("DB_PORT", 55432),
      database: config.get<string>("DB_NAME", "odin"),
      user: config.get<string>("DB_USER", "odin"),
      password: config.get<string>("DB_PASSWORD", "odin_dev_password")
    });
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    user: AuthenticatedUser;
  }> {
    const result = await this.pool.query<UserRow>(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.display_name_en,
        u.display_name_ar,
        u.password_hash,
        u.is_active,
        u.must_change_password,
        r.code AS role
      FROM security.users u
      JOIN security.roles r ON r.id = u.role_id
      WHERE LOWER(u.username) = LOWER($1)
         OR LOWER(u.email) = LOWER($1)
      LIMIT 1
      `,
      [dto.username.trim()]
    );

    const row = result.rows[0];

    if (!row || !row.is_active) {
      throw new UnauthorizedException("Invalid username or password");
    }

    const passwordIsValid = await compare(dto.password, row.password_hash);

    if (!passwordIsValid) {
      throw new UnauthorizedException("Invalid username or password");
    }

    const permissions = await this.getPermissions(row.id);
    const user = this.mapUser(row, permissions);

    const payload: JwtPayload = {
      sub: row.id,
      username: row.username,
      role: row.role
    };

    const accessToken = sign(payload, this.jwtSecret, {
      expiresIn: "30m",
      issuer: "odin-web",
      audience: "odin-web-client"
    });

    await this.pool.query(
      "UPDATE security.users SET last_login_at = NOW() WHERE id = $1",
      [row.id]
    );

    return { accessToken, user };
  }

  async getUserById(id: string): Promise<AuthenticatedUser> {
    const result = await this.pool.query<UserRow>(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.display_name_en,
        u.display_name_ar,
        u.password_hash,
        u.is_active,
        u.must_change_password,
        r.code AS role
      FROM security.users u
      JOIN security.roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];

    if (!row || !row.is_active) {
      throw new UnauthorizedException("User is unavailable");
    }

    return this.mapUser(row, await this.getPermissions(row.id));
  }

  private async getPermissions(userId: string): Promise<string[]> {
    const result = await this.pool.query<{ code: string }>(
      `
      SELECT p.code
      FROM security.users u
      JOIN security.role_permissions rp ON rp.role_id = u.role_id
      JOIN security.permissions p ON p.id = rp.permission_id
      WHERE u.id = $1
      ORDER BY p.code
      `,
      [userId]
    );

    return result.rows.map((permission) => permission.code);
  }

  private mapUser(row: UserRow, permissions: string[]): AuthenticatedUser {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      displayNameEn: row.display_name_en,
      displayNameAr: row.display_name_ar,
      role: row.role,
      permissions,
      mustChangePassword: row.must_change_password
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

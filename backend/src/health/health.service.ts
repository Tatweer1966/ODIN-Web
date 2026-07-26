import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

export interface HealthStatus {
  application: string;
  status: "ok";
  database: "connected" | "unavailable";
  timestamp: string;
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new Pool({
      host: config.get<string>("DB_HOST", "localhost"),
      port: config.get<number>("DB_PORT", 55432),
      database: config.get<string>("DB_NAME", "odin"),
      user: config.get<string>("DB_USER", "odin"),
      password: config.get<string>("DB_PASSWORD", "odin_dev_password")
    });
  }

  async check(): Promise<HealthStatus> {
    let database: HealthStatus["database"] = "unavailable";
    try {
      await this.pool.query("SELECT 1");
      database = "connected";
    } catch {
      database = "unavailable";
    }

    return {
      application: "ODIN Web API",
      status: "ok",
      database,
      timestamp: new Date().toISOString()
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
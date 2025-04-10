import { exec } from "node:child_process";
import { config } from "dotenv";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import type { JestEnvironmentConfig } from "@jest/environment";
import NodeEnvironment from "jest-environment-node";

config({ path: ".env.testing" });

const execSync = promisify(exec);

export default class PrismaTestEnvironment extends NodeEnvironment {
  private schema: string;
  private connectionString: string;

  constructor(config: JestEnvironmentConfig) {
    super(config, undefined);
    const dbUser = process.env.DATABASE_USER;
    const dbPass = process.env.DATABASE_PASS;
    const dbHost = process.env.DATABASE_HOST;
    const dbPort = process.env.DATABASE_PORT;
    const dbName = process.env.DATABASE_NAME;

    this.schema = `test_${randomUUID()}`;
    this.connectionString = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?schema=${this.schema}`;
  }

  async setup() {
    process.env.DATABASE_URL = this.connectionString;
    this.global.process.env.DATABASE_URL = this.connectionString;

    await execSync("npx prisma migrate deploy");
    await execSync("npx ts-node prisma/seed-tests.ts");

    return super.setup();
  }

  async teardown() {
    const client = new Client({
      connectionString: this.connectionString,
    });

    await client.connect();
    await client.query(`DROP SCHEMA IF EXISTS "${this.schema}" CASCADE`);
    await client.end();
  }
}

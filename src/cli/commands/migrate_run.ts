#!/usr/bin/env node
import path from "path";
import fs from "fs";
import Schema from "../Schema";

const basePath = path.resolve(process.cwd(), "src/migrations");

async function runMigrations(options: string[]) {
  const files = fs.readdirSync(basePath).filter((file) => file.endsWith(".js"));
  for (const file of files) {
    const migrationPath = path.join(basePath, file);
    const migration = require(migrationPath).default;
    console.log(`🔄 Running: ${file}`);
    await migration.up(new Schema(options));
  }
}
module.exports = runMigrations;

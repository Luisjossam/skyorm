#!/usr/bin/env node
import path from "path";
import fs from "fs";
import pluralize from "pluralize";

function migrateCommand(args: string[]) {
  const name = args[0];
  const isPivot = args[1] ? args[1] === "pivot" : false;
  if (!name) {
    console.error("You must provide a name for migration.");
    process.exit(1);
  }
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  let name_table = `${pluralize.isSingular(name) ? pluralize.plural(name.toLowerCase()) : name.toLowerCase()}`;
  if (isPivot) name_table = name.toLowerCase();
  const fileName = `${timestamp}_migration_${name_table}_table.js`;
  const folder = "src/migrations";
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  const filePath = path.join(process.cwd(), folder, fileName);
  const content = `export default {
    up(schema) {
    schema.create("${name_table}", (table) => {
      table.increments("id");
      // table.timestamps();
      // table.softDeletes();
    });
     
    },
    down(schema) {
     schema.drop("${name_table}");
    }
  };`;

  fs.writeFileSync(filePath, content);
  console.log(`📝 Migration created: migrations/${fileName}`);
}

module.exports = migrateCommand;

#!/usr/bin/env node
import path from "path";
import fs from "fs";
import pluralize from "pluralize";

function migrateCommand(args: string[]) {
  if (!args[0] || args[0].includes("-") || args[0].includes("ext") || args[0].includes("-pivot") || args[0].includes("=")) {
    console.error("You must first specify the name of the migration");
    process.exit(1);
  }
  const name = args[0];
  let arg_two: string = "";
  if (args[1] && !args[1].includes("--pivot") && args[1] && !args[1].includes("--ext")) {
    console.error("The second argument must be --pivot or --ext=");
    process.exit(1);
  } else {
    arg_two = args[1] ?? "";
  }
  let arg_three: string = "";
  if (args[2] && !args[2].includes("--pivot") && args[2] && !args[2].includes("--ext")) {
    console.error("The third argument must be --pivot or --ext=");
    process.exit(1);
  } else if (args[2] && arg_two.includes(args[2])) {
    console.error("The third argument is the same as the second");
    process.exit(1);
  } else {
    arg_three = args[2] ?? "";
  }
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  let name_table = `${pluralize.isSingular(name) ? pluralize.plural(name.toLowerCase()) : name.toLowerCase()}`;
  if ([arg_two, arg_three].includes("--pivot")) name_table = name.toLowerCase();
  let extension: string = "ts";
  if (arg_two.includes("--ext=")) extension = arg_two.split("=")[1];
  if (arg_three.includes("--ext=")) extension = arg_three.split("=")[1];
  if (!["ts", "js"].includes(extension)) {
    console.error("The extension must be ts or js");
    process.exit(1);
  }
  const fileName = `${timestamp}_migration_${name_table}_table.${extension}`;
  const folder = "src/migrations";
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  const filePath = path.join(process.cwd(), folder, fileName);
  let content = `
    import Schema from "skyorm/src/cli/Schema";
    export default {
      up(schema: Schema) {
        return schema.create("${name_table}", (table) => {
          table.increments("id");
          // table.timestamps();
          // table.softDeletes();
        });
      },
      down(schema: Schema) {
        return schema.drop("${name_table}", (table) => {
          table.dropColumn("id")
        });
      }
    };
  `;
  if (extension === "js") {
    content = `
      export default {
        up(schema) {
          schema.create("${name_table}", (table) => {
            table.increments("id");
            // table.timestamps();
            // table.softDeletes();
          });
        },
        down(schema) {
          schema.drop("${name_table}", (table) => {
            table.dropColumn("id")
          });
        }
      };
    `;
  }

  fs.writeFileSync(filePath, content);
  console.log(`📝 Migration created: migrations/${fileName}`);
}

module.exports = migrateCommand;

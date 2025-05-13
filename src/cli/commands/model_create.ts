import path from "path";
import fs from "fs";

async function model_create(args: string[]) {
  if (!args[0] || args[0].includes("-") || args[0].includes("ext") || args[0].includes("=")) {
    console.error("You must first specify the name of the model");
    process.exit(1);
  }
  const name = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
  let arg_two: string = "";
  if (args[1] && !args[1].includes("--ext")) {
    console.error("The second argument must be --ext=");
    process.exit(1);
  } else {
    arg_two = args[1] ?? "";
  }
  let extension: string = "ts";
  if (arg_two.includes("--ext=")) extension = arg_two.split("=")[1];
  if (!["ts", "js"].includes(extension)) {
    console.error("The extension must be .ts or .js");
    process.exit(1);
  }
  const fileName = `${name}Model.${extension}`;
  const existModel = checkIfExistModel(`${name}Model`);
  if (existModel) {
    console.error(`The ${name} model already exists`);
    process.exit(1);
  }
  const folder = "src/models";
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  const filePath = path.join(process.cwd(), folder, fileName);
  let content = `
    import { Model } from "skyorm";
    class ${name}Model extends Model {

    }
    export default ${name}Model;
 `;
  if (extension === "js") {
    content = `
    class ${name}Model extends Model {

    }
    export default ${name}Model;
    `;
  }
  fs.writeFileSync(filePath, content);
  console.log(`📝 Model created: models/${fileName}`);
}
function checkIfExistModel(name: string): boolean {
  try {
    const basePath = path.resolve(process.cwd(), "src/models");
    const files = fs.readdirSync(basePath);
    for (const file of files) {
      if (file.includes(name)) return true;
    }
    return false;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
module.exports = model_create;

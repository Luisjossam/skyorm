import Builder from "./Builder";

class ColumnBuilder {
  private table: Builder;
  null_value: string = "NOT NULL";
  private text_column: string = "";
  default_value: string = "";
  name: string = "";
  unique_value: string = "";
  check_value: string = "";
  constructor(table: Builder) {
    this.table = table;
  }
  set_values(name: string, text: string): this {
    this.name = name;
    this.text_column = text;
    return this;
  }
  generate_sql() {
    return `${this.name} ${this.text_column} ${this.unique_value} ${this.null_value} ${this.check_value} ${this.default_value}`;
  }
  generate_sql_update() {
    return `ADD COLUMN ${this.generate_sql()}`;
  }
}
export default ColumnBuilder;

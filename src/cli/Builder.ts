import ColumnBuilder from "./ColumnBuilder";

class Builder {
  private primaryKey?: string;
  private readonly columns: ColumnBuilder[] = [];
  private lastColumn?: ColumnBuilder;
  constructor(
    private tableName: string,
    private driver: "mysql" | "sqlite" | "postgres",
  ) {}
  primary_key() {
    if (this.lastColumn) {
      this.primaryKey = this.lastColumn.name;
    }
  }
  increments(name: string) {
    if (name === "") {
      throw new Error("Column name required in increments method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values(name, "INT AUTO_INCREMENT");
        break;
      case "postgres":
        column = new ColumnBuilder(this).set_values(name, "BIGSERIAL");
        break;
      case "sqlite":
        column = new ColumnBuilder(this).set_values(name, "INTEGER PRIMARY KEY AUTOINCREMENT");
        break;
      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    return this;
  }
  string(name: string, long: number) {
    if (name === "") {
      throw new Error("Column name required in string method");
    }
    if (long > 255) {
      throw new Error("The limit of a column of type varchar is 255, if you require more of 255 characters use text()");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
      case "postgres": {
        column = new ColumnBuilder(this).set_values(name, `VARCHAR(${long})`);
        break;
      }
      default: {
        throw new Error("Unsupported driver");
      }
    }
    this.columns.push(column);
    this.lastColumn = column;
    return this;
  }
  int(name: string) {
    if (name === "") {
      throw new Error("Column name required in int method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, `INT`);
        break;
      }
      default: {
        throw new Error("Unsupported driver");
      }
    }
    this.columns.push(column);
    this.lastColumn = column;
    return this;
  }
  null(): this {
    if (this.lastColumn) {
      this.lastColumn.null_value = "NULL";
    }
    return this;
  }
  default(value: string | number | boolean | Date): this {
    if (this.lastColumn) {
      let val: string = "";
      if (typeof value === "string")
        if (value.trim() === "CURRENT_TIMESTAMP") {
          val = "CURRENT_TIMESTAMP ";
        } else if (value.trim() === "CURRENT_DATE") {
          val = "CURRENT_DATE";
        } else {
          val = `'${value.trim()}'`;
        }
      if (typeof value === "number") val = value.toString();
      if (typeof value === "boolean") val = value ? "TRUE" : "FALSE";
      this.lastColumn.default_value = `DEFAULT ${val}`;
    }
    return this;
  }
  unique(): this {
    if (this.lastColumn) {
      this.lastColumn.unique_value = "UNIQUE";
    }
    return this;
  }
  check_like_between(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '%${value}%')`;
    }
    return this;
  }
  check_like_start(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '${value}%')`;
    }
    return this;
  }
  check_like_end(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '%${value}')`;
    }
    return this;
  }
  check_like(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '${value}')`;
    }
    return this;
  }
  check_between_equal(value_1: number, value_2: number) {
    if (this.lastColumn) {
      if (!value_1 || !value_2) {
        throw new Error(`One or both values are required in the check_between_equal method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (typeof value_1 === "string") {
        if (isNaN(value_1) || !Number.isInteger(parseFloat(value_1))) throw new Error(`Value 1 is not a valid integer: ${value_1}`);
      }
      if (typeof value_2 === "string") {
        if (isNaN(value_2) || !Number.isInteger(parseFloat(value_2))) throw new Error(`Value 2 is not a valid integer: ${value_2}`);
      }
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} >= ${value_1} AND ${this.lastColumn.name} <= ${value_2})`;
    }
    return this;
  }
  check_between(value_1: number, value_2: number) {
    if (this.lastColumn) {
      if (!value_1 || !value_2) {
        throw new Error(`One or both values are required in the check_between_equal method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (typeof value_1 === "string") {
        if (isNaN(value_1) || !Number.isInteger(parseFloat(value_1))) throw new Error(`Value 1 is not a valid integer: ${value_1}`);
      }
      if (typeof value_2 === "string") {
        if (isNaN(value_2) || !Number.isInteger(parseFloat(value_2))) throw new Error(`Value 2 is not a valid integer: ${value_2}`);
      }
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} > ${value_1} AND ${this.lastColumn.name} < ${value_2})`;
    }
    return this;
  }
  check_greater_than(value_1: number) {
    if (this.lastColumn) {
      if (!value_1) {
        throw new Error(`Value are required in the check_greater_than method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (typeof value_1 === "string") {
        if (isNaN(value_1) || !Number.isInteger(parseFloat(value_1))) throw new Error(`Value is not a valid integer: ${value_1}`);
      }
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} > ${value_1})`;
    }
    return this;
  }
  check_greater_equal_than(value_1: number) {
    if (this.lastColumn) {
      if (!value_1) {
        throw new Error(`Value are required in the check_greater_than method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (typeof value_1 === "string") {
        if (isNaN(value_1) || !Number.isInteger(parseFloat(value_1))) throw new Error(`Value is not a valid integer: ${value_1}`);
      }
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} >= ${value_1})`;
    }
    return this;
  }
  sql() {
    const columns_string = this.columns.map((i) => i.generate_sql().trim());
    let sql = "";
    switch (this.driver) {
      case "mysql": {
        sql = `CREATE TABLE ${this.tableName} (${columns_string}`;
        if (this.primaryKey) sql += `, PRIMARY KEY (${this.primaryKey})`;
        sql += ");";
        break;
      }

      default:
        break;
    }
    return sql;
  }
}
export default Builder;

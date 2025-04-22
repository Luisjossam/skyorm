import ColumnBuilder from "./ColumnBuilder";

class Builder {
  private primaryKey?: string;
  private readonly columns: ColumnBuilder[] = [];
  private lastColumn?: ColumnBuilder;
  private type_column: string = "";
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
    this.type_column = "increments";
    return this;
  }
  date(name: string) {
    if (name === "") {
      throw new Error("Column name required in date method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values(name, "DATE");
        break;
      case "postgres":
        column = new ColumnBuilder(this).set_values(name, "DATE");
        break;
      case "sqlite":
        column = new ColumnBuilder(this).set_values(name, "DATE");
        break;
      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "date";
    return this;
  }
  string(name: string, long: number) {
    if (!name || !long) {
      throw new Error(`One or both values are required in the string method`);
    }
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
    this.type_column = "string";
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
    this.type_column = "int";
    return this;
  }
  decimal(name: string, length: number | string, decimal_length: number | string) {
    if (!length || !decimal_length) {
      throw new Error(`One or all values are required in the decimal methods`);
    }
    if (name === "") {
      throw new Error('Column name required in decimal method: decimal("", ..., ...)');
    }
    if (typeof length === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(length.trim()) || !Number.isInteger(parseFloat(length)))
        throw new Error(`The length value has to be an integer: decimal(..., "${length}", ...)`);
    }
    if (typeof decimal_length === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(decimal_length.trim()) || !Number.isInteger(parseFloat(decimal_length)))
        throw new Error(`The value of the decimal length has to be an integer: decimal(..., ..., "${decimal_length}")`);
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, `DECIMAL(${length}, ${decimal_length})`);
        break;
      }
      default: {
        throw new Error("Unsupported driver");
      }
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "decimal";
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
  check_between_equal(value_1: number | string, value_2: number | string): this {
    if (this.lastColumn) {
      if (!value_1 || !value_2) {
        throw new Error(`One or both values are required in the check_between_equal method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (this.type_column === "int" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
          throw new Error(`Value 1 is not a valid integer: check_between_equal("${value_1}", ...)`);
      }
      if (this.type_column === "int" && typeof value_2 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_2.trim()) || !Number.isInteger(parseFloat(value_2)))
          throw new Error(`Value 2 is not a valid integer: check_between_equal(..., "${value_2}")`);
      }
      if (this.type_column === "decimal" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid number: check_between_equal("${value_1}", ...)`);
      }
      if (this.type_column === "decimal" && typeof value_2 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid number: check_between_equal(..., "${value_2}")`);
      }
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} >= ${value_1} AND ${this.lastColumn.name} <= ${value_2})`;
    }
    return this;
  }
  check_between(value_1: number | string, value_2: number | string): this {
    if (this.lastColumn) {
      if (!value_1 || !value_2) {
        throw new Error(`One or both values are required in the check_between method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (this.type_column === "int" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
          throw new Error(`Value 1 is not a valid integer: check_between("${value_1}", ...)`);
      }
      if (this.type_column === "int" && typeof value_2 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_2.trim()) || !Number.isInteger(parseFloat(value_2)))
          throw new Error(`Value 2 is not a valid integer: check_between(..., "${value_2}")`);
      }
      if (this.type_column === "decimal" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid number: check_between("${value_1}", ...)`);
      }
      if (this.type_column === "decimal" && typeof value_2 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid number: check_between(..., "${value_2}")`);
      }
      if (this.type_column === "date" && typeof value_1 === "string") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid date: check_between("${value_1}", ...)`);
      }
      if (this.type_column === "date" && typeof value_2 === "string") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid date: check_between(..., "${value_2}")`);
      }
      const result_value_1 = this.type_column === "date" ? `'${value_1}'` : value_1;
      const result_value_2 = this.type_column === "date" ? `'${value_2}'` : value_2;
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} BETWEEN ${result_value_1} AND ${result_value_2})`;
    }
    return this;
  }
  check_greater_than(value_1: number | string): this {
    if (this.lastColumn) {
      if (!value_1) {
        throw new Error(`Value are required in the check_greater_than method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (this.type_column === "int" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
          throw new Error(`Value is not a valid integer: check_greater_than("${value_1}")`);
      }
      if (this.type_column === "decimal" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_greater_than("${value_1}")`);
      }
      if (this.type_column === "date" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_greater_than("${value_1}")`);
      }
      const result_value_1 = this.type_column === "date" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} > ${result_value_1})`;
    }
    return this;
  }
  check_greater_equal_than(value_1: number | string): this {
    if (this.lastColumn) {
      if (!value_1) {
        throw new Error(`Value are required in the check_greater_equal_than method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (this.type_column === "int" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
          throw new Error(`Value is not a valid integer: check_greater_equal_than("${value_1}")`);
      }
      if (this.type_column === "decimal" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_greater_equal_than("${value_1}")`);
      }
      if (this.type_column === "date" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_greater_than("${value_1}")`);
      }
      const result_value_1 = this.type_column === "date" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} >= ${result_value_1})`;
    }
    return this;
  }
  check_less_than(value_1: number | string): this {
    if (this.lastColumn) {
      if (!value_1) {
        throw new Error(`Value are required in the check_less_than method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (this.type_column === "int" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
          throw new Error(`Value is not a valid integer: check_less_than("${value_1}")`);
      }
      if (this.type_column === "decimal" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_less_than("${value_1}")`);
      }
      if (this.type_column === "date" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_greater_than("${value_1}")`);
      }
      const result_value_1 = this.type_column === "date" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} < ${result_value_1})`;
    }
    return this;
  }
  check_less_equal_than(value_1: number | string): this {
    if (this.lastColumn) {
      if (!value_1) {
        throw new Error(`Value are required in the check_less_equal_than method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (this.type_column === "int" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
          throw new Error(`Value is not a valid integer: check_less_equal_than("${value_1}")`);
      }
      if (this.type_column === "decimal" && typeof value_1 === "string") {
        if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_less_equal_than("${value_1}")`);
      }
      if (this.type_column === "date" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_greater_than("${value_1}")`);
      }
      const result_value_1 = this.type_column === "date" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} <= ${result_value_1})`;
    }
    return this;
  }
  check_length(value: number): this {
    if (this.lastColumn) {
      if (!value) {
        throw new Error(`Value are required in the check_length method: COLUMN: ${this.lastColumn.name}`);
      }
      if (typeof value === "string") {
        if (isNaN(value) || !Number.isInteger(parseFloat(value))) throw new Error(`Value is not a valid integer: ${value}`);
      }
      this.lastColumn.check_value = `CHECK (length(${this.lastColumn.name}) > ${value})`;
    }
    return this;
  }
  check_compare(value_1: number | string, value_2: number | string): this {
    if (this.lastColumn) {
      if (!value_1 || !value_2) {
        throw new Error(`One or both values are required in the check_compare method: COLUMN: ${this.lastColumn?.name}`);
      }
      if (this.type_column === "date" && typeof value_1 === "string") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid date: check_compare("${value_1}", ...)`);
      }
      if (this.type_column === "date" && typeof value_2 === "string") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid date: check_compare(..., "${value_2}")`);
      }
      const result_value_1 = this.type_column === "date" ? `'${value_1}'` : value_1;
      const result_value_2 = this.type_column === "date" ? `'${value_2}'` : value_2;
      this.lastColumn.check_value = `CHECK (${result_value_1} <= ${result_value_2})`;
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

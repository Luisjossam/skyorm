import ColumnBuilder from "./ColumnBuilder";
type TEngine = "InnoDB" | "MyISAM" | "MEMORY" | "ARCHIVE" | "CSV";
type TCharset = "utf8mb4" | "utf8" | "latin1" | "utf16" | "ucs2";

class Builder {
  private primary_key?: string;
  private readonly columns: ColumnBuilder[] = [];
  private lastColumn?: ColumnBuilder;
  private type_column: string = "";
  private type_engine: string = "";
  private type_charset: string = "";
  private readonly drop_columns: string[] = [];
  constructor(
    private readonly tableName: string,
    private readonly driver: "mysql" | "sqlite" | "postgres",
  ) {}
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
  bigInt(name: string) {
    if (name === "") {
      throw new Error("Column name required in bigInt method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values(name, "BIGINT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "bigInt";
    return this;
  }
  tinyInt(name: string) {
    if (name === "") {
      throw new Error("Column name required in tinyInt method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values(name, "TINYINT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "tinyInt";
    return this;
  }
  boolean(name: string) {
    if (name === "") {
      throw new Error("Column name required in boolean method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values(name, "TINYINT(1)");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "boolean";
    return this;
  }
  text(name: string) {
    if (name === "") {
      throw new Error("Column name required in text method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values(name, "TEXT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "text";
    return this;
  }
  longText(name: string) {
    if (name === "") {
      throw new Error("Column name required in longText method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values(name, "LONGTEXT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "longText";
    return this;
  }
  float(name: string, precision?: number, scale: number = 2) {
    if (name === "") {
      throw new Error("Column name required in float method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        const float_type = precision ? `FLOAT(${precision},${scale})` : "FLOAT";
        column = new ColumnBuilder(this).set_values(name, float_type);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "float";
    return this;
  }
  double(name: string, precision?: number, scale: number = 2) {
    if (name === "") {
      throw new Error("Column name required in double method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        const float_type = precision ? `DOUBLE(${precision},${scale})` : "DOUBLE";
        column = new ColumnBuilder(this).set_values(name, float_type);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "double";
    return this;
  }
  binary(name: string) {
    if (name === "") {
      throw new Error("Column name required in binary method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "BINARY");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "binary";
    return this;
  }
  uuid(name: string) {
    if (name === "") {
      throw new Error("Column name required in uuid method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "CHAR(36)");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "uuid";
    return this;
  }
  json(name: string) {
    if (name === "") {
      throw new Error("Column name required in json method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "JSON");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "json";
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
  time(name: string) {
    if (name === "") {
      throw new Error("Column name required in time method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "TIME");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "time";
    return this;
  }
  datetime(name: string) {
    if (name === "") {
      throw new Error("Column name required in datetime method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "DATETIME");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "datetime";
    return this;
  }
  timestamp(name: string) {
    if (name === "") {
      throw new Error("Column name required in timestamp method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "TIMESTAMP");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "timestamp";
    return this;
  }
  year(name: string) {
    if (name === "") {
      throw new Error("Column name required in year method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "YEAR");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "year";
    return this;
  }
  enum(name: string, values: string[]) {
    if (name === "") throw new Error("Column name required in enum method");
    if (!values) throw new Error("The array of values in the enum is necessary");
    if (values.length === 0) throw new Error("At least one value is required in the enum array");
    let column: ColumnBuilder;
    const vls = values.map((i) => `'${i}'`).join(", ");
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, `ENUM(${vls})`);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "enum";
    return this;
  }
  set(name: string, values: string[]) {
    if (name === "") throw new Error("Column name required in set method");
    if (!values) throw new Error("The array of values in the enum is necessary");
    if (values.length === 0) throw new Error("At least one value is required in the enum array");
    let column: ColumnBuilder;
    const vls = values.map((i) => `'${i}'`).join(", ");
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, `SET(${vls})`);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "set";
    return this;
  }
  char(name: string, length: number) {
    if (name === "") {
      throw new Error("Column name required in char method");
    }
    if (!length || length <= 0) throw new Error("The length value of the char method must be greater than 0");
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, `CHAR(${length})`);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "char";
    return this;
  }
  mediumText(name: string) {
    if (name === "") {
      throw new Error("Column name required in mediumText method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "MEDIUMTEXT");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "mediumText";
    return this;
  }
  smallInt(name: string) {
    if (name === "") {
      throw new Error("Column name required in smallInt method");
    }
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql": {
        column = new ColumnBuilder(this).set_values(name, "SMALLINT");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    this.columns.push(column);
    this.lastColumn = column;
    this.type_column = "smallInt";
    return this;
  }
  string(name: string, long: number = 255) {
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
  timestamps() {
    let created_at: ColumnBuilder;
    let updated_at: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        created_at = new ColumnBuilder(this).set_values("created_at", "TIMESTAMP");
        updated_at = new ColumnBuilder(this).set_values("updated_at", "TIMESTAMP");
        break;

      default: {
        throw new Error("Unsupported driver");
      }
    }
    this.columns.push(created_at);
    this.columns.push(updated_at);
  }
  softDeletes() {
    let column: ColumnBuilder;
    switch (this.driver) {
      case "mysql":
        column = new ColumnBuilder(this).set_values("deleted_at", "TIMESTAMP");
        break;

      default: {
        throw new Error("Unsupported driver");
      }
    }
    this.columns.push(column);
  }
  engine(type: TEngine) {
    let column: string = "";
    switch (this.driver) {
      case "mysql":
        column = `ENGINE = ${type}`;
        break;

      default:
        break;
    }
    this.type_engine = column;
  }
  charset(type: TCharset) {
    let column: string = "";
    switch (this.driver) {
      case "mysql":
        column = `DEFAULT CHARSET = ${type}`;
        break;

      default:
        break;
    }
    this.type_charset = column;
  }
  primaryKey(): this {
    if (this.lastColumn) {
      this.primary_key = this.lastColumn.name;
    }
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
  checkLikeBetween(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '%${value}%')`;
    }
    return this;
  }
  checkLikeStart(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '${value}%')`;
    }
    return this;
  }
  checkLikeEnd(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '%${value}')`;
    }
    return this;
  }
  checkLike(value: string): this {
    if (this.lastColumn) {
      this.lastColumn.check_value = `CHECK (${this.lastColumn.name} LIKE '${value}')`;
    }
    return this;
  }
  checkBetweenEqual(value_1: number | string, value_2: number | string): this {
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
  checkBetween(value_1: number | string, value_2: number | string): this {
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
  checkGreaterThan(value_1: number | string): this {
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
  checkGreaterEqualThan(value_1: number | string): this {
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
  checkLessThan(value_1: number | string): this {
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
  checkLessEqualThan(value_1: number | string): this {
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
  checkLength(value: number): this {
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
  checkCompare(value_1: number | string, value_2: number | string): this {
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
  dropColumn(name_column: string) {
    switch (this.driver) {
      case "mysql": {
        const query = `DROP COLUMN ${name_column}`;
        this.drop_columns.push(query);
        break;
      }

      default:
        break;
    }
  }
  sql() {
    const columns_string = this.columns.map((i) => i.generate_sql().trim());
    let sql = "";
    switch (this.driver) {
      case "mysql": {
        sql = `CREATE TABLE ${this.tableName} (${columns_string}`;
        if (this.primary_key) sql += `, PRIMARY KEY (${this.primary_key})`;
        sql += ")";
        if (this.type_engine !== "") sql += ` ${this.type_engine}`;
        if (this.type_charset !== "") sql += ` ${this.type_charset}`;
        sql += ";";
        break;
      }

      default:
        break;
    }
    return sql;
  }
  sql_update(): string {
    try {
      const columns_string = this.columns.map((i) => i.generate_sql_update().trim());
      let sql = "";
      switch (this.driver) {
        case "mysql": {
          sql = `ALTER TABLE ${this.tableName} ${columns_string}`;
          if (this.primary_key) sql += `, PRIMARY KEY (${this.primary_key})`;
          break;
        }
        case "postgres": {
          break;
        }
        default:
          break;
      }
      return sql;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  sql_drop(): string {
    try {
      let sql = "";
      switch (this.driver) {
        case "mysql":
          sql = `ALTER TABLE ${this.tableName} ${this.drop_columns}`;
          break;
        case "postgres":
          break;
        default:
          break;
      }
      return sql;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  sql_delete_table(): string {
    try {
      let sql = "";
      switch (this.driver) {
        case "mysql":
          sql = `DROP TABLE ${this.tableName}`;
          break;
        case "postgres":
          break;
        default:
          break;
      }
      return sql;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
export default Builder;

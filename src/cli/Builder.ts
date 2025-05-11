import BuilderSQL from "./BuilderSQL";
import ColumnBuilder from "./ColumnBuilder";
import {
  ColumnBigInt,
  ColumnBinary,
  ColumnBoolean,
  ColumnChar,
  ColumnDate,
  ColumnDatetime,
  ColumnDecimal,
  ColumnDouble,
  ColumnEnum,
  ColumnFloat,
  ColumnIncrements,
  ColumnInt,
  ColumnJson,
  ColumnLongText,
  ColumnMediumText,
  ColumnSet,
  ColumnSmallInt,
  ColumnString,
  ColumnText,
  ColumnTime,
  ColumnTimestamp,
  ColumnTinyInt,
  ColumnUuid,
  ColumnYear,
} from "./interfaces/Interfaces";
type TDriver = "mysql" | "sqlite" | "postgres";
type TEngine = "InnoDB" | "MyISAM" | "MEMORY" | "ARCHIVE" | "CSV";
type TCharset = "utf8mb4" | "utf8" | "latin1" | "utf16" | "ucs2";
class Builder {
  private readonly tableName: string = "";
  private readonly driver: TDriver = "mysql";
  constructor(tableName: string, driver: TDriver) {
    this.tableName = tableName;
    this.driver = driver;
  }
  increments(name: string): ColumnIncrements {
    if (name === "") {
      throw new Error("Column name required in increments method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base(name, `INT AUTO_INCREMENT`);
        break;
      case "postgres":
        column = this.generate_column_base(name, `BIGSERIAL`);
        break;
      case "sqlite":
        column = this.generate_column_base(name, `INTEGER PRIMARY KEY AUTOINCREMENT`);
        break;
      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  bigInt(name: string): ColumnBigInt {
    if (name === "") {
      throw new Error("Column name required in bigInt method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base(name, "BIGINT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  tinyInt(name: string): ColumnTinyInt {
    if (name === "") {
      throw new Error("Column name required in tinyInt method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base(name, "TINYINT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  boolean(name: string): ColumnBoolean {
    if (name === "") {
      throw new Error("Column name required in boolean method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base(name, "TINYINT(1)");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  text(name: string): ColumnText {
    if (name === "") {
      throw new Error("Column name required in text method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base(name, "TEXT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  longText(name: string): ColumnLongText {
    if (name === "") {
      throw new Error("Column name required in longText method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base(name, "LONGTEXT");
        break;

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  float(name: string, precision?: number, scale: number = 2): ColumnFloat {
    if (name === "") {
      throw new Error("Column name required in float method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        const float_type = precision ? `FLOAT(${precision},${scale})` : "FLOAT";
        column = this.generate_column_base(name, float_type);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  double(name: string, precision?: number, scale: number = 2): ColumnDouble {
    if (name === "") {
      throw new Error("Column name required in double method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        const float_type = precision ? `DOUBLE(${precision},${scale})` : "DOUBLE";
        column = this.generate_column_base(name, float_type);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  binary(name: string): ColumnBinary {
    if (name === "") {
      throw new Error("Column name required in binary method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "BINARY");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  uuid(name: string): ColumnUuid {
    if (name === "") {
      throw new Error("Column name required in uuid method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "CHAR(36)");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  json(name: string): ColumnJson {
    if (name === "") {
      throw new Error("Column name required in json method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "JSON");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  date(name: string): ColumnDate {
    if (name === "") {
      throw new Error("Column name required in date method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base(name, "DATE");
        break;
      case "postgres":
        column = this.generate_column_base(name, "DATE");
        break;
      case "sqlite":
        column = this.generate_column_base(name, "DATE");
        break;
      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  time(name: string): ColumnTime {
    if (name === "") {
      throw new Error("Column name required in time method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "TIME");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  datetime(name: string): ColumnDatetime {
    if (name === "") {
      throw new Error("Column name required in datetime method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "DATETIME");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  timestamp(name: string): ColumnTimestamp {
    if (name === "") {
      throw new Error("Column name required in timestamp method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "TIMESTAMP");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  year(name: string): ColumnYear {
    if (name === "") {
      throw new Error("Column name required in year method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "YEAR");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  enum(name: string, values: string[]): ColumnEnum {
    if (name === "") throw new Error("Column name required in enum method");
    if (!values) throw new Error("The array of values in the enum is necessary");
    if (values.length === 0) throw new Error("At least one value is required in the enum array");
    let column: string;
    const vls = values.map((i) => `'${i}'`).join(", ");
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, `ENUM(${vls})`);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  set(name: string, values: string[]): ColumnSet {
    if (name === "") throw new Error("Column name required in set method");
    if (!values) throw new Error("The array of values in the enum is necessary");
    if (values.length === 0) throw new Error("At least one value is required in the enum array");
    let column: string;
    const vls = values.map((i) => `'${i}'`).join(", ");
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, `SET(${vls})`);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  char(name: string, length: number): ColumnChar {
    if (name === "") {
      throw new Error("Column name required in char method");
    }
    if (!length || length <= 0) throw new Error("The length value of the char method must be greater than 0");
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, `CHAR(${length})`);
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  mediumText(name: string): ColumnMediumText {
    if (name === "") {
      throw new Error("Column name required in mediumText method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "MEDIUMTEXT");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  smallInt(name: string): ColumnSmallInt {
    if (name === "") {
      throw new Error("Column name required in smallInt method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, "SMALLINT");
        break;
      }

      default:
        throw new Error("Unsupported driver");
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  string(name: string, long: number = 255): ColumnString {
    if (!name || !long) {
      throw new Error(`One or both values are required in the string method`);
    }
    if (name === "") {
      throw new Error("Column name required in string method");
    }
    if (long > 255) {
      throw new Error("The limit of a column of type varchar is 255, if you require more of 255 characters use text()");
    }
    let column: string = "";
    switch (this.driver) {
      case "mysql":
      case "postgres": {
        column = this.generate_column_base(name, `VARCHAR(${long})`);
        break;
      }
      default: {
        throw new Error("Unsupported driver");
      }
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  int(name: string): ColumnInt {
    if (name === "") {
      throw new Error("Column name required in int method");
    }
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, `INT`);
        break;
      }
      default: {
        throw new Error("Unsupported driver");
      }
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  decimal(name: string, length: number | string, decimal_length: number | string): ColumnDecimal {
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
    let column: string;
    switch (this.driver) {
      case "mysql": {
        column = this.generate_column_base(name, `DECIMAL(${length}, ${decimal_length})`);
        break;
      }
      default: {
        throw new Error("Unsupported driver");
      }
    }
    BuilderSQL.pushColumn(column);
    return new ColumnBuilder(column, this.tableName, this.driver);
  }
  timestamps() {
    let created_at: string;
    let updated_at: string;
    switch (this.driver) {
      case "mysql":
        created_at = this.generate_column_base("created_at", "TIMESTAMP");
        updated_at = this.generate_column_base("updated_at", "TIMESTAMP");
        break;

      default: {
        throw new Error("Unsupported driver");
      }
    }
    BuilderSQL.pushColumn(created_at);
    BuilderSQL.pushColumn(updated_at);
  }
  softDeletes() {
    let column: string;
    switch (this.driver) {
      case "mysql":
        column = this.generate_column_base("deleted_at", "TIMESTAMP");
        break;

      default: {
        throw new Error("Unsupported driver");
      }
    }
    BuilderSQL.pushColumn(column);
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
    BuilderSQL.setEngine(column);
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
    BuilderSQL.setCharset(column);
  }
  dropColumn(name: string) {
    let query = "";
    switch (this.driver) {
      case "mysql": {
        query = `DROP COLUMN ${name}`;
        break;
      }

      default:
        break;
    }
    BuilderSQL.setDropColumn(query);
  }
  private generate_column_base(name: string, complement: string) {
    return `${name} ${complement}`;
  }
}
export default Builder;

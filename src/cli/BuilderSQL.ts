interface IColumn {
  sql: string;
  primary_key?: boolean;
  null?: boolean;
  default?: string;
  unique?: boolean;
  check_like?: string;
  unsigned?: boolean;
}
type keyColumn = "primary_key" | "null" | "default" | "unique" | "check_like" | "unsigned";
class BuilderSQL {
  private static readonly columns: IColumn[] = [];
  private static type_engine: string = "";
  private static type_charset: string = "";
  private static drops_columns: string[] = [];
  static setEngine(type: string) {
    this.type_engine = type;
  }
  static setCharset(type: string) {
    this.type_charset = type;
  }
  static pushColumn(col: string) {
    this.columns.push({
      sql: col,
    });
  }
  static setDropColumn(column: string) {
    this.drops_columns.push(column);
  }
  static setValue(name_column: string, key: keyColumn, value?: string) {
    const colIndex = this.columns.findIndex((i) => i.sql === name_column);
    const col = this.columns[colIndex];
    switch (key) {
      case "primary_key":
        col.primary_key = true;
        break;
      case "null":
        col.null = true;
        break;
      case "default":
        col.default = value;
        break;
      case "unique":
        col.unique = true;
        break;
      case "check_like":
        col.check_like = value;
        break;
      case "unsigned":
        col.unsigned = true;
        break;
      default:
        break;
    }
  }
  static builder_create(tableName: string, driver: string) {
    const columns_string = this.columns.map((i) => this.generateColumnSQL(i));
    const primary_keys = this.columns.filter((i) => i.primary_key);

    let sql = "";
    switch (driver) {
      case "mysql":
        sql = `CREATE TABLE ${tableName} (${columns_string}`;
        if (primary_keys.length > 0) sql += `, PRIMARY KEY (${this.columns.map((i) => i.sql.split(" ")[0]).join(", ")})`;
        sql += ")";
        if (this.type_engine !== "") sql += ` ${this.type_engine}`;
        if (this.type_charset !== "") sql += ` ${this.type_charset}`;
        break;

      default:
        break;
    }
    return sql;
  }
  static builder_update(tableName: string, driver: string) {
    const columns_string = this.columns.map((i) => this.generateUpdateColumnSQL(i));
    const primary_keys = this.columns.filter((i) => i.primary_key);
    let sql = "";
    switch (driver) {
      case "mysql":
        sql = `ALTER TABLE ${tableName} ${columns_string}`;
        if (primary_keys.length > 0) sql += `, PRIMARY KEY (${this.columns.map((i) => i.sql.split(" ")[0]).join(", ")})`;
        break;

      default:
        break;
    }
    return sql;
  }
  static builder_drop(tableName: string, driver: string) {
    try {
      let sql = "";
      switch (driver) {
        case "mysql":
          sql = `ALTER TABLE ${tableName} ${this.drops_columns.join(", ")}`;
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
  static builder_drop_table(tableName: string, driver: string) {
    try {
      let sql = "";
      switch (driver) {
        case "mysql":
          sql = `DROP TABLE ${tableName}`;
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
  private static generateColumnSQL(col: IColumn) {
    let column = `${col.sql}`;
    if (col.unsigned) column += ` ${col.unsigned}`;
    if (col.null) column += " NULL";
    if (col.default) column += ` DEFAULT ${col.default}`;
    if (col.check_like) column += ` ${col.check_like}`;
    if (col.unique) column += " UNIQUE";
    return column;
  }
  private static generateUpdateColumnSQL(col: IColumn) {
    let column = `ADD COLUMN ${col.sql}`;
    if (col.unsigned) column += ` ${col.unsigned}`;
    if (col.null) column += " NULL";
    if (col.default) column += ` DEFAULT ${col.default}`;
    if (col.check_like) column += ` ${col.check_like}`;
    if (col.unique) column += " UNIQUE";
    return column;
  }
}
export default BuilderSQL;

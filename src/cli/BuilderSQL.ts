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
  private readonly columns: IColumn[] = [];
  private type_engine: string = "";
  private type_charset: string = "";
  private drops_columns: string[] = [];
  setEngine(type: string) {
    this.type_engine = type;
  }
  setCharset(type: string) {
    this.type_charset = type;
  }
  pushColumn(col: string) {
    this.columns.push({
      sql: col,
    });
  }
  setDropColumn(column: string) {
    this.drops_columns.push(column);
  }
  setValue(name_column: string, key: keyColumn, value?: string) {
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
  builder_create(tableName: string, driver: string) {
    const columns_string = this.columns.map((i) => this.generateColumnSQL(i));
    const primary_keys = this.columns.filter((i) => i.primary_key);

    let sql = "";
    switch (driver) {
      case "mysql":
        sql = `CREATE TABLE ${tableName} (${columns_string}`;
        if (primary_keys.length > 0) sql += `, PRIMARY KEY (${primary_keys.map((i) => i.sql.split(" ")[0]).join(", ")})`;
        sql += ")";
        if (this.type_engine !== "") sql += ` ${this.type_engine}`;
        if (this.type_charset !== "") sql += ` ${this.type_charset}`;
        break;

      default:
        break;
    }
    return sql;
  }
  builder_update(tableName: string, driver: string) {
    const columns_string = this.columns.map((i) => this.generateUpdateColumnSQL(i));
    const primary_keys = this.columns.filter((i) => i.primary_key);
    let sql = "";
    switch (driver) {
      case "mysql":
        sql = `ALTER TABLE ${tableName} ${columns_string}`;
        if (primary_keys.length > 0) sql += `, ADD PRIMARY KEY (${primary_keys.map((i) => i.sql.split(" ")[0]).join(", ")})`;
        break;

      default:
        break;
    }
    return sql;
  }
  builder_drop(tableName: string, driver: string) {
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
  builder_drop_table(tableName: string, driver: string) {
    try {
      let sql = "";
      switch (driver) {
        case "mysql":
          sql = `DROP TABLE IF EXISTS ${tableName}`;
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
  dropAllTables(
    migrations: {
      name: string;
      batch: string;
    }[],
  ): string[] {
    try {
      return [...new Set(migrations.map((i) => i.name.match(/migration_(.*?)_table/)![1])), "migrations"];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private generateColumnSQL(col: IColumn) {
    let column = `${col.sql}`;
    if (col.unsigned) column += ` ${col.unsigned}`;
    if (col.null) column += " NULL";
    if (col.default) column += ` DEFAULT ${col.default}`;
    if (col.check_like) column += ` ${col.check_like}`;
    if (col.unique) column += " UNIQUE";
    return column;
  }
  private generateUpdateColumnSQL(col: IColumn) {
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

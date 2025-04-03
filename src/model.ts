import Database from "./database";
import { IRelations } from "./interfaces/interfaces";
import pluralize from "pluralize";
const validOperators = ["=", ">", "<", ">=", "<=", "LIKE", "IN", "IS", "IS NOT"];
class Model {
  static table: string;
  static primaryKey: string = "id";
  public selectedRelations: IRelations[] = [];
  public whereConditions: Record<string, any> = {};
  static [key: string]: any;

  constructor(data: Record<string, any> = {}) {
    Object.assign(this, data);
  }
  static getTable() {
    return this.table ?? pluralize(this.name.replace(/Model$/, "").toLowerCase());
  }
  static with(...relations: string[]) {
    this.selectedRelations = [];
    relations.forEach((relationName) => {
      const relationMethod = (this as any)[relationName];
      if (typeof relationMethod === "function") {
        const relation = relationMethod.call(this);
        this.selectedRelations.push({ name: relationName, ...relation });
      }
    });

    return this;
  }
  static where(conditions: Record<string, any>) {
    this.whereConditions = conditions;
    return this;
  }
  static belongsTo(model: typeof Model, columns: string[], foreign_key?: string) {
    const relatedTable = model.getTable();
    const singularName = pluralize.isSingular(relatedTable) ? relatedTable : pluralize.singular(relatedTable);
    const foreignKey = foreign_key ?? `${singularName}_id`;

    return {
      type: "belongsTo",
      relatedTable,
      foreignKey,
      singularName,
      primaryKey: model.primaryKey,
      relatedAlias: columns,
    };
  }
  static async find(primary_key: number | string, columns: string[] = ["*"]) {
    const instance = new this();
    const table = this.getTable();
    const connection = Database.getConnection();
    let sql = `SELECT ${columns.join(", ")} FROM ${table}`;
    instance.selectedRelations.forEach(({ relatedTable, foreignKey, primaryKey }) => {
      sql += ` LEFT JOIN ${relatedTable} ON ${relatedTable}.${primaryKey} = ${table}.${foreignKey}`;
    });
    sql += ` WHERE ${this.primaryKey} = ? LIMIT 1`;
    const [rows] = await connection.query(sql, [primary_key]);
    return rows.length ? new this(rows[0]) : null;
  }
  static async findOne(columns: string[] = ["*"]) {
    const instance = new this();
    const table = this.getTable();
    const connection = Database.getConnection();
    const keys = Object.keys(this.whereConditions);
    const values = Object.values(this.whereConditions);

    const whereClause = keys
      .map((key) => {
        const value = this.whereConditions[key];

        if (Array.isArray(value) && value.length === 2) {
          let [operator, val] = value;
          if (!validOperators.includes(operator.toUpperCase())) {
            throw new Error(`Operador no válido: ${operator}`);
          }

          if (operator.toUpperCase() === "IN" && Array.isArray(val)) {
            values.push(...val);
            return `${key} IN (${val.map(() => "?").join(", ")})`;
          }

          if (operator.toUpperCase().startsWith("IS")) {
            return `${key} ${operator} ${val === null ? "NULL" : "?"}`;
          }

          values.push(val);
          return `${key} ${operator} ?`;
        }

        values.push(value);
        return `${key} = ?`;
      })
      .join(" AND ");
    let columnAliases: string[] = [];

    columns.forEach((column) => {
      if (column === "*") {
        columnAliases.push("*");
      } else {
        columnAliases.push(`${table}.${column}`);
      }
    });
    let sql = `SELECT `;
    sql += `${columnAliases.map((column) => column)}`;
    if (this.selectedRelations?.length) {
      this.selectedRelations.forEach(({ relatedTable, foreignKey, primaryKey, relatedAlias, singularName }) => {
        relatedAlias.map((i) => {
          sql += `, ${relatedTable}.${i} AS ${singularName}_${i}`;
        });
        sql += ` FROM ${table}`;
        sql += ` LEFT JOIN ${relatedTable} ON ${relatedTable}.${primaryKey} = ${table}.${foreignKey}`;
      });
    }
    if (!this.selectedRelations?.length) sql += ` FROM ${table}`;

    sql += ` WHERE ${whereClause} LIMIT 1`;

    const rows = await connection.query(
      sql,
      keys.map((key) => this.whereConditions[key]),
    );
    const instance_relation = rows.length ? new this(rows[0]) : null;
    if (!instance_relation) return null;
    if (this.selectedRelations?.length) {
      this.selectedRelations.forEach((relation: IRelations) => {
        if (relation.type === "belongsTo") {
          instance_relation[relation.singularName] = {};
          if (Array.isArray(relation.relatedAlias)) {
            relation.relatedAlias.forEach((alias) => {
              const column_alias = `${relation.singularName}_${alias}`;
              if (rows[0][column_alias]) {
                instance_relation[relation.singularName][alias] = rows[0][column_alias];
                delete instance_relation[column_alias];
              }
            });
          }
        }
      });
    }
    this.selectedRelations = [];
    return instance_relation;
  }
  static async all(columns: string[] = ["*"]) {
    const table = this.getTable();
    const connection = Database.getConnection();
    let sql = `SELECT `;
    let columnAliases: string[] = [];

    columns.forEach((column) => {
      if (column === "*") {
        columnAliases.push("*");
      } else {
        columnAliases.push(`${table}.${column}`);
      }
    });

    sql += `${columnAliases.map((column) => column)}`;
    if (this.selectedRelations?.length) {
      this.selectedRelations.forEach(({ relatedTable, foreignKey, primaryKey, relatedAlias, singularName }) => {
        relatedAlias.map((i) => {
          sql += `, ${relatedTable}.${i} AS ${singularName}_${i}`;
        });
        sql += ` FROM ${table}`;
        sql += ` LEFT JOIN ${relatedTable} ON ${relatedTable}.${primaryKey} = ${table}.${foreignKey}`;
      });
    }
    if (!this.selectedRelations?.length) sql += ` FROM ${table}`;

    const rows = await connection.query(sql);

    const instances = rows.map((row: any) => {
      const instance = new this(row);
      if (this.selectedRelations?.length) {
        this.selectedRelations.forEach((relation: IRelations) => {
          if (relation.type === "belongsTo") {
            instance[relation.singularName] = {};
            if (Array.isArray(relation.relatedAlias)) {
              relation.relatedAlias.forEach((alias) => {
                const column_alias = `${relation.singularName}_${alias}`;
                if (row[column_alias]) {
                  instance[relation.singularName][alias] = row[column_alias];
                  delete instance[column_alias];
                }
              });
            }
          }
        });
      }
      return instance;
    });
    this.selectedRelations = [];
    return instances;
  }
  static async pluck(value: string) {
    const table = this.getTable();
    const connection = Database.getConnection();
    let sql = `SELECT ${value} FROM ${table}`;
    const [rows] = await connection.query(sql);
    return rows.map((row: any) => new this(row[value]));
  }
}
export default Model;

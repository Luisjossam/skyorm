import pluralize from "pluralize";
import Database from "../database/database";
import { IDBDriver, IRelations } from "../interfaces/Interface";

abstract class ModelBase {
  protected static transaction_conn: IDBDriver | null = null;
  protected static primaryKey: string = "id";
  protected table: string;
  static [key: string]: any;
  constructor(table: string) {
    this.table = table;
  }
  static setPrimaryKey() {
    this.primaryKey = this.primaryKey ?? "id";
  }
  static getPrimaryKey() {
    return this.primaryKey;
  }
  static getTable() {
    return this.table ?? pluralize(this.name.replace(/Model$/, "").toLowerCase());
  }
  static belongsTo(model: typeof ModelBase, columns: string[], foreign_key?: string) {
    const name_table_relation = model.getTable();
    const singularName = pluralize.isSingular(name_table_relation) ? name_table_relation : pluralize.singular(name_table_relation);
    const foreignKey = foreign_key ?? `${singularName}_${model.getPrimaryKey()}`;

    return {
      type: "belongsTo",
      table: name_table_relation,
      foreignKey,
      singularName,
      primaryKey: model.getPrimaryKey(),
      columns,
    };
  }
  static __with(...relations: string[]) {
    const relations_array: IRelations[] = [];
    relations.forEach((relationName) => {
      const relationMethod = (this as any)[relationName];

      if (typeof relationMethod === "function") {
        const relation = relationMethod.call(this);
        relations_array.push(relation);
      }
    });

    return relations_array;
  }
  static async setRelations(relation: any, instance: any, row: any) {
    try {
      if (relation.type === "belongsTo") {
        instance[relation.singularName] = {};
        if (Array.isArray(relation.columns)) {
          relation.columns.forEach((alias: any) => {
            const column_alias = `${relation.singularName}_${alias}`;
            if (row[column_alias]) {
              instance[relation.singularName][alias] = row[column_alias];
              delete instance[column_alias];
            }
          });
        }
      } else if (relation.type === "hasMany") {
        let query = `SELECT ${relation.relatedAlias.map((i: any) => i)} FROM ${relation.relatedTable} WHERE ${relation.foreignKey} = ${row[relation.primaryKey]}`;
        const data = await this.__mb_raw(query, [], false);
        if (data) instance[relation.relatedTable] = data;
      } else if (relation.type === "hasOne") {
        let query = `SELECT ${relation.relatedAlias.map((i: any) => i)} FROM ${relation.relatedTable} WHERE ${relation.foreignKey} = ${row[relation.primaryKey]} LIMIT 1`;
        const data = await this.__mb_raw(query, [], false);
        if (data) instance[relation.singularName] = data[0];
      } else if (relation.type === "belongsToMany") {
        let query_get_ids = `SELECT ${relation.relatedKey} FROM ${relation.pivotTable} WHERE ${relation.foreignKey} = ${row[relation.modelPrimaryKey]}`;
        const get_ids = await this.__mb_raw(query_get_ids, [], false);
        const values = get_ids.map((id: any) => id[relation.relatedKey]).join(", ");
        let query = `SELECT ${relation.relatedAlias.map((i: any) => i)} FROM ${relation.relatedTable} WHERE ${relation.primaryKey} IN (${values})`;
        const data = await this.__mb_raw(query, [], false);
        if (data) instance[relation.relatedTable] = data;
      }
      return instance;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  static async __mb_raw(query: string, values: (string | number | boolean)[], asModel: boolean) {
    try {
      const connection = Database.getConnection();
      let sanitize: string[] = [];
      if (values.length > 0) {
        sanitize = this.sanitizeArray(values);
      }
      const [response] = await connection.query(query, sanitize);
      if (asModel) {
        return response.map((row: any) => {
          const instance = Object.create(this.prototype);
          Object.assign(instance, row);
          return instance;
        });
      }
      return response;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  static getTransactionConn() {
    return this.transaction_conn;
  }
  static setTransactionConn(conn: IDBDriver) {
    this.transaction_conn = conn;
  }
  private static sanitizeArray(values: (string | number | boolean)[]): string[] {
    return values.map((value) => {
      if (typeof value === "string") {
        return value
          .replace(/[^\w\s]/gi, "")
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"')
          .trim();
      }
      if (typeof value === "number") return value.toString();
      if (typeof value === "boolean") return value ? "true" : "false";
      return value;
    });
  }
}
export default ModelBase;

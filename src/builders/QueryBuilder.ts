import {
  IDBDriver,
  IPaginateData,
  IQueryBuilderCount,
  IQueryBuilderMax,
  IQueryBuilderMin,
  IQueryBuilderSum,
  IQueryBuilderWhere,
  IQueryBuilderWith,
  IRelations,
  IQueryArray,
  IQueryBuilderAvg,
  IQueryBuilderOrWhere,
  IQueryBuilderHaving,
} from "../interfaces/interfaces";
import Database from "../database/database";
import ModelBase from "../models/ModelBase";
import { ResultSetHeader } from "mysql2";
import CreateInstance from "../models/CreateInstance";
const validOperators = [
  "=",
  "!=",
  "<>",
  ">",
  "<",
  ">=",
  "<=",
  "LIKE",
  "NOT LIKE",
  "IN",
  "NOT IN",
  "BETWEEN",
  "NOT BETWEEN",
  "IS NULL",
  "IS NOT NULL",
  "OR",
];
class QueryBuilder {
  private readonly wheres: IQueryArray = { queries: [], values: [] };
  private readonly orWheres: IQueryArray = { queries: [], values: [] };
  private readonly relations: string[] = [];
  private limit_value: number | null = null;
  private order_by: { column: string; sort: "ASC" | "DESC"; default: boolean } = { column: "id", sort: "ASC", default: true };
  private relations_array: IRelations[] = [];
  private readonly min_columns: IQueryArray = { queries: [], values: [] };
  private readonly max_columns: IQueryArray = { queries: [], values: [] };
  private readonly count_columns: IQueryArray = { queries: [], values: [] };
  private readonly sum_values: IQueryArray = { queries: [], values: [] };
  private readonly avg_values: IQueryArray = { queries: [], values: [] };
  private readonly having_values: string[] = [];
  private readonly modelBase: typeof ModelBase;
  private primary_key_value: string | number | null = null;
  constructor(model: typeof ModelBase) {
    this.modelBase = model;
  }
  where(conditions: Record<string, any>): IQueryBuilderWhere {
    const where_query = this.createWhereConditionsQuery(conditions);
    this.wheres.queries.push(where_query.query);
    this.wheres.values.push(...where_query.values);
    return this;
  }
  orWhere(conditions: Record<string, any>): IQueryBuilderOrWhere {
    if (this.wheres.queries.length === 0) throw new Error("You must use 'where' before 'orWhere'.");
    const where_query = this.createWhereConditionsQuery(conditions, "orWhere");
    this.orWheres.queries.push(where_query.query);
    this.orWheres.values.push(...where_query.values);
    return this;
  }
  having(conditions: Record<string, any>): IQueryBuilderHaving {
    this.having_values.push(JSON.stringify(conditions));
    return this;
  }
  limit(limit: number) {
    if (typeof limit !== "number" || isNaN(limit) || limit < 0)
      throw new TypeError(`The "limit" value must be a number and positive. Received: "${limit}"`);
    this.limit_value = limit;
    return this;
  }
  orderBy(column: string, sort: "ASC" | "DESC") {
    if (!column) throw new TypeError(`The "column" value must be a string. Received: "${column}"`);
    if (sort !== "ASC" && sort !== "DESC") {
      throw new TypeError(`The "sort" value must be "ASC" or "DESC". Received: "${sort}"`);
    }
    const columnName = /^[^.]+\./.test(column) ? column : `${this.modelBase.getTable()}.${column}`;
    this.order_by = { column: columnName, sort, default: false };
    return this;
  }
  with(...relations: string[]): IQueryBuilderWith {
    const relations_array = this.modelBase.__with(...relations);
    let query = "";
    let left_join = "";
    relations_array.forEach((relation) => {
      if (relation.type === "belongsTo") {
        relation.columns.forEach((i) => {
          query += `, ${relation.table}.${i} AS ${relation.singularName}_${i}`;
          left_join = ` LEFT JOIN ${relation.table} ON ${relation.table}.${relation.primaryKey} = ${this.modelBase.getTable()}.${relation.foreignKey}`;
        });
      }
    });
    this.relations_array = relations_array;
    this.relations.push(query);
    this.relations.push(left_join);
    return this;
  }
  min(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderMin {
    try {
      let query = "MIN(";
      let values: (string | number | boolean)[] = [];
      const alias_name = alias ?? `min_${column}_${this.min_columns.queries.length}`;
      if (conditions && Object.keys(conditions).length >= 1) {
        const case_query = this.createWhereConditionsQuery(conditions);
        values = case_query.values;
        query += `CASE WHEN ${case_query.query} THEN ${column} ELSE NULL END) AS ${alias_name}`;
      } else {
        query += `${column}) AS ${alias_name}`;
      }
      this.min_columns.queries.push(query);
      this.min_columns.values = [...this.min_columns.values, ...values];
      return this as any;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  max(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderMax {
    try {
      let query = "MAX(";
      let values: (string | number | boolean)[] = [];
      const alias_name = alias ?? `max_${column}_${this.max_columns.queries.length}`;
      if (conditions && Object.keys(conditions).length >= 1) {
        const case_query = this.createWhereConditionsQuery(conditions);
        values = case_query.values;
        query += `CASE WHEN ${case_query.query} THEN ${column} ELSE NULL END) AS ${alias_name}`;
      } else {
        query += `${column}) AS ${alias_name}`;
      }
      this.max_columns.queries.push(query);
      this.max_columns.values = [...this.max_columns.values, ...values];
      return this;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  count(column: string = "*", conditions?: Record<string, any>, alias?: string): IQueryBuilderCount {
    try {
      let query = `COUNT(`;
      let values: (string | number | boolean)[] = [];
      if (column === "*" && conditions && Object.keys(conditions as object).length >= 1)
        throw new Error("You cannot use conditions with '*' column.");
      const alias_name = alias ?? `count${column === "*" ? "" : "_" + column}_${this.count_columns.queries.length}`;
      if (conditions && column !== "*" && Object.keys(conditions).length >= 1) {
        const case_query = this.createWhereConditionsQuery(conditions);
        values = case_query.values;
        query += `CASE WHEN ${case_query.query} THEN ${column} ELSE NULL END) AS ${alias_name}`;
      } else {
        query += `${column}) AS ${alias_name}`;
      }
      this.count_columns.queries.push(query);
      this.count_columns.values = [...this.count_columns.values, ...values];
      return this;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  sum(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderSum {
    try {
      let query = `COALESCE(SUM(`;
      let values: (string | number | boolean)[] = [];
      const alias_name = alias ?? `sum_${column}_${this.sum_values.queries.length}`;
      if (conditions && Object.keys(conditions).length >= 1) {
        const case_query = this.createWhereConditionsQuery(conditions);
        values = case_query.values;
        query += `CASE WHEN ${case_query.query} THEN ${column} ELSE 0 END), 0) AS ${alias_name}`;
      } else {
        query += `${column}), 0) AS ${alias_name}`;
      }
      this.sum_values.queries.push(query);
      this.sum_values.values = [...this.sum_values.values, ...values];
      return this;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  avg(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderAvg {
    try {
      let query = "COALESCE(AVG(";
      let values: (string | number | boolean)[] = [];
      const alias_name = alias ?? `avg_${column}_${this.avg_values.queries.length}`;
      if (conditions && Object.keys(conditions).length >= 1) {
        const case_query = this.createWhereConditionsQuery(conditions);
        values = case_query.values;
        query += `CASE WHEN ${case_query.query} THEN ${column} ELSE 0 END), 0) AS ${alias_name}`;
      } else {
        query += `${column}), 0) AS ${alias_name}`;
      }
      this.avg_values.queries.push(query);
      this.avg_values.values = [...this.avg_values.values, ...values];

      return this as any;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  primaryKeyValue(): string | number | null {
    return this.primary_key_value;
  }
  async get(columns: string[] = ["*"]): Promise<any[]> {
    try {
      const connection = Database.getConnection();
      if (this.min_columns.queries.length > 0) return this.createQueryMinMax(connection, "MIN") as any;
      if (this.max_columns.queries.length > 0) return this.createQueryMinMax(connection, "MAX") as any;
      if (this.count_columns.queries.length > 0) return this.createQueryCount(connection) as any;
      if (this.sum_values.queries.length > 0) return this.createQuerySum(connection) as any;
      if (this.avg_values.queries.length > 0) return this.createQueryAvg(connection) as any;

      let columnAliases: string[] = [];
      columns.forEach((column) => {
        if (column === "*") {
          columnAliases.push(`${this.modelBase.getTable()}.*`);
        } else {
          columnAliases.push(`${this.modelBase.getTable()}.${column}`);
        }
      });
      let sql = `SELECT ${columnAliases.join(", ")}`;
      if (this.relations.length > 0) sql += ` ${this.relations[0]}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.relations.length > 1) sql += ` ${this.relations[1]}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      if (this.orWheres.queries.length > 0) sql += ` OR ${this.orWheres.queries.join(" OR ")}`;
      sql += ` ORDER BY ${this.order_by.column} ${this.order_by.sort}`;
      if (this.limit_value) sql += ` LIMIT ${this.limit_value}`;
      const [rows] = await connection.query(sql, [...this.wheres.values, ...this.orWheres.values]);
      const instances = await Promise.all(
        rows.map(async (row: any) => {
          let instance = Object.create(this.modelBase.prototype);
          Object.assign(instance, row);
          if (this.relations_array.length > 0) {
            for (const relation of this.relations_array) {
              row = await this.modelBase.setRelations(relation, instance, row);
            }
          }
          return instance;
        }),
      );
      return instances;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async getOne(columns: string[] = ["*"]): Promise<any> {
    try {
      const connection = Database.getConnection();
      let columnAliases: string[] = [];
      columns.forEach((column) => {
        if (column === "*") {
          columnAliases.push(`${this.modelBase.getTable()}.*`);
        } else {
          columnAliases.push(`${this.modelBase.getTable()}.${column}`);
        }
      });
      let sql = `SELECT ${columnAliases.join(", ")}`;
      if (this.relations.length > 0) sql += ` ${this.relations[0]}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.relations.length > 1) sql += ` ${this.relations[1]}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      const rows = await connection.query(sql, this.wheres.values ?? []);
      let instance_relation = rows.length ? Object.create(this.modelBase.prototype) : null;
      if (!instance_relation) return null;
      Object.assign(instance_relation, rows[0]);
      if (this.relations_array.length > 0) {
        for (const relation of this.relations_array) {
          instance_relation = await this.modelBase.setRelations(relation, instance_relation, rows[0]);
        }
      }
      return instance_relation;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async find(value: number | string, columns: string[] = ["*"]): Promise<any> {
    try {
      const connection = Database.getConnection();
      let columnAliases: string[] = [];
      columns.forEach((column) => {
        if (column === "*") {
          columnAliases.push(`${this.modelBase.getTable()}.*`);
        } else {
          columnAliases.push(`${this.modelBase.getTable()}.${column}`);
        }
      });
      let sql = `SELECT ${columnAliases.join(", ")}`;
      if (this.relations.length > 0) sql += ` ${this.relations[0]}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.relations.length > 1) sql += ` ${this.relations[1]}`;
      sql += ` WHERE ${this.modelBase.getTable()}.${this.modelBase.getPrimaryKey()} = ?`;
      const [rows] = await connection.query(sql, [value]);
      let instance_relation = rows.length ? Object.create(this.modelBase.prototype) : null;
      if (!instance_relation) return null;
      Object.assign(instance_relation, rows[0]);
      if (this.relations_array.length > 0) {
        for (const relation of this.relations_array) {
          instance_relation = await this.modelBase.setRelations(relation, instance_relation, rows[0]);
        }
      }
      return instance_relation;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async pluck(value: string): Promise<string[]> {
    try {
      const connection = Database.getConnection();
      let sql = `SELECT ${value} FROM ${this.modelBase.getTable()}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      sql += ` ORDER BY ${this.order_by.column} ${this.order_by.sort}`;
      if (this.limit_value) sql += ` LIMIT ${this.limit_value}`;
      const rows = await connection.query(sql, this.wheres.values ?? []);
      return rows.map((row: any) => row[value]);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async paginate(current_page: number, per_page: number, columns: string[] = ["*"]): Promise<IPaginateData> {
    try {
      const connection = Database.getConnection();
      let columnAliases: string[] = [];
      columns.forEach((column) => {
        if (column === "*") {
          columnAliases.push(`${this.modelBase.getTable()}.*`);
        } else {
          columnAliases.push(`${this.modelBase.getTable()}.${column}`);
        }
      });
      let sql = `SELECT ${columnAliases.join(", ")}`;
      if (this.relations.length > 0) sql += ` ${this.relations[0]}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.relations.length > 1) sql += ` ${this.relations[1]}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      const offset = (current_page - 1) * per_page;
      sql += ` ORDER BY ${this.order_by.column} ${this.order_by.sort}`;
      sql += ` LIMIT ?, ?`;
      const [rows] = await connection.query(
        sql,
        this.wheres.values ? [...this.wheres.values, offset.toString(), per_page.toString()] : [offset.toString(), per_page.toString()],
      );
      const instances = await Promise.all(
        rows.map(async (row: any) => {
          let instance = Object.create(this.modelBase.prototype);
          Object.assign(instance, row);
          if (this.relations_array.length > 0) {
            for (const relation of this.relations_array) {
              row = await this.modelBase.setRelations(relation, instance, row);
            }
          }
          return instance;
        }),
      );
      let sqlCount = `SELECT COUNT(*) as total FROM ${this.modelBase.getTable()}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      const totalRows = await connection.query(sqlCount, this.wheres.values ?? []);
      const total = totalRows[0].total;
      const lastPage = Math.ceil(total / per_page);

      return {
        data: instances,
        total,
        perPage: per_page,
        currentPage: current_page,
        lastPage,
        count: rows.length,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async exist(): Promise<boolean> {
    try {
      const connection = Database.getConnection();
      let sql = `SELECT ${this.modelBase.getPrimaryKey()} FROM ${this.modelBase.getTable()}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      sql += ` LIMIT 1`;
      const [rows] = await connection.query(sql, this.wheres.values ?? []);
      return !!rows[0];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async groupBy(...columns: string[]): Promise<any[]> {
    try {
      if (columns.length === 0) throw new Error("You must provide at least one column to group by.");
      const connection = Database.getConnection();
      let columnAliases: string[] = [];
      let relation_columns: string[] = [];
      columns.forEach((column) => {
        if (column === "*") throw new Error("You cannot use '*' in groupBy method.");
        if (/^[^.]+\./.test(column)) {
          columnAliases.push(`${column} AS ${column.replace(".", "_")}`);
          relation_columns.push(column);
        } else {
          columnAliases.push(`${this.modelBase.getTable()}.${column}`);
        }
      });
      let sql = `SELECT ${columnAliases.join(", ")}`;
      if (this.avg_values.queries.length > 0) sql += `, ${this.avg_values.queries.join(", ")}`;
      if (this.sum_values.queries.length > 0) sql += `, ${this.sum_values.queries.join(", ")}`;
      if (this.count_columns.queries.length > 0) sql += `, ${this.count_columns.queries.join(", ")}`;
      if (this.min_columns.queries.length > 0) sql += `, ${this.min_columns.queries.join(", ")}`;
      if (this.max_columns.queries.length > 0) sql += `, ${this.max_columns.queries.join(", ")}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (relation_columns.length > 0) {
        const relations = this.modelBase.__with(...relation_columns.map((column) => column.split(".")[0]));
        let join = "";
        relations.forEach((relation) => {
          relation.columns.forEach((i) => {
            //sql += `, ${relation.table}.${i} AS ${relation.singularName}_${i}`;
            join = ` JOIN ${relation.table} ON ${this.modelBase.getTable()}.${relation.foreignKey} = ${relation.table}.${relation.primaryKey}`;
          });
        });
        sql += ` ${join}`;
      }
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      if (this.orWheres.queries.length > 0) sql += ` OR ${this.orWheres.queries.join(" OR ")}`;
      const groupByColumns = columnAliases.map((column) => {
        const parts = column.split("AS");
        return parts[0].trim();
      });

      sql += ` GROUP BY ${groupByColumns.join(", ")}`;

      let having_values: (string | number | boolean)[] = [];
      if (this.having_values.length > 0) {
        const havings = this.createQueryHaving(sql);
        having_values = havings.values;
        sql += ` HAVING ${havings.query}`;
      }
      if (!this.order_by.default) sql += ` ORDER BY ${this.order_by.column} ${this.order_by.sort}`;
      if (this.limit_value) sql += ` LIMIT ${this.limit_value}`;

      const rows = await connection.query(sql, [
        ...this.avg_values.values,
        ...this.sum_values.values,
        ...this.count_columns.values,
        ...this.min_columns.values,
        ...this.max_columns.values,
        ...this.wheres.values,
        ...this.orWheres.values,
        ...having_values,
      ]);
      return rows;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async create(data: Record<string, any>, conn: IDBDriver | null): Promise<CreateInstance> {
    try {
      if (!data) throw new Error("To create a new registry you must provide data.");
      const connection = conn ?? Database.getConnection();
      const keys = Object.keys(data);
      const values = Object.values(data);
      let query = `INSERT INTO ${this.modelBase.getTable()} (${keys.join(",")}) VALUES (${values.map(() => "?").join(", ")})`;
      const primarykey = this.modelBase.getPrimaryKey();
      const last_pk_register = data[primarykey];
      const result = await connection.query<ResultSetHeader>(query, values);

      if (last_pk_register) {
        this.primary_key_value = last_pk_register;
      } else {
        this.primary_key_value = result[0].insertId;
      }
      return new CreateInstance(this.modelBase, this.primary_key_value);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private async createQueryMinMax(connection: IDBDriver, type: "MIN" | "MAX"): Promise<Record<string, any>[]> {
    try {
      const data = type === "MIN" ? this.min_columns : this.max_columns;
      let sql = `SELECT`;
      sql += ` ${data.queries.join(", ")}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      if (this.orWheres.queries.length > 0) sql += ` OR ${this.orWheres.queries.join(" OR ")}`;
      const rows = await connection.query(sql, [...data.values, ...this.wheres.values, ...this.orWheres.values]);
      const instances = await Promise.all(
        rows.map(async (row: any) => {
          let instance = Object.create(this.modelBase.prototype);
          Object.assign(instance, row);
          return instance;
        }),
      );
      return instances;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async createQueryCount(connection: IDBDriver): Promise<Record<string, any>[]> {
    try {
      let sql = `SELECT`;
      sql += ` ${this.count_columns.queries.join(", ")}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      if (this.orWheres.queries.length > 0) sql += ` OR ${this.orWheres.queries.join(" OR ")}`;
      const rows = await connection.query(sql, [...this.count_columns.values, ...this.wheres.values, ...this.orWheres.values]);
      const instances = await Promise.all(
        rows.map(async (row: any) => {
          let instance = Object.create(this.modelBase.prototype);
          Object.assign(instance, row);
          return instance;
        }),
      );
      return instances;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async createQuerySum(connection: IDBDriver): Promise<Record<string, any>[]> {
    try {
      let sql = `SELECT`;
      sql += ` ${this.sum_values.queries.join(", ")}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      if (this.orWheres.queries.length > 0) sql += ` OR ${this.orWheres.queries.join(" OR ")}`;
      const rows = await connection.query(sql, [...this.sum_values.values, ...this.wheres.values, ...this.orWheres.values]);
      const instances = await Promise.all(
        rows.map(async (row: any) => {
          let instance = Object.create(this.modelBase.prototype);
          Object.assign(instance, row);
          return instance;
        }),
      );
      return instances;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async createQueryAvg(connection: IDBDriver): Promise<Record<string, any>[]> {
    try {
      let sql = "SELECT";
      sql += ` ${this.avg_values.queries.join(", ")}`;
      sql += ` FROM ${this.modelBase.getTable()}`;
      if (this.wheres.queries.length > 0) sql += ` WHERE ${this.wheres.queries.join(" AND ")}`;
      if (this.orWheres.queries.length > 0) sql += ` OR ${this.orWheres.queries.join(" OR ")}`;
      const rows = await connection.query(sql, [...this.avg_values.values, ...this.wheres.values, ...this.orWheres.values]);
      const instances = await Promise.all(
        rows.map(async (row: any) => {
          let instance = Object.create(this.modelBase.prototype);
          Object.assign(instance, row);
          return instance;
        }),
      );
      return instances;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private createWhereConditionsQuery(
    conditions: Record<string, any>,
    type: "where" | "orWhere" | "having" = "where",
  ): { query: string; values: (string | number | boolean)[] } {
    const keys = Object.keys(conditions);
    const query = keys
      .map((key) => {
        const value = conditions[key];
        const query = type === "having" ? key : `${this.modelBase.getTable()}.${key}`;

        if (Array.isArray(value) && value.length >= 1) {
          let [operator, val] = value;

          if (!validOperators.includes(operator.toUpperCase())) {
            throw new Error(`Operator not valid: ${operator}`);
          }

          if (operator.toUpperCase() === "IN" || (operator.toUpperCase() === "NOT IN" && Array.isArray(val))) {
            return `${query} ${operator.toUpperCase()} (${val.map(() => "?").join(", ")})`;
          }

          if (operator.toUpperCase().startsWith("IS")) {
            return `${query} ${operator.toUpperCase()}`;
          }
          if (operator.toUpperCase() === "BETWEEN" || operator.toUpperCase() === "NOT BETWEEN") {
            if (!val || !Array.isArray(val) || val.length < 2)
              throw new Error(
                `${operator.toUpperCase()} operator requires two values: Received: { ${key}: ['${operator.toUpperCase()}', [${val[0]}, ${val[1]}]] }`,
              );
            return `${query} ${operator.toUpperCase()} ? AND ?`;
          }
          return `${query} ${operator.toUpperCase()} ?`;
        }
        if (
          (typeof value === "string" && value.toUpperCase() === "IS NULL") ||
          (typeof value === "string" && value.toUpperCase() === "IS NOT NULL")
        ) {
          return `${query} ${value.toUpperCase()}`;
        } else {
          return `${query} = ?`;
        }
      })
      .join(" AND ");

    const values: (string | number | boolean)[] = [];
    for (const key of keys) {
      let value = conditions[key];
      if (Array.isArray(value) && value.length >= 2) {
        for (let i = 0; i < value.length; i++) {
          if (i > 0) {
            if (Array.isArray(value[i])) {
              values.push(...value[i]);
            } else {
              values.push(value[i]);
            }
          }
        }
      } else {
        values.push(value);
      }
    }

    return {
      query: type === "orWhere" && keys.length > 1 ? `(${query})` : query,
      values,
    };
  }
  private createQueryHaving(sql: string) {
    const havings = this.having_values.map((condition) => JSON.parse(condition));
    const new_havings = havings.map((obj) => {
      const newObj: Record<string, any> = {};
      for (const key in obj) {
        if (sql.includes(`${this.modelBase.getTable()}.${key}`)) {
          newObj[`${this.modelBase.getTable()}.${key}`] = obj[key];
        } else {
          newObj[key] = obj[key];
        }
      }
      return newObj;
    });

    return this.createWhereConditionsQuery(
      new_havings.reduce((acc, obj) => ({ ...acc, ...obj }), {}),
      "having",
    );
  }
}
export default QueryBuilder;

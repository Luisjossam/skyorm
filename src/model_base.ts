import Database from "./database";
import { IPaginateData, IRelations } from "./interfaces/interfaces";
import pluralize from "pluralize";
const validOperators = ["=", ">", "<", ">=", "<=", "LIKE", "IN", "IS", "IS NOT"];
interface IOptions {
  relations?: IRelations[];
  conditions?: Record<string, any>;
  order_by: { column: string; sort: string };
}
export abstract class ModelBase {
  protected table: string;
  static readonly primaryKey: string = "id";
  public selectedRelations: IRelations[] = [];
  public whereConditions: Record<string, any> = {};
  static [key: string]: any;

  constructor(table: string) {
    this.table = table;
  }
  /**
   * Retrieves the name of the table associated with the model.
   * If the static property `table` is defined, it uses that value.
   * If it's not defined, it generates the table name by removing the word `Model` from the class name,
   * converting it to lowercase, and then pluralizing it.
   *
   * @returns {string} The name of the table associated with the model.
   *
   * @example
   * class ProductModel extends Model {
   *   static table = 'products';
   * }
   * console.log(ProductModel.getTable()); // "products"
   *
   * class OrderModel extends Model {}
   * console.log(OrderModel.getTable()); // "orders"
   */
  static getTable() {
    return this.table ?? pluralize(this.name.replace(/Model$/, "").toLowerCase());
  }

  /**
   * Defines a "belongs to" relationship between the current model and another model.
   * This method establishes a relationship where the current model has a foreign key that points to another model's primary key.
   * The foreign key can be customized, otherwise, it defaults to the name of the related table with `_id` appended.
   *
   * @param {typeof Model} model - The related model class that this model belongs to.
   * @param {string[]} columns - The columns to be selected in the query.
   * @param {string} [foreign_key] - The name of the foreign key column in the current model's table. If not provided, it will be inferred based on the related model's table name.
   *
   * @returns {Object} An object describing the related table, foreign key, and the primary key of the related model.
   *
   * @example
   * class ProductModel extends Model {
   *   static category() {
   *     return this.belongsTo(CategoryModel, ['id', 'name']);
   *   }
   * }
   *
   * const relation = ProductModel.category();
   * console.log(relation);
   * // Output:
   * // {
   * //   type: 'belongsTo',
   * //   relatedTable: 'categories',
   * //   foreignKey: 'category_id',
   * //   singularName: 'category',
   * //   primaryKey: 'id',
   * // }
   */
  static belongsTo(model: typeof ModelBase, columns: string[], foreign_key?: string) {
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
  static __mb_with(...relations: string[]) {
    const relations_array: IRelations[] = [];
    relations.forEach((relationName) => {
      const relationMethod = this[relationName];
      if (typeof relationMethod === "function") {
        const relation = relationMethod.call(this);
        relations_array.push(relation);
      }
    });
    return relations_array;
  }

  /**
   * Retrieves a single record by its primary key.
   *
   * @param primary_key - The value of the primary key to search for.
   * @param columns - An array of column names to retrieve (default is all columns "*").
   * @returns {Promise<Model | null>} - A single instance of the model or null if not found.
   *
   * @example
   * // Find a product by its ID and retrieve all columns
   * const product = await ProductModel.find(1);
   *
   * // Find a user by ID and retrieve only specific columns
   * const user = await UserModel.find(10, ["name", "email"]);
   */
  static async __mb_find(primary_key: number | string, columns: string[], options: Omit<IOptions, "order_by">) {
    const table = this.getTable();
    const connection = Database.getConnection();
    let columnAliases: string[] = [];

    columns.forEach((column) => {
      if (column === "*") {
        columnAliases.push(`${table}.*`);
      } else {
        columnAliases.push(`${table}.${column}`);
      }
    });
    let sql = `SELECT `;
    sql += `${columnAliases.map((column) => column)}`;
    if (options.relations?.length) {
      options.relations.forEach((relation: any) => {
        relation.relatedAlias.map((i: any) => {
          sql += `, ${relation.relatedTable}.${i} AS ${relation.singularName}_${i}`;
        });
        sql += ` FROM ${table}`;
        sql += ` LEFT JOIN ${relation.relatedTable} ON ${relation.relatedTable}.${relation.primaryKey} = ${table}.${relation.foreignKey}`;
      });
    }
    if (!options.relations?.length) sql += ` FROM ${table}`;
    sql += ` WHERE ${table}.${this.primaryKey} = ? LIMIT 1`;

    const rows = await connection.query(sql, [primary_key]);
    let instance_relation = rows.length ? Object.create(this.prototype) : null;
    if (!instance_relation) return null;
    Object.assign(instance_relation, rows[0]);
    if (options.relations?.length) {
      options.relations.forEach((relation: IRelations) => {
        instance_relation = this.setRelations(relation, instance_relation, rows[0]);
      });
    }
    return instance_relation;
  }
  /**
   * Retrieves a single record based on the specified conditions.
   *
   * @param columns - An array of column names to retrieve (default is all columns "*").
   * @returns {Promise<Model | null>} - A single instance of the model or null if not found.
   *
   * @example
   * // Find a single user where email = 'test@example.com'
   * const user = await UserModel.where({ email: "test@example.com" }).findOne();
   *
   * // Find a product with a price greater than 500 and retrieve only name and price columns
   * const product = await ProductModel.where({ price: [">", 500] }).findOne(["name", "price"]);
   */
  static async __mb_getOne(columns: string[], options: Omit<IOptions, "order_by">) {
    const table = this.getTable();
    const connection = Database.getConnection();

    let whereClause = null;
    let justValues = null;
    const conditions = options.conditions ? options.conditions : null;
    if (conditions) {
      whereClause = this.setWhereConditions(conditions);
      justValues = this.getJustValues(conditions);
    }
    let columnAliases: string[] = [];

    columns.forEach((column) => {
      if (column === "*") {
        columnAliases.push(`${table}.*`);
      } else {
        columnAliases.push(`${table}.${column}`);
      }
    });
    let sql = `SELECT `;
    sql += `${columnAliases.map((column) => column)}`;
    if (options.relations?.length) {
      options.relations.forEach(({ relatedTable, foreignKey, primaryKey, relatedAlias, singularName }) => {
        relatedAlias.forEach((i) => {
          sql += `, ${relatedTable}.${i} AS ${singularName}_${i}`;
        });
        sql += ` FROM ${table}`;
        sql += ` LEFT JOIN ${relatedTable} ON ${relatedTable}.${primaryKey} = ${table}.${foreignKey}`;
      });
    }
    if (!options.relations?.length) sql += ` FROM ${table}`;

    if (whereClause) sql += ` WHERE ${whereClause}`;
    sql += ` LIMIT 1`;
    console.log(sql);

    const rows = await connection.query(sql, justValues ?? []);

    let instance_relation = rows.length ? Object.create(this.prototype) : null;
    if (!instance_relation) return null;
    Object.assign(instance_relation, rows[0]);
    if (options.relations?.length) {
      options.relations.forEach((relation: IRelations) => {
        instance_relation = this.setRelations(relation, instance_relation, rows[0]);
      });
    }
    return instance_relation;
  }
  /**
   * Retrieves all records from the database, applying optional column selection and handling relationships.
   *
   * @param columns - An array of column names to retrieve (default is all columns "*").
   * @returns {Promise<Model[]>} - An array of model instances corresponding to the retrieved records.
   *
   * @example
   * // Retrieve all users
   * const users = await UserModel.all();
   *
   * // Retrieve all products with only the 'name' and 'price' columns
   * const products = await ProductModel.all(["name", "price"]);
   */
  static async __mb_all(columns: string[], options: IOptions) {
    if (this.whereConditions && Object.keys(this.whereConditions).length > 0) {
      throw new Error("Cannot use 'all()' with where conditions. Use 'get()' instead.");
    }
    const table = this.getTable();
    const connection = Database.getConnection();
    let sql = `SELECT `;
    let columnAliases: string[] = [];

    columns.forEach((column) => {
      if (column === "*") {
        columnAliases.push(`${table}.*`);
      } else {
        columnAliases.push(`${table}.${column}`);
      }
    });

    sql += `${columnAliases.map((column) => column)}`;
    if (options.relations?.length) {
      options.relations.forEach((relation: any) => {
        relation.relatedAlias.map((i: any) => {
          sql += `, ${relation.relatedTable}.${i} AS ${relation.singularName}_${i}`;
        });
        sql += ` FROM ${table}`;
        sql += ` LEFT JOIN ${relation.relatedTable} ON ${relation.relatedTable}.${relation.primaryKey} = ${table}.${relation.foreignKey}`;
      });
    }
    if (!options.relations?.length) sql += ` FROM ${table}`;
    sql += ` ORDER BY ${table}.${options.order_by.column} ${options.order_by.sort}`;
    const rows = await connection.query(sql);

    const instances = rows.map((row: any) => {
      let instance = Object.create(this.prototype);
      Object.assign(instance, row);
      if (options.relations?.length) {
        options.relations.forEach((relation: IRelations) => {
          row = this.setRelations(relation, instance, row);
        });
      }
      return instance;
    });

    return instances;
  }
  /**
   * Retrieves records from the database based on specified conditions, optional column selection, and relationships.
   *
   * @param {string[]} [columns=["*"]] - An array of column names to retrieve (default is all columns "*").
   * @returns {Promise<Model[]>} - An array of model instances corresponding to the retrieved records.
   *
   * @example
   * // Retrieve all records with default columns
   * const records = await Model.get();
   *
   * // Retrieve only the 'name' and 'price' columns
   * const products = await ProductModel.get(["name", "price"]);
   *
   * // Retrieve records with a where condition (e.g., records where price is less than 500)
   * const filteredProducts = await ProductModel.where({ price: ["<", 500] }).get(["name", "price"]);
   */
  static async __mb_get(columns: string[], options: IOptions) {
    const table = this.getTable();
    const connection = Database.getConnection();

    let whereClause = null;
    let justValues = null;
    const conditions = options.conditions ? options.conditions : null;
    if (conditions) {
      whereClause = this.setWhereConditions(conditions);
      justValues = this.getJustValues(conditions);
    }
    let columnAliases: string[] = [];

    columns.forEach((column) => {
      if (column === "*") {
        columnAliases.push(`${table}.*`);
      } else {
        columnAliases.push(`${table}.${column}`);
      }
    });
    let sql = `SELECT `;
    sql += `${columnAliases.map((column) => column)}`;
    if (options.relations?.length) {
      options.relations.forEach((relation: IRelations) => {
        relation.relatedAlias.forEach((i) => {
          sql += `, ${relation.relatedTable}.${i} AS ${relation.singularName}_${i}`;
        });
        sql += ` FROM ${table}`;
        sql += ` LEFT JOIN ${relation.relatedTable} ON ${relation.relatedTable}.${relation.primaryKey} = ${table}.${relation.foreignKey}`;
      });
    }
    if (!options.relations?.length) sql += ` FROM ${table}`;

    if (whereClause) sql += ` WHERE ${whereClause}`;
    sql += ` ORDER BY ${table}.${options.order_by.column} ${options.order_by.sort}`;
    const rows = await connection.query(sql, justValues ?? []);
    const instances = rows.map((row: any) => {
      let instance = Object.create(this.prototype);
      Object.assign(instance, row);
      if (options.relations?.length) {
        options.relations.forEach((relation: IRelations) => {
          row = this.setRelations(relation, instance, row);
        });
      }
      return instance;
    });
    return instances;
  }
  /**
   * Retrieves an array of values for a specific column, optionally filtered by conditions.
   *
   * @param value - The name of the column whose values should be retrieved.
   * @returns {Promise<string[] | number[]>} - An array of values from the specified column.
   *
   * @example
   * // Retrieve all email addresses from the users table
   * const emails = await UserModel.valuesOf("email");
   *
   * // Retrieve all product names where price is greater than 100
   * const productNames = await ProductModel.where({ price: [">", 100] }).valuesOf("name");
   */
  static async __mb_valuesOf(value: string, options: IOptions): Promise<string[] | number[]> {
    const table = this.getTable();
    const connection = Database.getConnection();
    let whereClause = null;
    let justValues = null;
    if (this.whereConditions) {
      whereClause = this.setWhereConditions(this.whereConditions);
      justValues = this.getJustValues(this.whereConditions);
    }
    let sql = `SELECT ${value} FROM ${table}`;
    if (whereClause) sql += ` WHERE ${whereClause}`;
    sql += ` ORDER BY ${table}.${options.order_by.column} ${options.order_by.sort}`;

    const rows = await connection.query(sql, justValues ?? []);
    return rows.map((row: any) => row[value]);
  }
  /**
   * Paginate query results.
   *
   * This method fetches the database records corresponding to the requested page,
   * with a specified number of records per page. It also applies any previously set `where`
   * conditions, relations (`with`), and executes the necessary queries for pagination.
   *
   * @param {number} current_page - The current page number.
   * @param {number} per_page - The number of records to be retrieved per page.
   * @param {string[]} columns - An array of column names to retrieve. Defaults to ["*"] if not provided.
   * @returns {Promise<IPaginateData>} - A promise that resolves to an object containing the paginated data.
   *
   * The returned object includes:
   * - `data`: The current page's data (an array of instances).
   * - `total`: The total number of records in the database.
   * - `perPage`: The number of records per page.
   * - `currentPage`: The current page number.
   * - `lastPage`: The last available page number.
   * - `count`: The number of records returned on the current page.
   *
   * Example usage:
   * ```ts
   * const products = await ProductModel.paginate(1, 10);
   * ```
   */
  static async __mb_paginate(current_page: number, per_page: number, columns: string[], options: IOptions): Promise<IPaginateData> {
    try {
      const table = this.getTable();
      const connection = Database.getConnection();
      let whereClause = null;
      let justValues = null;
      const conditions = options.conditions ? options.conditions : null;
      if (conditions) {
        whereClause = this.setWhereConditions(conditions);
        justValues = this.getJustValues(conditions);
      }
      let sql = `SELECT `;
      let columnAliases: string[] = [];

      columns.forEach((column) => {
        if (column === "*") {
          columnAliases.push(`${table}.*`);
        } else {
          columnAliases.push(`${table}.${column}`);
        }
      });

      sql += `${columnAliases.map((column) => column)}`;
      if (options.relations?.length) {
        options.relations.forEach(({ relatedTable, foreignKey, primaryKey, relatedAlias, singularName }) => {
          relatedAlias.forEach((i) => {
            sql += `, ${relatedTable}.${i} AS ${singularName}_${i}`;
          });
          sql += ` FROM ${table}`;
          sql += ` LEFT JOIN ${relatedTable} ON ${relatedTable}.${primaryKey} = ${table}.${foreignKey}`;
        });
      }
      if (!options.relations?.length) sql += ` FROM ${table}`;
      if (whereClause) sql += ` WHERE ${whereClause}`;
      const offset = (current_page - 1) * per_page;
      sql += ` ORDER BY ${table}.${options.order_by.column} ${options.order_by.sort}`;
      sql += ` LIMIT ?, ?`;

      const rows = await connection.query(
        sql,
        justValues ? [...justValues, offset.toString(), per_page.toString()] : [offset.toString(), per_page.toString()],
      );
      const instances = rows.map((row: any) => {
        let instance = Object.create(this.prototype);
        Object.assign(instance, row);
        if (options.relations?.length) {
          options.relations.forEach((relation: IRelations) => {
            row = this.setRelations(relation, instance, row);
          });
        }
        return instance;
      });
      let sqlCount = `SELECT COUNT(*) as total FROM ${table}`;
      if (whereClause) sqlCount += ` WHERE ${whereClause}`;
      const totalRows = await connection.query(sqlCount, justValues ?? []);
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
      throw new Error("Error in pagination: " + error.message);
    }
  }
  private static getJustValues(where_conditions: Record<string, any>) {
    const keys = Object.keys(where_conditions);
    const values = keys.map((key) => {
      let value = where_conditions[key];
      if (Array.isArray(value) && value.length === 2) {
        value = value[1];
      }
      return value;
    });
    return values;
  }
  private static setWhereConditions(conditions: Record<string, any>): string {
    try {
      const keys = Object.keys(conditions);
      const values = Object.values(conditions);
      return keys
        .map((key) => {
          const value = conditions[key];

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
    } catch (error: any) {
      throw new Error("Error setting WHERE conditions: " + error.message);
    }
  }
  private static resetValues() {
    this.selectedRelations = [];
    this.whereConditions = {};
    this.order_by = {
      column: "id",
      sort: "asc",
    };
  }
  private static setRelations(relation: any, instance: any, row: any) {
    if (relation.type === "belongsTo") {
      instance[relation.singularName] = {};
      if (Array.isArray(relation.relatedAlias)) {
        relation.relatedAlias.forEach((alias: any) => {
          const column_alias = `${relation.singularName}_${alias}`;
          if (row[column_alias]) {
            instance[relation.singularName][alias] = row[column_alias];
            delete instance[column_alias];
          }
        });
      }
    }
    return instance;
  }
}
export default ModelBase;

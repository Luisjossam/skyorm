import Database from "./database";
import { IPaginateData, IRelations } from "./interfaces/interfaces";
import pluralize from "pluralize";
const validOperators = ["=", ">", "<", ">=", "<=", "LIKE", "IN", "IS", "IS NOT"];
interface IOptions {
  relations?: IRelations[];
  conditions?: Record<string, any>;
  order_by: { column: string; sort: string };
  number_limit?: number | null;
}
abstract class ModelBase {
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
  static belongsTo(model: typeof ModelBase, columns: string[], foreign_key?: string, local_key: string = this.primaryKey) {
    const relatedTable = model.getTable();
    const singularName = pluralize.isSingular(relatedTable) ? relatedTable : pluralize.singular(relatedTable);
    const foreignKey = foreign_key ?? `${singularName}_${local_key}`;

    return {
      type: "belongsTo",
      relatedTable,
      foreignKey,
      singularName,
      primaryKey: model.primaryKey,
      relatedAlias: columns,
    };
  }
  static hasMany(model: typeof ModelBase, columns: string[], foreign_key?: string, local_key: string = this.primaryKey) {
    const relatedTable = model.getTable();
    const foreignKey = foreign_key ?? `${pluralize.singular(this.getTable())}_${local_key}`;
    return {
      type: "hasMany",
      relatedTable,
      foreignKey,
      primaryKey: model.primaryKey,
      relatedAlias: columns,
    };
  }
  static hasOne(model: typeof ModelBase, columns: string[], foreign_key?: string, local_key: string = this.primaryKey) {
    const relatedTable = model.getTable();
    const singularName = pluralize.isSingular(relatedTable) ? relatedTable : pluralize.singular(relatedTable);
    const foreignKey = foreign_key ?? `${pluralize.singular(this.getTable())}_${local_key}`;
    return {
      type: "hasOne",
      relatedTable,
      foreignKey,
      singularName,
      primaryKey: model.primaryKey,
      relatedAlias: columns,
    };
  }
  /**
   * @internal
   * Processes a list of relation method names defined in the model and returns an array of `IRelations` objects.
   *
   * This method locates and executes each relation method (e.g., `category()`, `user()`) defined in the model.
   * Each of these methods is expected to return a valid `IRelation` object.
   *
   * @param {...string[]} relations - Names of relation methods defined on the model.
   * @returns {IRelations[]} An array of `IRelations` objects built from the given relation methods.
   *
   * @example
   * // Assuming the model has a method named 'category':
   * Product.__mb_with("category");
   */
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
   * @internal
   * Finds a single model instance by its primary key and optionally includes specified relations.
   *
   * This method builds a raw SQL query to fetch the row from the database, along with any
   * defined relations using `LEFT JOIN`. It returns an instance of the model with all the
   * selected data attached and relation data populated if requested.
   *
   * @param {number | string} primary_key - The primary key value of the record to find.
   * @param {string[]} columns - List of columns to select. Use ['*'] to select all columns from the main table.
   * @param {Omit<IOptions, "order_by">} options - Additional options, such as `relations`, but excludes `order_by`.
   *
   * @returns {Promise<any>} A Promise resolving to a single instance of the model, or `null` if not found.
   *
   * @example
   * // Basic usage without relations
   * const user = await User.__mb_find(1, ["name", "email"], {});
   *
   * @example
   * // With relations
   * const product = await Product.__mb_find(2, ["*"], {
   *   relations: Product.__mb_with("category")
   * });
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
      options.relations.forEach((relation) => {
        if (relation.type === "belongsTo") {
          relation.relatedAlias.forEach((i) => {
            sql += `, ${relation.relatedTable}.${i} AS ${relation.singularName}_${i}`;
          });
          sql += ` FROM ${table}`;
          sql += ` LEFT JOIN ${relation.relatedTable} ON ${relation.relatedTable}.${relation.primaryKey} = ${table}.${relation.foreignKey}`;
        } else if (relation.type === "hasMany" || relation.type === "hasOne") {
          sql += ` FROM ${table}`;
        }
      });
    }
    if (!options.relations?.length) sql += ` FROM ${table}`;
    sql += ` WHERE ${table}.${this.primaryKey} = ? LIMIT 1`;

    const rows = await connection.query(sql, [primary_key]);
    let instance_relation = rows.length ? Object.create(this.prototype) : null;
    if (!instance_relation) return null;
    Object.assign(instance_relation, rows[0]);
    if (options.relations?.length) {
      for (const relation of options.relations) {
        instance_relation = await this.setRelations(relation, instance_relation, rows[0]);
      }
    }
    return instance_relation;
  }
  /**
   * @internal
   * Retrieves a single model instance that matches the given `where` conditions,
   * with optional eager loading of specified relations.
   *
   * This method constructs a raw SQL query with optional `LEFT JOIN`s and a `WHERE` clause
   * based on the given conditions. It returns the first matching row as an instance of the model.
   *
   * @param {string[]} columns - List of columns to select. Use ['*'] to select all columns from the main table.
   * @param {Omit<IOptions, "order_by">} options - Query options such as `conditions` and `relations`. Excludes `order_by`.
   *
   * @returns {Promise<any>} A Promise that resolves to a single instance of the model or `null` if no match is found.
   *
   * @example
   * // Get a single user by email
   * const user = await User.__mb_getOne(["id", "name"], {
   *   conditions: { email: "test@example.com" }
   * });
   *
   * @example
   * // With related model data (e.g., category)
   * const product = await Product.__mb_getOne(["*"], {
   *   conditions: { slug: "product-slug" },
   *   relations: Product.__mb_with("category")
   * });
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
      options.relations.forEach((relation) => {
        if (relation.type === "belongsTo") {
          relation.relatedAlias.forEach((i) => {
            sql += `, ${relation.relatedTable}.${i} AS ${relation.singularName}_${i}`;
          });
          sql += ` FROM ${table}`;
          sql += ` LEFT JOIN ${relation.relatedTable} ON ${relation.relatedTable}.${relation.primaryKey} = ${table}.${relation.foreignKey}`;
        } else if (relation.type === "hasMany" || relation.type === "hasOne") {
          sql += ` FROM ${table}`;
        }
      });
    }
    if (!options.relations?.length) sql += ` FROM ${table}`;

    if (whereClause) sql += ` WHERE ${whereClause}`;
    sql += ` LIMIT 1`;

    const rows = await connection.query(sql, justValues ?? []);

    let instance_relation = rows.length ? Object.create(this.prototype) : null;
    if (!instance_relation) return null;
    Object.assign(instance_relation, rows[0]);
    if (options.relations?.length) {
      for (const relation of options.relations) {
        instance_relation = await this.setRelations(relation, instance_relation, rows[0]);
      }
    }
    return instance_relation;
  }
  /**
   * @internal
   * Retrieves all records from the table, including optional eager-loaded relations.
   *
   * This method does not support `WHERE` conditions. If `whereConditions` are set,
   * an error is thrown to enforce the use of `get()` instead.
   *
   * It dynamically builds the SQL `SELECT` statement and applies `LEFT JOIN`s for relations.
   * Results are returned as instantiated model objects.
   *
   * @param {string[]} columns - List of columns to select. Use ['*'] to select all columns from the main table.
   * @param {IOptions} options - Query options including `order_by` and optional `relations` to eager load.
   *
   * @throws {Error} If `whereConditions` exist when calling this method.
   *
   * @returns {Promise<any[]>} A Promise that resolves to an array of model instances.
   *
   * @example
   * // Get all users, ordered by creation date
   * const users = await User.__mb_all(["id", "name"], {
   *   order_by: { column: "created_at", sort: "desc" }
   * });
   *
   * @example
   * // Get all products with related category
   * const products = await Product.__mb_all(["*"], {
   *   order_by: { column: "id", sort: "asc" },
   *   relations: Product.__mb_with("category")
   * });
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
   * @internal
   * Retrieves records from the table based on provided conditions and options, including optional relations.
   *
   * This method supports adding `WHERE` conditions to filter the results, as well as `ORDER BY` for sorting.
   * It also handles eager-loading relations by performing `LEFT JOIN`s on the related tables.
   *
   * @param {string[]} columns - List of columns to select. Use ['*'] to select all columns from the main table.
   * @param {IOptions} options - Query options including `conditions`, `order_by`, and optional `relations` to eager load.
   *
   * @throws {Error} If `conditions` are not properly defined or if `relations` cause issues in the query.
   *
   * @returns {Promise<any[]>} A Promise that resolves to an array of model instances.
   *
   * @example
   * // Get users filtered by conditions and ordered by name
   * const users = await User.__mb_get(["id", "name"], {
   *   conditions: { status: "active" },
   *   order_by: { column: "name", sort: "asc" }
   * });
   *
   * @example
   * // Get products with related category, ordered by price
   * const products = await Product.__mb_get(["*"], {
   *   conditions: { in_stock: true },
   *   order_by: { column: "price", sort: "desc" },
   *   relations: Product.__mb_with("category")
   * });
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
        if (relation.type === "belongsTo") {
          relation.relatedAlias.forEach((i) => {
            sql += `, ${relation.relatedTable}.${i} AS ${relation.singularName}_${i}`;
          });
          sql += ` FROM ${table}`;
          sql += ` LEFT JOIN ${relation.relatedTable} ON ${relation.relatedTable}.${relation.primaryKey} = ${table}.${relation.foreignKey}`;
        } else if (relation.type === "hasMany" || relation.type === "hasOne") {
          sql += ` FROM ${table}`;
        }
      });
    }
    if (!options.relations?.length) sql += ` FROM ${table}`;

    if (whereClause) sql += ` WHERE ${whereClause}`;
    sql += ` ORDER BY ${table}.${options.order_by.column} ${options.order_by.sort}`;
    if (options.number_limit) sql += ` LIMIT ${options.number_limit}`;

    const rows = await connection.query(sql, justValues ?? []);
    const instances = await Promise.all(
      rows.map(async (row: any) => {
        let instance = Object.create(this.prototype);
        Object.assign(instance, row);
        if (options.relations?.length) {
          for (const relation of options.relations) {
            row = await this.setRelations(relation, instance, row);
          }
        }
        return instance;
      }),
    );

    return instances;
  }
  /**
   * @internal
   * Retrieves all values of a specified column from the table, optionally filtered by conditions and ordered.
   *
   * This method is useful when you need to extract a single column's values, for example, all the names or IDs
   * from a specific table, with optional filtering and sorting.
   *
   * @param {string} value - The column name whose values are to be retrieved.
   * @param {IOptions} options - Query options including optional `order_by` and `conditions` for filtering.
   *
   * @throws {Error} If the query fails or if there are issues with conditions or ordering.
   *
   * @returns {Promise<string[] | number[]>} A Promise that resolves to an array of values from the specified column.
   *
   * @example
   * // Get all product names ordered by price in descending order
   * const productNames = await Product.__mb_pluck("name", {
   *   order_by: { column: "price", sort: "desc" }
   * });
   *
   * @example
   * // Get all active user IDs ordered by creation date
   * const userIds = await User.__mb_pluck("id", {
   *   conditions: { status: "active" },
   *   order_by: { column: "created_at", sort: "asc" }
   * });
   */
  static async __mb_pluck(value: string, options: IOptions): Promise<string[] | number[]> {
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
    if (options.number_limit) sql += ` LIMIT ${options.number_limit}`;

    const rows = await connection.query(sql, justValues ?? []);
    return rows.map((row: any) => row[value]);
  }
  /**
   * @internal
   * Paginates the results for a given query, returning a specific subset of data based on the provided page number and page size.
   * This method constructs a SQL query to retrieve a paginated set of records, along with metadata about the pagination.
   *
   * @param {number} current_page - The current page number (1-based).
   * @param {number} per_page - The number of results to return per page.
   * @param {string[]} columns - An array of columns to select.
   * @param {IOptions} options - Query options that include optional `conditions`, `relations`, and `order_by`.
   *
   * @throws {Error} If there's an error with the pagination logic, SQL execution, or if the query is malformed.
   *
   * @returns {Promise<IPaginateData>} A promise that resolves to an object containing:
   *   - `data`: The paginated list of instances.
   *   - `total`: The total number of records in the table.
   *   - `perPage`: The number of records per page.
   *   - `currentPage`: The current page number.
   *   - `lastPage`: The total number of pages.
   *   - `count`: The number of records on the current page.
   *
   * @example
   * // Get paginated products ordered by price
   * const paginatedProducts = await Product.__mb_paginate(1, 10, ["id", "name", "price"], {
   *   order_by: { column: "price", sort: "desc" },
   *   relations: [{ relatedTable: "category", foreignKey: "category_id", primaryKey: "id", relatedAlias: ["name"], singularName: "category" }],
   * });
   *
   * @example
   * // Get paginated users who are active, ordered by registration date
   * const activeUsers = await User.__mb_paginate(2, 20, ["id", "name", "email"], {
   *   conditions: { status: "active" },
   *   order_by: { column: "registered_at", sort: "asc" },
   * });
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
        options.relations.forEach((relation) => {
          if (relation.type === "belongsTo") {
            relation.relatedAlias.forEach((i) => {
              sql += `, ${relation.relatedTable}.${i} AS ${relation.singularName}_${i}`;
            });
            sql += ` FROM ${table}`;
            sql += ` LEFT JOIN ${relation.relatedTable} ON ${relation.relatedTable}.${relation.primaryKey} = ${table}.${relation.foreignKey}`;
          } else if (relation.type === "hasMany" || relation.type === "hasOne") {
            sql += ` FROM ${table}`;
          }
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
      const instances = await Promise.all(
        rows.map(async (row: any) => {
          let instance = Object.create(this.prototype);
          Object.assign(instance, row);
          if (options.relations?.length) {
            for (const relation of options.relations) {
              row = await this.setRelations(relation, instance, row);
            }
          }
          return instance;
        }),
      );
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
  /**
   * * @internal
   * Checks if a record exists in the table based on the provided conditions.
   *
   * This method executes a `SELECT` query with a `LIMIT 1` clause to efficiently
   * determine the existence of a record matching the given conditions. It returns
   * `true` if at least one record is found, otherwise `false`.
   *
   * @param {Omit<IOptions, "order_by">} options - Query options excluding ordering.
   * Must include `conditions` to filter the results.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if a matching record exists, or `false` otherwise.
   *
   * @throws {Error} Throws an error if the query execution fails or if invalid conditions are provided.
   *
   * @example
   * const exists = await User.__mb_exist({ conditions: { email: ["=", "test@example.com"] } });
   * if (exists) {
   *   console.log("User already exists.");
   * }
   */
  static async __mb_exist(options: Omit<IOptions, "order_by">): Promise<boolean> {
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
      let sql = `SELECT ${this.primaryKey} FROM ${table}`;

      if (whereClause) sql += ` WHERE ${whereClause}`;
      sql += ` LIMIT 1`;

      const rows = await connection.query(sql, justValues ?? []);
      return !!rows[0];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  /**
   * * @internal
   * Executes a SUM aggregate function on the specified column, optionally using WHERE conditions.
   *
   * This is an internal method used by the ORM to calculate the total sum of values
   * in a given column, filtered by optional conditions.
   *
   * @param {string} column - The name of the column to sum.
   * @param {Omit<IOptions, "order_by">} options - Query options excluding order_by. Can include conditions.
   * @returns {Promise<number>} A promise that resolves to the sum of the column values matching the conditions.
   *
   * @throws {Error} Throws an error if the SQL execution fails.
   *
   * @example
   * const total = await User.__mb_sum("balance", {
   *   conditions: { active: true }
   * });
   */
  static async __mb_sum(column: string, options: Omit<IOptions, "order_by">): Promise<number> {
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
      let sql = `SELECT SUM(${column}) as ${column} FROM ${table}`;

      if (whereClause) sql += ` WHERE ${whereClause}`;
      if (options.number_limit) sql += ` LIMIT ${options.number_limit}`;
      console.log(sql);

      const rows = await connection.query(sql, justValues ?? []);

      return rows[0][column];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  /**
   * @internal
   * Executes a raw SQL query and returns the result either as model instances or as plain JSON objects.
   *
   * @param {string} query The raw SQL query to execute.
   * @param {Array<string | number | boolean>} values The values to bind to the query parameters.
   * @param {boolean} asModel If `true`, the result will be returned as instances of the model; if `false`, it will return a plain JSON object.
   * @returns {Promise<Array<ModelType> | any[]>} An array of model instances if `asModel` is `true`, or a plain JSON array if `asModel` is `false`.
   * @throws {Error} Throws an error if the query fails.
   */
  static async __mb_raw(query: string, values: (string | number | boolean)[], asModel: boolean) {
    try {
      const connection = Database.getConnection();
      let sanitize: string[] = [];
      if (values.length > 0) {
        sanitize = this.sanitizeArray(values);
      }
      const response = await connection.query(query, sanitize);
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
  /**
   * @private
   * Extracts the values from the `where_conditions` object. If the condition value is an array with two elements,
   * it returns the second element, otherwise it returns the value directly.
   *
   * @param {Record<string, any>} where_conditions - An object where keys represent the columns and values represent
   *        the conditions or values for those columns.
   *
   * @returns {any[]} An array of values extracted from the `where_conditions` object, where the second element of any
   *         array-based condition is used.
   *
   * @example
   * // Example usage:
   * const conditions = { status: "active", age: [">", 18] };
   * const values = Model.getJustValues(conditions);
   * console.log(values); // Output: ["active", 18]
   */
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
  /**
   * @private
   * Constructs a SQL WHERE clause from the provided conditions object. The conditions object can include operators
   * (e.g., `=`, `>`, `IN`, `IS`) and values. It throws an error if an invalid operator is used.
   *
   * @param {Record<string, any>} conditions - An object where keys are column names and values are conditions.
   *        The value can either be a single condition or an array where the first element is an operator
   *        and the second is the value to be compared.
   *
   * @returns {string} A SQL WHERE clause that can be used in a SQL query.
   *
   * @throws {Error} If an invalid operator is used in the conditions.
   *
   * @example
   * // Example usage:
   * const conditions = { age: [">", 18], status: "active" };
   * const whereClause = Model.setWhereConditions(conditions);
   * console.log(whereClause); // Output: "age > ? AND status = ?"
   */
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
  /**
   * @private
   * Sets the related data for a given instance based on the provided relation.
   * This method handles the 'belongsTo' relation type, mapping related data to the instance.
   * It processes column aliases and maps them to their respective related attributes.
   *
   * @param {any} relation - The relation configuration object, typically including the following properties:
   *        - `type`: The type of relation (e.g., "belongsTo").
   *        - `singularName`: The singular name of the related entity (e.g., "author").
   *        - `relatedAlias`: The aliases for the related columns (e.g., ["name", "id"]).
   *
   * @param {any} instance - The instance object to which the related data will be added.
   *
   * @param {any} row - The row of data from the database, containing the related fields as column aliases.
   *
   * @returns {any} The updated instance with the related data set.
   *
   * @example
   * // Example usage:
   * const relation = { type: "belongsTo", singularName: "author", relatedAlias: ["name", "id"] };
   * const instance = { title: "Some Book" };
   * const row = { "author_name": "John Doe", "author_id": 1 };
   * const updatedInstance = Model.setRelations(relation, instance, row);
   * console.log(updatedInstance); // Output: { title: "Some Book", author: { name: "John Doe", id: 1 } }
   */
  private static async setRelations(relation: any, instance: any, row: any) {
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
    } else if (relation.type === "hasMany") {
      let query = `SELECT ${relation.relatedAlias.map((i: any) => i)} FROM ${relation.relatedTable} WHERE ${relation.foreignKey} = ${row[relation.primaryKey]}`;
      const data = await this.__mb_raw(query, [], false);
      if (data) instance[relation.relatedTable] = data;
    } else if (relation.type === "hasOne") {
      let query = `SELECT ${relation.relatedAlias.map((i: any) => i)} FROM ${relation.relatedTable} WHERE ${relation.foreignKey} = ${row[relation.primaryKey]} LIMIT 1`;
      const data = await this.__mb_raw(query, [], false);
      if (data) instance[relation.singularName] = data[0];
    }
    return instance;
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

import Model from "../model";

export interface IDatabaseConfig {
  driver: "mysql" | "sqlite" | "postgres";
  host: string;
  database: string;
  user: string;
  password: string;
  port?: number;
  filepath?: string;
}
export interface IDBConnection {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}
export interface IDBDriver {
  connect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  close(): Promise<void>;
}
export interface IRelations {
  relatedTable: string;
  foreignKey: string;
  primaryKey: string;
  singularName: string;
  relatedAlias: string[];
  type: string;
  pivotTable?: string;
  thisTable?: string;
  relatedKey?: string;
  modelPrimaryKey?: string;
}
export interface IPaginateData {
  data: any[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  count: number;
}
export interface IQueryBuilder {
  /**
   * Sets the conditions for filtering data in a query.
   * This method provides a public interface for applying `WHERE` conditions to the query.
   *
   * @param {Record<string, any>} conditions - The conditions to filter the data.
   * The conditions should be in the form of an object, where the keys represent columns and the values represent the criteria for filtering.
   *
   * @returns {QueryBuilder} A `QueryBuilder` instance with the applied `WHERE` conditions.
   *
   * @example
   * // Example usage:
   * const users = await User.where({ age: [">", 18] }).get(["name", "age"]);
   * console.log(users);
   * // Output: [{ name: "John", age: 25 }, { name: "Alice", age: 30 }]
   */
  where(conditions: Record<string, any>): IQueryBuilderWhere;
  /**
   * Retrieves a single record from the table based on the specified columns.
   * This method serves as a public interface for fetching a single record from the database.
   *
   * @param {string[]} [columns=["*"]] - An array of column names to select from the table. Defaults to `["*"]` to select all columns.
   *
   * @returns {Promise<any | null>} A promise that resolves to a single model instance populated with the fetched data or `null` if no record is found.
   *
   * @example
   * // Example usage:
   * const result = await Model.getOne(["id", "name"]);
   * console.log(result); // Output: A single model instance with `id` and `name` columns or `null` if no record is found
   */
  get(columns?: string[]): Promise<any>;
  /**
   * Retrieves a single record from the table based on the specified columns.
   * This method serves as a public interface for fetching a single record from the database.
   *
   * @param {string[]} [columns=["*"]] - An array of column names to select from the table. Defaults to `["*"]` to select all columns.
   *
   * @returns {Promise<any | null>} A promise that resolves to a single model instance populated with the fetched data or `null` if no record is found.
   *
   * @example
   * // Example usage:
   * const result = await Model.getOne(["id", "name"]);
   * console.log(result); // Output: A single model instance with `id` and `name` columns or `null` if no record is found
   */
  getOne(columns?: string[]): Promise<any>;
  /**
   * Retrieves a single record from the table based on the provided primary key.
   * This method acts as a public interface for fetching a record by its primary key.
   *
   * @param {number | string} primary_key - The primary key of the record to retrieve.
   * @param {string[]} [columns=["*"]] - An array of column names to select from the table. Defaults to `["*"]` to select all columns.
   *
   * @returns {Promise<any | null>} A promise that resolves to a single model instance populated with the fetched data, or `null` if no record is found.
   *
   * @example
   * // Example usage:
   * const result = await Model.find(1, ["id", "name"]);
   * console.log(result); // Output: A single model instance with `id` and `name` columns or `null` if no record is found
   */
  find(primary_key: number | string, columns?: string[]): Promise<any>;
  /**
   * Retrieves a paginated list of records from the table with optional column selection.
   * This method acts as a public interface for paginated queries.
   *
   * @param {number} current_page - The current page number for pagination.
   * @param {number} per_page - The number of records to fetch per page.
   * @param {string[]} [columns=["*"]] - An array of column names to select from the table. Defaults to `["*"]` to select all columns.
   *
   * @returns {Promise<IPaginateData>} A promise that resolves to an object containing the paginated data, total records, and pagination details.
   *
   * @example
   * // Example usage:
   * const result = await Model.paginate(1, 10, ["id", "name"]);
   * console.log(result);
   * // Output: { data: [...], total: 100, perPage: 10, currentPage: 1, lastPage: 10, count: 10 }
   */
  paginate(current_page: number, per_page: number, columns?: string[]): Promise<any>;
  /**
   * Adds relations to the query, specifying the related tables to be included in the result set.
   * This method allows developers to include related data from other tables, typically using JOINs.
   *
   * @param {...string} relations - A list of relations (related table names or aliases) to be included in the query.
   *
   * @returns {QueryBuilder} A `QueryBuilder` instance with the applied `JOIN` clauses for the specified relations.
   *
   * @example
   * // Example usage:
   * const orders = await Order.with("user", "products").all(["order_id"]);
   * console.log(orders);
   * // Output:
   * // [{ order_id: 1, user: { name: "John" }, products: [{ name: "Laptop" }] }]
   */
  with(...relations: string[]): IQueryBuilderWith;
  /**
   * Sets the sorting order for the query result.
   * This method allows developers to define the sorting direction of the query results
   * based on a specified column and sort order (ascending or descending).
   *
   * @param {string} column - The name of the column by which the query results should be ordered.
   * @param {"asc" | "desc"} sort - The sort direction. Can be either "asc" for ascending or "desc" for descending.
   *
   * @returns {QueryBuilder} A `QueryBuilder` instance with the applied `ORDER BY` clause.
   *
   * @example
   * // Example usage:
   * const users = await User.orderBy("age", "asc").all(["name", "age"]);
   * console.log(users);
   * // Output: [{ name: "Alice", age: 20 }, { name: "John", age: 25 }]
   */
  orderBy(column: string, sort: "asc" | "desc"): IQueryBuilderOrderBy;
  /**
   * Retrieves the distinct values of a specific column from the table.
   * This method acts as a public interface for querying the distinct values of a column.
   *
   * @param {string} column - The column name from which to retrieve distinct values.
   *
   * @returns {Promise<string[] | number[]>} A promise that resolves to an array of distinct values from the specified column.
   *
   * @example
   * // Example usage:
   * const values = await Model.pluck("name");
   * console.log(values);
   * // Output: ["John", "Alice", "Bob"]
   */
  pluck(column: string): Promise<any>;
  /**
   * Sets a limit on the number of records to retrieve from the query.
   *
   * This is useful when you only want to retrieve a specific number of results.
   * Typically used in conjunction with other query builder methods like `where` or `orderBy`.
   *
   * @param {number} limit - The maximum number of records to return.
   * @returns {QueryBuilder} An instance of the QueryBuilder for method chaining.
   *
   * @example
   * const users = await User.where({ active: true }).limit(10).get();
   */
  limit(limit: number): IQueryBuilderLimit;
}
interface IQBSum {
  /**
   * Returns the total sum of the specified column values across all records
   * that match the current model's conditions.
   *
   * @param {string} column - The name of the column to sum.
   * @returns {Promise<number>} A promise that resolves to the sum of the column.
   *
   * @example
   * const total = await User.where({ active: true }).sum("balance");
   */
  sum(column: string): Promise<number>;
}
export interface IModelMethods extends IQueryBuilder, IQBSum {
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
   */
  belongsTo(model: typeof Model, columns: string[], foreign_key?: string): any;
  hasMany(model: typeof Model, columns: string[], foreign_key?: string): any;
  hasOne(model: typeof Model, columns: string[], foreign_key?: string): any;
  belongsToMany(model: typeof Model, columns: string[], pivotTable?: string, foreignKey?: string, relatedKey?: string): any;
  /**
   * Executes a raw SQL query and returns the result either as model instances or as plain JSON objects.
   *
   * @param {string} query The raw SQL query to execute.
   * @param {Array<string | number>} values The values to bind to the query parameters.
   * @param {boolean} [as_model=true] If `true`, the result will be returned as instances of the model; if `false`, it will return a plain JSON object. Defaults to `true`.
   * @returns {Promise<Array<ModelType> | any[]>} An array of model instances if `as_model` is `true`, or a plain JSON array if `as_model` is `false`.
   * @throws {Error} Throws an error if the query fails.
   *
   * @example
   * // Example usage:
   * const table = "products";
   * const products = await ProductModel.raw(`SELECT * FROM ${table} WHERE price > ? LIMIT ?`, [20, 2]);
   * console.log(products); // Output will be an array of Product model instances.
   *
   * // Example with plain JSON response:
   * const plainProducts = await ProductModel.raw(`SELECT * FROM ${table} WHERE price > ? LIMIT ?`, [20, 2], false);
   * console.log(plainProducts); // Output will be a plain JSON array.
   */
  raw(query: string, values: (string | number | boolean)[], as_model?: boolean): Promise<any[]>;
}
export interface IQueryBuilderWhere extends Omit<IQueryBuilder, "where" | "find">, IQBSum {
  /**
   * Checks if at least one record exists in the table using the current query context.
   *
   * It returns `true` if any record matches the previously defined query conditions, otherwise `false`.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if a matching record exists, or `false` otherwise.
   *
   * @example
   * const exists = await User.where({ email: ["=", "test@example.com"] }).exist();
   * if (exists) {
   *   console.log("User already exists.");
   * }
   */
  exist(): Promise<boolean>;
}
export interface IQueryBuilderOrderBy extends Omit<IQueryBuilder, "orderBy" | "find" | "getOne"> {}
export interface IQueryBuilderWith extends Omit<IQueryBuilder, "pluck" | "with"> {}
export interface IQueryBuilderLimit extends Omit<IQueryBuilder, "getOne" | "find" | "limit" | "paginate"> {}

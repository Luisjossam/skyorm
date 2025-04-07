import { IPaginateData } from "./interfaces/interfaces";
import ModelBase from "./model_base";
import QueryBuilder from "./queries/QueryBuilder";

class Model extends ModelBase {
  constructor(table: string) {
    super(table);
  }
  private static readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
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
  static with(...relations: string[]) {
    return new QueryBuilder(this).with(...relations);
  }
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
  static orderBy(column: string, sort: "asc" | "desc") {
    return new QueryBuilder(this).orderBy(column, sort);
  }
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
  static where(conditions: Record<string, any>) {
    return new QueryBuilder(this).where(conditions);
  }
  /**
   * Retrieves all records from the table based on the specified columns.
   * This method serves as a public interface for fetching multiple records from the database.
   *
   * @param {string[]} [columns=["*"]] - An array of column names to select from the table. Defaults to `["*"]` to select all columns.
   *
   * @returns {Promise<any[]>} A promise that resolves to an array of instances populated with the fetched data.
   *
   * @example
   * // Example usage:
   * const results = await Model.all(["id", "name"]);
   * console.log(results); // Output: Array of model instances with `id` and `name` columns
   */
  static get(columns: string[] = ["*"]): Promise<any[]> {
    return this.__mb_get(columns, { order_by: this.order_by });
  }
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
  static getOne(columns: string[] = ["*"]): Promise<any | null> {
    return this.__mb_getOne(columns, {});
  }
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
  static find(primary_key: number | string, columns: string[] = ["*"]): Promise<any | null> {
    return this.__mb_find(primary_key, columns, {});
  }
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
  static paginate(current_page: number, per_page: number, columns: string[] = ["*"]): Promise<IPaginateData> {
    return this.__mb_paginate(current_page, per_page, columns, { order_by: this.order_by });
  }
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
   * const values = await Model.valuesOf("name");
   * console.log(values);
   * // Output: ["John", "Alice", "Bob"]
   */
  static valuesOf(column: string): Promise<string[] | number[]> {
    return this.__mb_valuesOf(column, { order_by: this.order_by });
  }
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
  static sum(column: string): Promise<number> {
    return this.__mb_sum(column, {});
  }
}
export default Model;

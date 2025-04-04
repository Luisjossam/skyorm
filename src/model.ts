import Database from "./database";
import { IPaginateData, IRelations } from "./interfaces/interfaces";
import pluralize from "pluralize";
const validOperators = ["=", ">", "<", ">=", "<=", "LIKE", "IN", "IS", "IS NOT"];
class QueryBuilder {
  private model: typeof Model;
  private conditions: Record<string, any> = {};

  constructor(model: typeof Model, conditions: Record<string, any>) {
    this.model = model;
    this.conditions = conditions;
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
  async findOne(columns: string[] = ["*"]) {
    return this.model.findOne.call(this.model, columns);
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
  async valuesOf(value: string) {
    return this.model.valuesOf.call(this.model, value);
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
  async get(columns: string[] = ["*"]) {
    return this.model.get.call(this.model, columns);
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
  async paginate(current_page: number, per_page: number, columns: string[] = ["*"]) {
    return this.model.paginate.call(this.model, current_page, per_page, columns);
  }
}
class Model {
  static table: string;
  static primaryKey: string = "id";
  public selectedRelations: IRelations[] = [];
  public whereConditions: Record<string, any> = {};
  static [key: string]: any;

  constructor(data: Record<string, any> = {}) {
    Object.assign(this, data);
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
   * Eager loads the specified relations for the model instance.
   * This method allows you to specify relationships to include in the query results by appending them to the `selectedRelations` array.
   * It creates a new instance of the model, copies the current selected relations, and then adds the requested relations.
   *
   * Each relation name corresponds to a method that defines the relationship on the model.
   * If the method exists, it is called, and the relation is added to the `selectedRelations` array.
   *
   * @param {...string} relations - The names of the relations to be eagerly loaded. Each relation name should correspond to a method on the model.
   *
   * @returns {Model} A new instance of the model with the specified relations loaded.
   *
   * @example
   * class ProductModel extends Model {
   *   category() {
   *     return this.belongsTo(CategoryModel);
   *   }
   * }
   *
   * const product = ProductModel.with('category').findById(1);
   * // The product will include the 'category' relation in the result.
   */
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
  /**
   * Applies filtering conditions to the query and returns a QueryBuilder instance.
   *
   * @param conditions - An object containing filtering conditions (column: value).
   * @returns {QueryBuilder} - A QueryBuilder instance with the applied conditions.
   *
   * @example
   * // Retrieve products with a price greater than or equal to 100
   * const query = ProductModel.where({ price: [">=", 100] }).findOne();
   */
  static where(conditions: Record<string, any>) {
    this.whereConditions = conditions;
    return new QueryBuilder(this, conditions);
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
  static async find(primary_key: number | string, columns: string[] = ["*"]) {
    const table = this.getTable();
    const connection = Database.getConnection();
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
    sql += ` WHERE ${table}.${this.primaryKey} = ? LIMIT 1`;

    const rows = await connection.query(sql, [primary_key]);
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
  static async findOne(columns: string[] = ["*"]) {
    const table = this.getTable();
    const connection = Database.getConnection();

    let whereClause = "";
    let justValues = null;
    if (this.whereConditions) {
      const keys = Object.keys(this.whereConditions);
      const values = Object.values(this.whereConditions);
      whereClause = keys
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
      justValues = this.getJustValues(this.whereConditions);
    }
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

    if (whereClause !== "") sql += ` WHERE ${whereClause}`;
    sql += ` LIMIT 1`;

    const rows = await connection.query(sql, justValues ?? []);
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
    this.whereConditions = {};
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
  static async get(columns: string[] = ["*"]) {
    const table = this.getTable();
    const connection = Database.getConnection();

    let whereClause = "";
    let justValues = null;
    if (this.whereConditions) {
      const keys = Object.keys(this.whereConditions);
      const values = Object.values(this.whereConditions);
      whereClause = keys
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
      justValues = this.getJustValues(this.whereConditions);
    }
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

    if (whereClause !== "") sql += ` WHERE ${whereClause}`;
    const rows = await connection.query(sql, justValues ?? []);
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
    this.whereConditions = {};
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
  static async valuesOf(value: string): Promise<string[] | number[]> {
    const table = this.getTable();
    const connection = Database.getConnection();
    let whereClause = "";
    let justValues = null;
    if (this.whereConditions) {
      const keys = Object.keys(this.whereConditions);
      const values = Object.values(this.whereConditions);
      whereClause = keys
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
      justValues = this.getJustValues(this.whereConditions);
    }
    let sql = `SELECT ${value} FROM ${table}`;
    if (whereClause !== "") sql += ` WHERE ${whereClause}`;

    const rows = await connection.query(sql, justValues ?? []);
    this.whereConditions = {};
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
  static async paginate(current_page: number, per_page: number, columns: string[] = ["*"]): Promise<IPaginateData> {
    try {
      const table = this.getTable();
      const connection = Database.getConnection();
      let whereClause = "";
      let justValues = null;
      if (this.whereConditions) {
        const keys = Object.keys(this.whereConditions);
        const values = Object.values(this.whereConditions);
        whereClause = keys
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
        justValues = this.getJustValues(this.whereConditions);
      }
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
      if (whereClause !== "") sql += ` WHERE ${whereClause}`;
      const offset = (current_page - 1) * per_page;
      sql += ` LIMIT ?, ?`;

      const rows = await connection.query(
        sql,
        justValues ? [...justValues, offset.toString(), per_page.toString()] : [offset.toString(), per_page.toString()],
      );
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
      let sqlCount = `SELECT COUNT(*) as total FROM ${table}`;
      if (whereClause !== "") sqlCount += ` WHERE ${whereClause}`;
      const totalRows = await connection.query(sqlCount, justValues ?? []);
      const total = totalRows[0].total;
      const lastPage = Math.ceil(total / per_page);

      this.selectedRelations = [];
      this.whereConditions = {};

      return {
        data: instances,
        total,
        perPage: per_page,
        currentPage: current_page,
        lastPage,
        count: rows.length,
      };
    } catch (error) {
      throw error;
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
}
export default Model;

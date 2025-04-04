import ModelBase from "../model_base";

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
}
export interface IPaginateData {
  data: any[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  count: number;
}
export interface IQueryBuilderBase {
  orderBy(value: string, sort: "asc" | "desc"): this;
  get(columns?: string[]): Promise<ModelBase[]>;
}

import ModelBase from "./ModelBase";
import QueryBuilder from "../builders/QueryBuilder";
import {
  IPaginateData,
  IQueryBuilderAvg,
  IQueryBuilderCount,
  IQueryBuilderMax,
  IQueryBuilderMin,
  IQueryBuilderSum,
  IQueryBuilderWhere,
  IQueryBuilderWith,
} from "../interfaces/interfaces";
class Model extends ModelBase {
  constructor(table: string) {
    super(table);
  }
  static where(conditions: Record<string, any>): IQueryBuilderWhere {
    return new QueryBuilder(this).where(conditions);
  }
  static get(columns: string[] = ["*"]): Promise<any[]> {
    return new QueryBuilder(this).get(columns);
  }
  static with(...relations: string[]): IQueryBuilderWith {
    return new QueryBuilder(this).with(...relations);
  }
  static orderBy(column: string, sort: "ASC" | "DESC") {
    return new QueryBuilder(this).orderBy(column, sort);
  }
  static limit(limit: number) {
    return new QueryBuilder(this).limit(limit);
  }
  static getOne(columns: string[] = ["*"]): Promise<any> {
    return new QueryBuilder(this).getOne(columns);
  }
  static find(value: number | string, columns: string[] = ["*"]): Promise<any> {
    return new QueryBuilder(this).find(value, columns);
  }
  static pluck(column: string): Promise<any[]> {
    return new QueryBuilder(this).pluck(column);
  }
  static paginate(current_page: number, per_page: number, columns: string[] = ["*"]): Promise<IPaginateData> {
    return new QueryBuilder(this).paginate(current_page, per_page, columns);
  }
  static min(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderMin {
    return new QueryBuilder(this).min(column, conditions, alias);
  }
  static max(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderMax {
    return new QueryBuilder(this).max(column, conditions, alias);
  }
  static count(column: string = "*", conditions?: Record<string, any>, alias?: string): IQueryBuilderCount {
    return new QueryBuilder(this).count(column, conditions, alias);
  }
  static sum(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderSum {
    return new QueryBuilder(this).sum(column, conditions, alias);
  }
  static avg(column: string, conditions?: Record<string, any>, alias?: string): IQueryBuilderAvg {
    return new QueryBuilder(this).avg(column, conditions, alias);
  }
  static groupBy(...columns: string[]): Promise<any[]> {
    return new QueryBuilder(this).groupBy(...columns);
  }
  static raw(query: string, values: (string | number | boolean)[], as_model: boolean = true): Promise<any[]> {
    return this.__mb_raw(query, values, as_model);
  }
}
export default Model;

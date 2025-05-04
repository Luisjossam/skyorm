import ModelBase from "./ModelBase";
import QueryBuilder from "../builders/QueryBuilder";
import { IPaginateData } from "../interfaces/Interface";
import {
  Model as IModel,
  ModelSum,
  ModelWhere,
  ModelMin,
  ModelCount,
  ModelAvg,
  ModelMax,
  ModelOrderBy,
  ModelLimit,
  ModelWith,
} from "../interfaces/MainInterface";
type Model = {
  new (...args: any[]): ModelBase;
} & IModel;
class ModelClass extends ModelBase {
  constructor(table: string) {
    super(table);
  }
  static where(conditions: Record<string, any>): ModelWhere {
    return new QueryBuilder(this).where(conditions);
  }
  static with(...relations: string[]): ModelWith {
    return new QueryBuilder(this).with(...relations);
  }
  static get(columns: string[] = ["*"]): Promise<Record<string, any>> {
    return new QueryBuilder(this).get(columns);
  }

  static orderBy(column: string, sort: "ASC" | "DESC"): ModelOrderBy {
    return new QueryBuilder(this).orderBy(column, sort);
  }
  static limit(limit: number): ModelLimit {
    return new QueryBuilder(this).limit(limit);
  }
  static getOne(columns: string[] = ["*"]): Promise<Record<string, any>> {
    return new QueryBuilder(this).getOne(columns);
  }
  static find(value: number | string, columns: string[] = ["*"]): Promise<any> {
    return new QueryBuilder(this).find(value, columns);
  }
  static pluck(column: string): Promise<string[]> {
    return new QueryBuilder(this).pluck(column);
  }
  static paginate(current_page: number, per_page: number, columns: string[] = ["*"]): Promise<IPaginateData> {
    return new QueryBuilder(this).paginate(current_page, per_page, columns);
  }
  static min(column: string, conditions?: Record<string, any>, alias?: string): ModelMin {
    return new QueryBuilder(this).min(column, conditions, alias);
  }
  static max(column: string, conditions?: Record<string, any>, alias?: string): ModelMax {
    return new QueryBuilder(this).max(column, conditions, alias);
  }
  static count(column: string = "*", conditions?: Record<string, any>, alias?: string): ModelCount {
    return new QueryBuilder(this).count(column, conditions, alias);
  }
  static sum(column: string, conditions?: Record<string, any>, alias?: string): ModelSum {
    return new QueryBuilder(this).sum(column, conditions, alias);
  }
  static avg(column: string, conditions?: Record<string, any>, alias?: string): ModelAvg {
    return new QueryBuilder(this).avg(column, conditions, alias);
  }
  static groupBy(...columns: string[]): Promise<any[]> {
    return new QueryBuilder(this).groupBy(...columns);
  }
  static raw(query: string, values: (string | number | boolean)[], as_model: boolean = true): Promise<any[]> {
    return this.__mb_raw(query, values, as_model);
  }
  static create(data: Record<string, any>): Promise<any> {
    return new QueryBuilder(this).create(data, this.getTransactionConn());
  }
  static update(pk: string | number, data: Record<string, any>) {
    return new QueryBuilder(this).update(pk, data, this.getTransactionConn());
  }
}
export default ModelClass as unknown as Model;

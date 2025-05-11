interface PrimaryKey {
  primaryKey(): this;
}
interface Null {
  null(): this;
}
interface Unique {
  unique(): this;
}
interface Default {
  default(value: string | number | boolean | Date): this;
}
interface CheckLikeBetween {
  checkLikeBetween(value: string): this;
}
interface CheckLikeStart {
  checkLikeStart(value: string): this;
}
interface CheckLikeEnd {
  checkLikeEnd(value: string): this;
}
interface CheckLike {
  checkLike(value: string): this;
}
interface CheckBetweenEqual {
  checkBetweenEqual(value_1: number | string, value_2: number | string): this;
}
interface CheckBetween {
  checkBetween(value_1: number | string, value_2: number | string): this;
}
interface CheckGreaterThan {
  checkGreaterThan(value_1: number | string): this;
}
interface CheckLessThan {
  checkLessThan(value_1: number | string): this;
}
interface CheckGreaterEqualThan {
  checkGreaterEqualThan(value_1: number | string): this;
}
interface CheckLessEqualThan {
  checkLessEqualThan(value_1: number | string): this;
}
interface CheckLength {
  checkLength(value: number): this;
}
interface Unsigned {
  unsigned(): this;
}
interface ZeroFill {
  zerofill(): this;
}
export interface ColumnIncrements extends PrimaryKey {}
export interface ColumnBigInt extends Default, PrimaryKey, Unique, CheckGreaterThan, CheckLessThan, Unsigned {}
export interface ColumnTinyInt extends Default, Unique, CheckBetween, Unsigned {}
export interface ColumnBoolean extends Default {}
export interface ColumnText
  extends Null,
    CheckLength,
    CheckLessEqualThan,
    CheckGreaterEqualThan,
    CheckLessThan,
    CheckGreaterThan,
    CheckBetween,
    CheckBetweenEqual,
    CheckLike,
    CheckLikeBetween,
    CheckLikeEnd,
    CheckLikeStart {}
export interface ColumnLongText
  extends Default,
    Null,
    CheckLength,
    CheckLessEqualThan,
    CheckGreaterEqualThan,
    CheckLessThan,
    CheckGreaterThan,
    CheckBetween,
    CheckBetweenEqual,
    CheckLike,
    CheckLikeBetween,
    CheckLikeEnd,
    CheckLikeStart {}
export interface ColumnFloat
  extends Null,
    Default,
    CheckGreaterEqualThan,
    Unique,
    CheckGreaterThan,
    CheckBetween,
    CheckBetweenEqual,
    CheckLessEqualThan,
    CheckLessThan,
    Unsigned {}
export interface ColumnDouble
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLessEqualThan,
    CheckLessThan,
    Unsigned {}
export interface ColumnBinary extends Null, Default, Unique {}
export interface ColumnUuid extends Null, Default, Unique {}
export interface ColumnJson extends Null, Default, Unique {}
export interface ColumnDate
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLessEqualThan,
    CheckLessThan {}
export interface ColumnTime
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLessEqualThan,
    CheckLessThan {}
export interface ColumnDatetime
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLessEqualThan,
    CheckLessThan {}
export interface ColumnTimestamp
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLessEqualThan,
    CheckLessThan {}
export interface ColumnYear
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLessEqualThan,
    CheckLessThan {}
export interface ColumnEnum
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLength,
    CheckLessEqualThan,
    CheckLessThan,
    CheckLike,
    CheckLikeBetween,
    CheckLikeEnd,
    CheckLikeStart {}
export interface ColumnSet extends Null, Default, Unique {}
export interface ColumnChar extends Null, Default, Unique, CheckLike, CheckLikeBetween, CheckLikeEnd, CheckLikeStart {}
export interface ColumnMediumText extends Null, Default, CheckLength, CheckLike, CheckLikeBetween, CheckLikeEnd, CheckLikeStart {}
export interface ColumnSmallInt
  extends Null,
    Default,
    Unique,
    CheckLike,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLength,
    CheckLessEqualThan,
    CheckLessThan,
    CheckLikeBetween,
    CheckLikeEnd,
    CheckLikeStart {}
export interface ColumnString
  extends PrimaryKey,
    Default,
    Unique,
    Null,
    CheckLikeBetween,
    CheckLikeStart,
    CheckLikeEnd,
    CheckLike,
    CheckBetweenEqual,
    CheckBetween,
    CheckGreaterThan,
    CheckGreaterEqualThan,
    CheckLessEqualThan,
    CheckLength {}
export interface ColumnInt
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLength,
    CheckLessEqualThan,
    CheckLessThan,
    Unsigned {}
export interface ColumnDecimal
  extends Null,
    Default,
    Unique,
    CheckBetween,
    CheckBetweenEqual,
    CheckGreaterEqualThan,
    CheckGreaterThan,
    CheckLength,
    CheckLessEqualThan,
    CheckLessThan,
    Unsigned {}

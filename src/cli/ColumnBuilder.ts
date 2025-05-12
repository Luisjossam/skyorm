import BuilderSQL from "./BuilderSQL";

type TDriver = "mysql" | "sqlite" | "postgres";

class ColumnBuilder {
  constructor(
    private readonly column_base: string,
    private readonly tableName: string,
    private readonly driver: TDriver,
    private readonly BuilderSQL: BuilderSQL,
  ) {}
  primaryKey() {
    this.BuilderSQL.setValue(this.column_base, "primary_key");
    return this;
  }
  null() {
    this.BuilderSQL.setValue(this.column_base, "null");
    return this;
  }
  default(value: string | number | boolean | Date): this {
    let val: string = "";
    if (typeof value === "string")
      if (value.trim() === "CURRENT_TIMESTAMP") {
        val = "CURRENT_TIMESTAMP ";
      } else if (value.trim() === "CURRENT_DATE") {
        val = "CURRENT_DATE";
      } else {
        val = `'${value.trim()}'`;
      }
    if (typeof value === "number") val = value.toString();
    if (typeof value === "boolean") val = value ? "TRUE" : "FALSE";
    this.BuilderSQL.setValue(this.column_base, "default", val);
    return this;
  }
  unique(): this {
    this.BuilderSQL.setValue(this.column_base, "unique");
    return this;
  }
  checkLikeBetween(value: string): this {
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${this.column_base.split(" ")[0]} LIKE '%${value}%')`);
    return this;
  }

  checkLikeStart(value: string): this {
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${this.column_base.split(" ")[0]} LIKE '${value}%')`);
    return this;
  }
  checkLikeEnd(value: string): this {
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${this.column_base.split(" ")[0]} LIKE '%${value}')`);
    return this;
  }
  checkLike(value: string): this {
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${this.column_base.split(" ")[0]} LIKE '${value}')`);
    return this;
  }
  checkBetweenEqual(value_1: number | string, value_2: number | string): this {
    const column_split = this.column_base.split(" ");
    if (!value_1 || !value_2) {
      throw new Error(`One or both values are required in the check_between_equal method: COLUMN: ${column_split[0]}`);
    }
    if (column_split[1] === "INT" && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
        throw new Error(`Value 1 is not a valid integer: check_between_equal("${value_1}", ...)`);
    }
    if (column_split[1] === "INT" && typeof value_2 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_2.trim()) || !Number.isInteger(parseFloat(value_2)))
        throw new Error(`Value 2 is not a valid integer: check_between_equal(..., "${value_2}")`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid number: check_between_equal("${value_1}", ...)`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_2 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid number: check_between_equal(..., "${value_2}")`);
    }
    this.BuilderSQL.setValue(
      this.column_base,
      "check_like",
      `CHECK (${column_split[0]} >= ${value_1} AND ${this.column_base.split(" ")[0]} <= ${value_2})`,
    );
    return this;
  }
  checkBetween(value_1: number | string, value_2: number | string): this {
    const column_split = this.column_base.split(" ");
    if (!value_1 || !value_2) {
      throw new Error(`One or both values are required in the check_between method: COLUMN: ${column_split[0]}`);
    }
    if (column_split[1] === "INT" && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
        throw new Error(`Value 1 is not a valid integer: check_between("${value_1}", ...)`);
    }
    if (column_split[1] === "INT" && typeof value_2 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_2.trim()) || !Number.isInteger(parseFloat(value_2)))
        throw new Error(`Value 2 is not a valid integer: check_between(..., "${value_2}")`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid number: check_between("${value_1}", ...)`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_2 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid number: check_between(..., "${value_2}")`);
    }
    if (column_split[1] === "DATE" && typeof value_1 === "string") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid date: check_between("${value_1}", ...)`);
    }
    if (column_split[1] === "DATE" && typeof value_2 === "string") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid date: check_between(..., "${value_2}")`);
    }
    const result_value_1 = column_split[1] === "DATE" ? `'${value_1}'` : value_1;
    const result_value_2 = column_split[1] === "DATE" ? `'${value_2}'` : value_2;
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${column_split[0]} BETWEEN ${result_value_1} AND ${result_value_2})`);
    return this;
  }
  checkGreaterThan(value_1: number | string): this {
    const column_split = this.column_base.split(" ");
    if (!value_1) {
      throw new Error(`Value are required in the check_greater_than method: COLUMN: ${column_split[0]}`);
    }
    if (column_split[1] === "INT" && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
        throw new Error(`Value is not a valid integer: check_greater_than("${value_1}")`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_greater_than("${value_1}")`);
    }
    if (column_split[1] === "DATE" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_greater_than("${value_1}")`);
    }
    const result_value_1 = column_split[1] === "DATE" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${column_split[0]} > ${result_value_1})`);
    return this;
  }
  checkGreaterEqualThan(value_1: number | string): this {
    const column_split = this.column_base.split(" ");
    if (!value_1) {
      throw new Error(`Value are required in the check_greater_equal_than method: COLUMN: ${column_split[0]}`);
    }
    if (column_split[1] === "INT" && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
        throw new Error(`Value is not a valid integer: check_greater_equal_than("${value_1}")`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_greater_equal_than("${value_1}")`);
    }
    if (column_split[1] === "DATE" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_greater_than("${value_1}")`);
    }
    const result_value_1 = column_split[1] === "DATE" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${column_split[0]} >= ${result_value_1})`);
    return this;
  }
  checkLessThan(value_1: number | string): this {
    const column_split = this.column_base.split(" ");
    if (!value_1) {
      throw new Error(`Value are required in the check_less_than method: COLUMN:  ${column_split[0]}`);
    }
    if (column_split[1] === "INT" && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
        throw new Error(`Value is not a valid integer: check_less_than("${value_1}")`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_less_than("${value_1}")`);
    }
    if (column_split[1] === "DATE" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_greater_than("${value_1}")`);
    }
    const result_value_1 = column_split[1] === "DATE" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${column_split[0]} < ${result_value_1})`);
    return this;
  }
  checkLessEqualThan(value_1: number | string): this {
    const column_split = this.column_base.split(" ");
    if (!value_1) {
      throw new Error(`Value are required in the check_less_equal_than method: COLUMN: ${column_split[0]}`);
    }
    if (column_split[1] === "INT" && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim()) || !Number.isInteger(parseFloat(value_1)))
        throw new Error(`Value is not a valid integer: check_less_equal_than("${value_1}")`);
    }
    if (column_split[1].includes("DECIMAL") && typeof value_1 === "string") {
      if (!/^-?\d+(\.\d+)?$/.test(value_1.trim())) throw new Error(`Value is not a valid number: check_less_equal_than("${value_1}")`);
    }
    if (column_split[1] === "DATE" && typeof value_1 === "string" && value_1 !== "CURRENT_DATE") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value is not a valid date: check_less_greater_than("${value_1}")`);
    }
    const result_value_1 = column_split[1] === "DATE" && value_1 !== "CURRENT_DATE" ? `'${value_1}'` : value_1;
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${column_split[0]} <= ${result_value_1})`);

    return this;
  }
  checkLength(value: number): this {
    const column_split = this.column_base.split(" ");
    if (!value) {
      throw new Error(`Value are required in the check_length method: COLUMN: ${column_split[0]}`);
    }
    if (typeof value === "string") {
      if (isNaN(value) || !Number.isInteger(parseFloat(value))) throw new Error(`Value is not a valid integer: ${value}`);
    }
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (length(${column_split[0]}) > ${value})`);
    return this;
  }
  checkCompare(value_1: number | string, value_2: number | string): this {
    const column_split = this.column_base.split(" ");
    if (!value_1 || !value_2) {
      throw new Error(`One or both values are required in the check_compare method: COLUMN: ${column_split[0]}`);
    }
    if (column_split[1] === "DATE" && typeof value_1 === "string") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_1.trim())) throw new Error(`Value 1 is not a valid date: check_compare("${value_1}", ...)`);
    }
    if (column_split[1] === "DATE" && typeof value_2 === "string") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value_2.trim())) throw new Error(`Value 2 is not a valid date: check_compare(..., "${value_2}")`);
    }
    const result_value_1 = column_split[1] === "DATE" ? `'${value_1}'` : value_1;
    const result_value_2 = column_split[1] === "DATE" ? `'${value_2}'` : value_2;
    this.BuilderSQL.setValue(this.column_base, "check_like", `CHECK (${result_value_1} <= ${result_value_2})`);
    return this;
  }
  unsigned() {
    this.BuilderSQL.setValue(this.column_base, "unsigned");
    return this;
  }
  //zerofill() {}
  generate_sql() {}
}
export default ColumnBuilder;

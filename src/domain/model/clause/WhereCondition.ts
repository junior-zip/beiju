import { ColumnRef } from "../ColumnRef.js";
import { WhereOpType } from "../../types/WhereOpType.js";

export class WhereCondition {
  constructor(
    readonly column: ColumnRef,
    readonly op: WhereOpType,
    readonly value: unknown,
  ) {}
}
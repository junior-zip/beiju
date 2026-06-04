import { IBuilder } from "./IBuilder.js"
import { WindowSpec } from "../../model/WindowSpec.js" 
import { FrameBoundary } from "../../model/FrameSpec.js"

export interface IWindowBuilder extends IBuilder<WindowSpec> {
  partitionBy(...columns: string[]): this
  orderBy(column: string, direction?: 'ASC' | 'DESC'): this
  rowsBetween(start: FrameBoundary, end: FrameBoundary): this
  rangeBetween(start: FrameBoundary, end: FrameBoundary): this
}
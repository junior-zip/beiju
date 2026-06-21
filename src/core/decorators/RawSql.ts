import type { IQueryExecutor } from '../interfaces/IQueryExecutor.js'

export function RawSql(sql: string) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {

    if (!sql || sql.trim().length === 0) {
      throw new Error(
        `@RawSql em "${String(propertyKey)}": a query SQL não pode ser vazia.`
      )
    }

    descriptor.value = async function (this: any, ...args: unknown[]) {

      const executor: IQueryExecutor | undefined =
        this.executor ?? this.adapter ?? this._executor

      if (!executor) {
        throw new Error(
          `@RawSql em "${String(propertyKey)}": nenhum IQueryExecutor encontrado na instância. ` +
          `A classe deve expor uma propriedade "executor" do tipo IQueryExecutor.\n` +
          `Exemplo: constructor(readonly executor: IQueryExecutor) {}`
        )
      }

      if (typeof executor.executeRaw !== 'function') {
        throw new Error(
          `@RawSql em "${String(propertyKey)}": o executor encontrado não implementa executeRaw(). ` +
          `Verifique se o adapter utilizado implementa IQueryExecutor corretamente.`
        )
      }
      
      const params = args.map(arg => arg === undefined ? null : arg)

      const result = await executor.executeRaw(sql, params)
      return result.rows
    }

    return descriptor
  }
}
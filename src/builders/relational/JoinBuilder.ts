import { JoinCondition, JoinSpec, JoinType } from '../../core/ast/JoinSpec.js'
import type { TypedColumn }    from '../../semantic/TypedColumn.js'
import type { Table }          from '../../semantic/Table.js'

/**
 * Builder intermediário para cláusulas JOIN.
 * Criado por SemanticSelectBuilder.innerJoin() / leftJoin() / rightJoin().
 *
 * O callback onComplete devolve o controle ao SemanticSelectBuilder
 * assim que .on() é chamado — permitindo o encadeamento continuar.
 *
 * Exemplo:
 *   .innerJoin(tableUsuarios).on(vendas.usuario_id, tableUsuarios.id)
 *   .leftJoin(tableProdutos).on(vendas.produto_id, tableProdutos.id)
 */
export class JoinBuilder<TBuilder> {
  private conditions: JoinCondition[] = [];
  private aliasValue?: string;

  constructor(
    private readonly joinTable: Table,
    private readonly onComplete: (spec: JoinSpec) => TBuilder,
    private readonly joinType?: JoinType,
  ) {}

  as(alias: string): this {
    this.aliasValue = alias;
    return this;
  }

  on(left: TypedColumn, right: TypedColumn): TBuilder {
    this.conditions.push(new JoinCondition(left.ref, right.ref));

    return this.onComplete(
      new JoinSpec(
        this.joinTable.tableName,
        this.conditions,
        this.joinType,
        this.aliasValue,
      ),
    );
  }

  // ─── Alias em português ──────────────────────────────────────────────────

  como(alias: string): this {
    return this.as(alias);
  }

  em(left: TypedColumn, right: TypedColumn): TBuilder {
    return this.on(left, right);
  }
}
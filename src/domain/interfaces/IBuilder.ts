/**
 * Contrato base para todos os builders do Beiju.
 * @template T
 */
export interface IBuilder<T> {
  build(): T
}
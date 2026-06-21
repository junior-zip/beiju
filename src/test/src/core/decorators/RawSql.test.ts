import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RawSql } from '@core/decorators/RawSql.js'
import type { IQueryExecutor, IQueryResult } from '@core/interfaces/IQueryExecutor.js'
import { IRawQueryCheck } from '@core/interfaces/IRawQueryCheck.js'

const mockExecuteRaw = vi.fn()
const mockExecutor: IQueryExecutor = {
  execute:    vi.fn(),
  executeRaw: mockExecuteRaw,
  close:      vi.fn(),
}

// Exemplo de classe usando o @RawSql
class UserRepository implements IRawQueryCheck{
  constructor(readonly executor: IQueryExecutor) {}

  @RawSql('SELECT * FROM users')
  async getAll(): Promise<any[]> { return [] }

  @RawSql('SELECT * FROM users WHERE salary > $1')
  async getBySalary(salary: number): Promise<any[]> { return [] }

  @RawSql('SELECT * FROM users WHERE salary > $1 AND active = $2')
  async getBySalaryAndStatus(salary: number, active: boolean): Promise<any[]> { return [] }

  @RawSql('SELECT * FROM users WHERE region = $1 AND active = $2')
  async getByRegionAndAtive(region: string, active: boolean): Promise<any[]> { 
    return [] 
}


}

describe('@RawSql decorator', () => {
  let repo: UserRepository

  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteRaw.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 })
    repo = new UserRepository(mockExecutor)
  })

  it('chama executeRaw com o SQL correto sem params', async () => {
    await repo.getAll()

    expect(mockExecuteRaw).toHaveBeenCalledWith(
      'SELECT * FROM users',
      []
    )
  })

  it('passa os argumentos do método como params posicionais', async () => {
    await repo.getBySalary(1000)

    expect(mockExecuteRaw).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE salary > $1',
      [1000]
    )
  })

  it('passa múltiplos argumentos como params na ordem correta', async () => {
    await repo.getBySalaryAndStatus(1000, true)

    expect(mockExecuteRaw).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE salary > $1 AND active = $2',
      [1000, true]
    )
  })

  it('retorna as rows do resultado', async () => {
    mockExecuteRaw.mockResolvedValue({
      rows: [{ id: 1, name: 'Junior' }],
      rowCount: 1,
    })

    const result = await repo.getAll()

    expect(result).toEqual([{ id: 1, name: 'Junior' }])
  })

  it('lança erro se a classe não tiver executor', async () => {
    class SemExecutor {
      @RawSql('SELECT 1')
      async query(): Promise<any[]> { return [] }
    }

    const sem = new SemExecutor()
    await expect(sem.query()).rejects.toThrow(
      'nenhum IQueryExecutor encontrado'
    )
  })

  it('lança erro se o SQL for vazio', () => {
    expect(() => {
      class Invalida {
        constructor(readonly executor: IQueryExecutor) {}
        @RawSql('')
        async query(): Promise<any[]> { return [] }
      }
    }).toThrow('a query SQL não pode ser vazia')
  })

  it('não chama execute — apenas executeRaw', async () => {
    await repo.getAll()

    expect(mockExecutor.execute).not.toHaveBeenCalled()
    expect(mockExecuteRaw).toHaveBeenCalledOnce()
  })

  it('preserva a posição dos parâmetros mesmo com undefined no meio', async () => {
  await repo.getByRegionAndAtive(undefined, true)

  expect(mockExecuteRaw).toHaveBeenCalledWith(
    'SELECT * FROM users WHERE region = $1 AND active = $2',
    [null, true]
  )
 })

})
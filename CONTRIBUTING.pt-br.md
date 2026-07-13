# Contribuindo com o Beiju
 
Antes de tudo, obrigado pelo interesse em contribuir! O Beiju é um query builder analítico open source para Node.js, e toda contribuição — por menor que seja — ajuda o projeto a ir mais longe.
 
---
 
## Índice
 
- [Primeiros Passos](#primeiros-passos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Contribuir](#como-contribuir)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Convenção de Commits](#convenção-de-commits)
- [Abrindo um Pull Request](#abrindo-um-pull-request)
- [Boas Primeiras Issues](#boas-primeiras-issues)
---
 
## Primeiros Passos
 
### Pré-requisitos
 
- Node.js >= 20
- npm >= 10
- Docker (necessário para testes de integração via Testcontainers)
### Configuração
 
```bash
# Clone o repositório
git clone https://github.com/beiju-dev/beiju.git
cd beiju
 
# Instale as dependências
npm install
 
# Execute os testes
npm test
```
 
---
 
## Estrutura do Projeto
 
```
beiju/
├── src/
│   ├── domain/         # Classes de domínio (ColumnRef, WindowSpec, SelectQuery...)
│   ├── application/    # Ports e casos de uso
│   └── infrastructure/ # Adapters (PgAdapter, SqlGenerator...)
├── tests/
│   ├── unit/           # Testes unitários (Vitest)
│   └── integration/    # Testes de integração (Testcontainers + PostgreSQL)
└── docs/               # Documentação adicional
```
 
O projeto segue uma **arquitetura hexagonal** com princípios de Domain-Driven Design. Se você não conhece esses conceitos, fique à vontade para abrir uma discussão — estamos felizes em ajudar.
 
---
 
## Como Contribuir
 
Existem várias formas de contribuir:
 
- 🐛 **Reportar bugs** — abra uma issue descrevendo o problema, os passos para reproduzi-lo e o comportamento esperado
- 💡 **Sugerir funcionalidades** — abra uma issue com a label `enhancement` e descreva seu caso de uso
- 📖 **Melhorar a documentação** — corrija erros, adicione exemplos, traduza conteúdo
- 🔧 **Enviar código** — escolha uma issue e abra um pull request
Se não souber por onde começar, procure issues com a label [`good first issue`](../../issues?q=label%3A%22good+first+issue%22).
 
---
 
## Fluxo de Desenvolvimento
 
```bash
# Executar testes unitários
npm test
 
# Executar testes em modo watch
npm run test:watch
 
# Executar testes com cobertura
npm run test:coverage
 
# Build do projeto
npm run build
```
 
Certifique-se de que todos os testes passam antes de abrir um pull request.
 
---
 
## Convenção de Commits
 
Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
 
```
<tipo>: <descrição curta>
 
Tipos:
  feat      → nova funcionalidade
  fix       → correção de bug
  docs      → alterações na documentação
  test      → adição ou atualização de testes
  refactor  → mudança de código que não corrige bug nem adiciona funcionalidade
  chore     → processo de build, dependências, configuração
```
 
Exemplos:
```
feat: adicionar suporte a frame ROWS no WindowSpec
fix: corrigir cálculo de frame bounds para modo RANGE
docs: adicionar exemplo de uso para cláusula partition by
test: adicionar teste de integração para soma cumulativa
```
 
---
 
## Abrindo um Pull Request
 
1. Faça um fork do repositório e crie uma branch a partir de `main`
2. Nomeie sua branch de forma descritiva: `feat/window-frame-rows` ou `fix/frame-bounds`
3. Faça suas alterações e escreva ou atualize os testes
4. Execute `npm test` e confirme que tudo passa
5. Abra um pull request com uma descrição clara do que você mudou e por quê
Para mudanças maiores, considere abrir uma issue primeiro para discutir a abordagem antes de investir tempo na implementação.
 
---
 
## Boas Primeiras Issues
 
Não sabe por onde começar? Aqui estão algumas áreas onde contribuições são sempre bem-vindas:
 
- Adicionar mais exemplos de uso no README
- Escrever testes unitários faltando
- Melhorar tipos TypeScript e comentários JSDoc
- Traduzir documentação
Procure a label [`good first issue`](../../issues?q=label%3A%22good+first+issue%22) na página de issues.
 
---
 
## Dúvidas?
 
Abra uma [discussão](../../discussions) ou entre em contato pela página de issues. Somos uma galera tranquila. 👋

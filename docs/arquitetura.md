# Arquitetura - SIGME MVP

## Visão Geral do Sistema
O Sistema Integrado de Gestão e Maturidade Empresarial (SIGME) é estruturado de forma modular e relacional. Seu MVP foca em cadastrar setores corporativos e executar diagnósticos de maturidade baseados em questionários flexíveis, avaliando processos e a gestão sob múltiplas perspectivas (dimensões).

O armazenamento de dados é feito em um banco de dados PostgreSQL (gerenciado via Supabase), garantindo consistência, integridade através de restrições relacionais e segurança a nível de linha (RLS).

---

## Banco de Dados e Relacionamentos

A arquitetura do MVP gira em torno de 4 tabelas principais:

1. **`setores`**: Armazena as áreas da empresa. Cada setor possui um `tipo` (nativo, genérico ou customizado) que define como ele se comportará no sistema.
2. **`templates_diagnostico`**: Armazena o banco de perguntas que serão feitas no diagnóstico. Elas são agrupadas por tipo de setor e por dimensão de avaliação (processos, dados, tecnologia, pessoas, gestao).
3. **`diagnosticos`**: Representa um ciclo de avaliação (ex: "2025-Q1") iniciado por um setor. Possui os dados consolidados como pontuação total e o nível final de maturidade. Relaciona-se com `setores` (N:1).
4. **`respostas_diagnostico`**: Armazena cada resposta individual (escala 1 a 5) de um diagnóstico em andamento. Relaciona-se com `diagnosticos` (N:1) e com `templates_diagnostico` (N:1) para saber qual pergunta está sendo respondida.

**Resumo de Relacionamentos:**
- Um **Setor** pode ter vários **Diagnósticos**.
- Um **Diagnóstico** possui várias **Respostas**.
- Uma **Resposta** referencia um **Template de Diagnóstico** (pergunta).

---

## Lógica de Cálculo da Maturidade

O cálculo final de maturidade do setor é baseado em uma **Média Ponderada** das dimensões avaliadas.

1. **Captura:** O usuário responde as perguntas (1 a 5).
2. **Média por Dimensão:** Calcula-se a média simples das respostas dentro de uma mesma dimensão.
3. **Ponderação:** Multiplica-se a média da dimensão pelo peso da dimensão configurado no schema JSON (Processos: 25%, Dados: 20%, Tecnologia: 25%, Pessoas: 15%, Gestão: 15%).
4. **Soma Final:** Soma-se o resultado das 5 dimensões, gerando uma nota decimal entre 1.0 e 5.0 (`pontuacao_total`).
5. **Nível de Maturidade:** A nota decimal é convertida para um valor inteiro (1 a 5) correspondente ao nível de maturidade atingido (ex: por arredondamento comum ou faixas métricas).

---

## Lógica de Fallback de Templates

Para garantir que sempre haverá perguntas para qualquer área, o sistema usa uma lógica de **fallback** (herança/recurso alternativo) na busca de templates:

1. **Nativo:** Quando um novo diagnóstico é iniciado, o sistema busca primeiro pelas perguntas de template específicas para aquele setor exato.
2. **Customizado:** Se o setor for do tipo `customizado` e estiver atrelado a um `template_base`, o sistema utiliza as perguntas do template referenciado.
3. **Genérico (Fallback Final):** Se o setor não possuir perguntas específicas ou for do tipo `generico`, o sistema adota automaticamente as 10 perguntas globais do template genérico. Isso garante que a jornada do usuário nunca trave por falta de perguntas.

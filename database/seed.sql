-- Tarefa 3 - Criação do Seed no Supabase

-- Inserir 8 setores nativos e 1 genérico
INSERT INTO setores (nome, tipo, status, descricao) VALUES 
('Produção', 'nativo', 'ativo', 'Setor responsável pela fabricação e controle de produção.'),
('Tecnologia da Informação', 'nativo', 'ativo', 'Setor responsável por infraestrutura e sistemas.'),
('Recursos Humanos', 'nativo', 'ativo', 'Setor focado na gestão de pessoas, recrutamento e retenção.'),
('Financeiro', 'nativo', 'ativo', 'Setor encarregado do planejamento e controle financeiro.'),
('Comercial', 'nativo', 'ativo', 'Setor focado em vendas e relacionamento com clientes.'),
('Logística', 'nativo', 'ativo', 'Setor responsável por estoque, armazenagem e distribuição.'),
('Marketing', 'nativo', 'ativo', 'Setor focado em estratégias de mercado, marca e publicidade.'),
('Qualidade', 'nativo', 'ativo', 'Setor que garante os padrões e certificações dos processos e produtos.'),
('Setor Personalizado', 'generico', 'ativo', 'Template genérico aplicável a áreas não listadas nativamente.');

-- Inserir perguntas para o template genérico (5 dimensões x 2 perguntas)
INSERT INTO templates_diagnostico (setor_tipo, dimensao, pergunta, ordem) VALUES
('generico', 'processos', 'Os processos da área estão mapeados e formalmente documentados?', 1),
('generico', 'processos', 'Existe acompanhamento contínuo dos gargalos e melhorias nos fluxos de trabalho?', 2),
('generico', 'dados', 'A tomada de decisão do setor é baseada em dados concretos e indicadores atualizados?', 3),
('generico', 'dados', 'Os dados utilizados são confiáveis e estão centralizados para fácil acesso?', 4),
('generico', 'tecnologia', 'As ferramentas tecnológicas utilizadas atendem adequadamente às necessidades do setor?', 5),
('generico', 'tecnologia', 'O setor possui automações para reduzir trabalhos manuais e repetitivos?', 6),
('generico', 'pessoas', 'A equipe possui capacitação contínua e clareza sobre suas funções?', 7),
('generico', 'pessoas', 'O engajamento e a produtividade da equipe são avaliados periodicamente?', 8),
('generico', 'gestao', 'O setor possui metas claras alinhadas ao planejamento estratégico da empresa?', 9),
('generico', 'gestao', 'As lideranças promovem reuniões regulares para acompanhamento de resultados?', 10);

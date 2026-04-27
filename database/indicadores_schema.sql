-- Tabela de Indicadores (KPIs) independentes do diagnóstico de maturidade
CREATE TABLE indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id UUID REFERENCES setores(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    unidade VARCHAR(20), -- ex: %, R$, kg, qtd
    meta NUMERIC(12,2),
    valor_atual NUMERIC(12,2) DEFAULT 0,
    periodicidade VARCHAR(20) DEFAULT 'mensal' CHECK (periodicidade IN ('diario', 'semanal', 'mensal', 'trimestral', 'anual')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
    criado_em TIMESTAMP DEFAULT now(),
    atualizado_em TIMESTAMP DEFAULT now()
);

-- Tabela para histórico de valores dos indicadores
CREATE TABLE historico_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicador_id UUID REFERENCES indicadores(id) ON DELETE CASCADE,
    valor NUMERIC(12,2) NOT NULL,
    data_referencia DATE DEFAULT CURRENT_DATE,
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_indicadores ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Simplificadas para o MVP)
CREATE POLICY "indicadores_select_policy" ON indicadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "indicadores_insert_policy" ON indicadores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "indicadores_update_policy" ON indicadores FOR UPDATE TO authenticated USING (true);

CREATE POLICY "historico_indicadores_select_policy" ON historico_indicadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "historico_indicadores_insert_policy" ON historico_indicadores FOR INSERT TO authenticated WITH CHECK (true);

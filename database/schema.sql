-- Tarefa 2 - Criação do Schema no Supabase

-- Tabela setores
CREATE TABLE setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) CHECK (tipo IN ('nativo', 'generico', 'customizado')),
    template_base VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
    criado_em TIMESTAMP DEFAULT now(),
    atualizado_em TIMESTAMP DEFAULT now()
);

-- Tabela templates_diagnostico
CREATE TABLE templates_diagnostico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_tipo VARCHAR(100),
    dimensao VARCHAR(50),
    pergunta TEXT NOT NULL,
    ordem INTEGER,
    ativo BOOLEAN DEFAULT true
);

-- Tabela diagnosticos
CREATE TABLE diagnosticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id UUID REFERENCES setores(id),
    ciclo VARCHAR(20),
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido')),
    pontuacao_total NUMERIC(5,2),
    nivel_maturidade INTEGER CHECK (nivel_maturidade BETWEEN 1 AND 5),
    criado_em TIMESTAMP DEFAULT now(),
    concluido_em TIMESTAMP
);

-- Tabela respostas_diagnostico
CREATE TABLE respostas_diagnostico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostico_id UUID REFERENCES diagnosticos(id),
    template_id UUID REFERENCES templates_diagnostico(id),
    resposta INTEGER CHECK (resposta BETWEEN 1 AND 5),
    observacao TEXT,
    respondido_em TIMESTAMP DEFAULT now()
);

-- Índices
CREATE INDEX idx_setores_status ON setores(status);
CREATE INDEX idx_diagnosticos_setor_id ON diagnosticos(setor_id);
CREATE INDEX idx_respostas_diagnostico_id ON respostas_diagnostico(diagnostico_id);

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_diagnostico ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_diagnostico ENABLE ROW LEVEL SECURITY;

-- Tabela de Usuários (Profile) vinculada ao Supabase Auth
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(100),
    criado_em TIMESTAMP DEFAULT now(),
    atualizado_em TIMESTAMP DEFAULT now()
);

-- Habilitar RLS para usuários
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para usuários
CREATE POLICY "Usuários podem ver o próprio perfil" ON usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio perfil" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar o perfil do usuário automaticamente após o Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

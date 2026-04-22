import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function NovoSetor() {
  const navigate = useNavigate();
  // Mock Admin (redirects if not admin in a real scenario)
  const isAdmin = true;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('nativo');
  const [templateBase, setTemplateBase] = useState('');
  const [ativo, setAtivo] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [nativos, setNativos] = useState<{ id: string, nome: string }[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/setores');
      return;
    }

    async function fetchNativos() {
      const { data } = await supabase
        .from('setores')
        .select('id, nome')
        .eq('tipo', 'nativo');
      if (data) setNativos(data);
    }
    fetchNativos();
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('O nome do setor é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      // 1. Validar unicidade
      const { data: existing } = await supabase
        .from('setores')
        .select('id')
        .ilike('nome', nome.trim());
        
      if (existing && existing.length > 0) {
        toast.error('Já existe um setor com este nome.');
        setLoading(false);
        return;
      }

      // 2. Inserir no Supabase
      const { data, error } = await supabase
        .from('setores')
        .insert({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tipo: tipo,
          template_base: tipo === 'customizado' && templateBase ? templateBase : null,
          status: ativo ? 'ativo' : 'arquivado'
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Setor criado com sucesso!');
      navigate(`/setores/${data.id}`);
      
    } catch (error: any) {
      toast.error('Erro ao salvar o setor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/setores')} className="btn-icon" style={{ padding: '0.5rem', background: 'var(--glass)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold mb-1">Novo Setor</h1>
            <p className="text-muted">Cadastre uma nova área na organização.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Usamos max-width em telas grandes para simular as "duas colunas" ou limitar a largura */}
        <div className="glass-panel" style={{ maxWidth: '800px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Nome e Descrição */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="font-bold text-sm">Nome do Setor <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <Building2 className="input-icon" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ex: Recursos Humanos" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value.slice(0, 100))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{nome.length}/100</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="font-bold text-sm">Tipo de Setor</label>
                <select 
                  className="select-input" 
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  style={{ width: '100%', paddingLeft: '1rem' }}
                >
                  <option value="nativo">Nativo</option>
                  <option value="customizado">Customizado</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="font-bold text-sm">Descrição (Opcional)</label>
              <textarea 
                placeholder="Breve descrição sobre as responsabilidades do setor..." 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value.slice(0, 300))}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.7)', 
                  border: '1px solid rgba(255,255,255,0.9)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  color: 'var(--text-main)',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{descricao.length}/300</span>
              </div>
            </div>

            {/* Template Base condicional */}
            {tipo === 'customizado' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                <label className="font-bold text-sm">Template Base (Opcional)</label>
                <p className="text-muted text-sm mb-1">Escolha um setor nativo para herdar o modelo de diagnóstico. Deixe em branco para criar um questionário do zero futuramente.</p>
                <select 
                  className="select-input" 
                  value={templateBase}
                  onChange={(e) => setTemplateBase(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Selecione um setor base...</option>
                  {nativos.map(n => (
                    <option key={n.id} value={n.id}>{n.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Toggle Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '8px' }}>
              <button 
                type="button" 
                onClick={() => setAtivo(!ativo)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: ativo ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none', position: 'relative', cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{
                  width: '18px', height: '18px', background: 'white', borderRadius: '50%',
                  position: 'absolute', top: '3px', left: ativo ? '23px' : '3px',
                  transition: 'left 0.3s'
                }} />
              </button>
              <div>
                <p className="font-bold text-sm">Ativar setor imediatamente</p>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Setores inativos não podem realizar novos diagnósticos.</p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '1rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="text-sm text-muted">Preview na tabela:</span>
                <span className={`badge badge-tipo-${tipo}`}>{tipo}</span>
                <span className="font-bold" style={{ color: 'var(--text-main)' }}>{nome || 'Nome do Setor'}</span>
              </div>

              <button type="submit" disabled={loading} className="btn-primary flex-center gap-2">
                {loading ? 'Salvando...' : <><Save size={18} /> Salvar Setor</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

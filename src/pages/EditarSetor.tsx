import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

type Setor = {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  status: string;
};

type Pergunta = {
  id: string;
  dimensao: string;
  pergunta: string;
  ordem: number;
  ativo: boolean;
};

const DIMENSOES = ['processos', 'dados', 'tecnologia', 'pessoas', 'gestao'];

export default function EditarSetor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();

  const location = useLocation();
  const [setor, setSetor] = useState<Setor | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'dados'); // dados, questionario

  // Form Dados Gerais
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('ativo');

  // Form Pergunta Modal
  const [showPerguntaModal, setShowPerguntaModal] = useState(false);
  const [editPerguntaId, setEditPerguntaId] = useState<string | null>(null);
  const [formPerguntaText, setFormPerguntaText] = useState('');
  const [formDimensao, setFormDimensao] = useState('processos');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    async function fetchData() {
      if (!id) return;
      
      const { data: sData } = await supabase.from('setores').select('*').eq('id', id).single();
      if (!sData) {
        setLoading(false);
        return;
      }

      // Bloqueio de Segurança: Admin Padrão não edita Nativos
      if (sData.tipo === 'nativo' && !isSuperAdmin) {
        toast.error('Acesso negado: Somente o Administrador Geral pode editar setores Nativos.');
        navigate(`/setores/${id}`);
        return;
      }

      setSetor(sData);
      setNome(sData.nome);
      setDescricao(sData.descricao || '');
      setStatus(sData.status);

      // Buscar perguntas
      // MVP: Buscamos perguntas específicas deste setor_id
      const { data: pData } = await supabase
        .from('templates_diagnostico')
        .select('*')
        .eq('setor_id', id)
        .order('ordem', { ascending: true });
        
      if (pData) setPerguntas(pData);
      
      setLoading(false);
    }
    
    fetchData();
  }, [id, isAdmin, isSuperAdmin, navigate]);

  const handleSaveDadosGerais = async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('setores')
      .update({ nome, descricao, status, atualizado_em: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao salvar setor.');
    } else {
      toast.success('Dados gerais salvos com sucesso!');
      setSetor(prev => prev ? { ...prev, nome, descricao, status } : null);
    }
    setSaving(false);
  };

  const openNovaPergunta = () => {
    setEditPerguntaId(null);
    setFormPerguntaText('');
    setFormDimensao('processos');
    setShowPerguntaModal(true);
  };

  const openEditarPergunta = (p: Pergunta) => {
    setEditPerguntaId(p.id);
    setFormPerguntaText(p.pergunta);
    setFormDimensao(p.dimensao);
    setShowPerguntaModal(true);
  };

  const handleSavePergunta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPerguntaText.trim()) return;

    setSaving(true);

    if (editPerguntaId) {
      // Atualizar
      const { error } = await supabase
        .from('templates_diagnostico')
        .update({ pergunta: formPerguntaText, dimensao: formDimensao })
        .eq('id', editPerguntaId);

      if (!error) {
        toast.success('Pergunta atualizada.');
        setPerguntas(prev => prev.map(p => p.id === editPerguntaId ? { ...p, pergunta: formPerguntaText, dimensao: formDimensao } : p));
      } else toast.error('Erro ao atualizar pergunta.');
    } else {
      // Criar nova
      // Pega a ultima ordem
      const maxOrdem = perguntas.filter(p => p.dimensao === formDimensao).length;
      
      const { data, error } = await supabase
        .from('templates_diagnostico')
        .insert({
          setor_id: id,
          dimensao: formDimensao,
          pergunta: formPerguntaText,
          ordem: maxOrdem + 1,
          ativo: true
        })
        .select()
        .single();

      if (data && !error) {
        toast.success('Pergunta adicionada!');
        setPerguntas([...perguntas, data]);
      } else toast.error('Erro ao criar pergunta.');
    }

    setSaving(false);
    setShowPerguntaModal(false);
  };

  const handleToggleAtivo = async (p: Pergunta) => {
    const { error } = await supabase
      .from('templates_diagnostico')
      .update({ ativo: !p.ativo })
      .eq('id', p.id);

    if (!error) {
      toast.success(p.ativo ? 'Pergunta desativada.' : 'Pergunta ativada.');
      setPerguntas(prev => prev.map(x => x.id === p.id ? { ...x, ativo: !x.ativo } : x));
    }
  };

  if (loading) return <div className="p-8">Carregando editor...</div>;
  if (!setor) return <div className="p-8">Setor não encontrado.</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(`/setores/${id}`)} className="btn-icon" style={{ background: 'var(--glass)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Editar Setor</h1>
          <p className="text-muted">Gerencie os dados e o questionário deste setor.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          Dados Gerais
        </button>
        <button 
          className={`tab-btn ${activeTab === 'questionario' ? 'active' : ''}`}
          onClick={() => setActiveTab('questionario')}
        >
          Questionário ({perguntas.length})
        </button>
      </div>

      {activeTab === 'dados' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
            <div>
              <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Nome do Setor</label>
              <input type="text" className="select-input" style={{ width: '100%' }} value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            
            <div>
              <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Descrição</label>
              <textarea 
                className="select-input" 
                style={{ width: '100%', minHeight: '100px', resize: 'vertical' }} 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
              />
            </div>

            <div>
              <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Status</label>
              <select className="select-input" style={{ width: '100%' }} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn-primary flex-center gap-2" onClick={handleSaveDadosGerais} disabled={saving}>
                <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questionario' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <p className="text-muted text-sm">Adicione ou edite as perguntas que compõem o diagnóstico deste setor.</p>
            <button className="btn-primary flex-center gap-2" onClick={openNovaPergunta}>
              <Plus size={18} /> Adicionar Pergunta
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {DIMENSOES.map(dim => {
              const perguntasDim = perguntas.filter(p => p.dimensao === dim);
              
              return (
                <div key={dim} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 className="font-bold text-main mb-4" style={{ textTransform: 'capitalize', fontSize: '1.125rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                    {dim} <span className="badge" style={{ marginLeft: '1rem' }}>{perguntasDim.length}</span>
                  </h3>
                  
                  {perguntasDim.length === 0 ? (
                    <p className="text-muted text-sm italic">Nenhuma pergunta cadastrada nesta dimensão.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {perguntasDim.map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                          <div style={{ flex: 1, opacity: p.ativo ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span className="font-bold text-sm">Q{idx + 1}.</span>
                              {!p.ativo && <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem' }}>Inativa</span>}
                            </div>
                            <p>{p.pergunta}</p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-icon" onClick={() => openEditarPergunta(p)}>
                              <Edit2 size={18} />
                            </button>
                            <button className={`btn-icon ${p.ativo ? 'danger' : ''}`} onClick={() => handleToggleAtivo(p)} title={p.ativo ? 'Desativar' : 'Ativar'}>
                              {p.ativo ? <Trash2 size={18} /> : <CheckCircle2 size={18} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Pergunta */}
      {showPerguntaModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <h3 className="text-2xl font-bold mb-4">{editPerguntaId ? 'Editar Pergunta' : 'Nova Pergunta'}</h3>
            
            <form onSubmit={handleSavePergunta} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Dimensão</label>
                <select className="select-input" style={{ width: '100%' }} value={formDimensao} onChange={e => setFormDimensao(e.target.value)}>
                  {DIMENSOES.map(d => (
                    <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Enunciado da Pergunta</label>
                <textarea 
                  className="select-input" 
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }} 
                  value={formPerguntaText} 
                  onChange={e => setFormPerguntaText(e.target.value)} 
                  required
                />
              </div>

              <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowPerguntaModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tab-btn {
          background: transparent; border: none; padding: 0.75rem 1rem;
          color: var(--text-muted); font-weight: 600; font-size: 0.95rem; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all 0.2s;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
      `}</style>
    </div>
  );
}

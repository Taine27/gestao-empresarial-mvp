import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

type Pergunta = {
  id: string;
  dimensao: string;
  pergunta: string;
  ordem: number;
  ativo: boolean;
};

const DIMENSOES = ['processos', 'dados', 'tecnologia', 'pessoas', 'gestao'];

export default function EditarTemplatePadrao() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form Pergunta Modal
  const [showPerguntaModal, setShowPerguntaModal] = useState(false);
  const [editPerguntaId, setEditPerguntaId] = useState<string | null>(null);
  const [formPerguntaText, setFormPerguntaText] = useState('');
  const [formDimensao, setFormDimensao] = useState('processos');

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/dashboard');
      return;
    }

    async function fetchData() {
      // Buscar perguntas globais (setor_id is null)
      const { data, error } = await supabase
        .from('templates_diagnostico')
        .select('*')
        .is('setor_id', null)
        .order('ordem', { ascending: true });
        
      if (!error && data) {
        setPerguntas(data);
      }
      setLoading(false);
    }
    
    fetchData();
  }, [isSuperAdmin, navigate]);

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
      // Criar nova global
      const maxOrdem = perguntas.length > 0 ? Math.max(...perguntas.map(p => p.ordem)) : 0;
      
      const { data, error } = await supabase
        .from('templates_diagnostico')
        .insert({
          setor_id: null,
          setor_tipo: 'generico',
          dimensao: formDimensao,
          pergunta: formPerguntaText,
          ordem: maxOrdem + 1,
          ativo: true
        })
        .select()
        .single();

      if (data && !error) {
        toast.success('Pergunta global adicionada!');
        setPerguntas([...perguntas, data]);
      } else {
        toast.error('Erro ao criar pergunta global.');
        console.error(error);
      }
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

  if (loading) return <div className="p-8">Carregando formulário padrão...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/configuracao-diagnostico')} className="btn-icon" style={{ background: 'var(--glass)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Configurar Formulário Padrão</h1>
          <p className="text-muted">Gerencie as perguntas que aparecem em todos os setores.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="font-bold text-lg">Perguntas Globais</h2>
            <p className="text-muted text-sm">Estas perguntas compõem a base comum de todos os diagnósticos.</p>
          </div>
          <button className="btn-primary flex-center gap-2" onClick={openNovaPergunta}>
            <Plus size={18} /> Adicionar Pergunta Global
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {DIMENSOES.map(dim => {
            const perguntasDim = perguntas.filter(p => p.dimensao === dim);
            
            return (
              <div key={dim} style={{ marginBottom: '1rem' }}>
                <h3 className="font-bold text-main mb-4" style={{ textTransform: 'capitalize', fontSize: '1.125rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                  {dim} <span className="badge" style={{ marginLeft: '1rem' }}>{perguntasDim.length}</span>
                </h3>
                
                {perguntasDim.length === 0 ? (
                  <p className="text-muted text-sm italic">Nenhuma pergunta global nesta dimensão.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {perguntasDim.map((p, idx) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ flex: 1, opacity: p.ativo ? 1 : 0.5 }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span className="font-bold text-sm">G{idx + 1}.</span>
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

      {/* Modal Pergunta */}
      {showPerguntaModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <h3 className="text-2xl font-bold mb-4">{editPerguntaId ? 'Editar Pergunta Global' : 'Nova Pergunta Global'}</h3>
            
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
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function FormIndicador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [setores, setSetores] = useState<{id: string, nome: string}[]>([]);

  // Form Fields
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    setor_id: '',
    unidade: '%',
    meta: 0,
    valor_atual: 0,
    periodicidade: 'mensal',
    status: 'ativo'
  });

  useEffect(() => {
    async function init() {
      // 1. Buscar setores
      const { data: sData } = await supabase.from('setores').select('id, nome').order('nome');
      if (sData) setSetores(sData);

      // 2. Se for edição, buscar dados do indicador
      if (isEdit && id) {
        const { data, error } = await supabase.from('indicadores').select('*').eq('id', id).single();
        if (data && !error) {
          setFormData(data);
        } else {
          toast.error('Erro ao carregar indicador.');
          navigate('/indicadores');
        }
        setFetching(false);
      }
    }
    init();
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.setor_id) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    
    const payload = {
      ...formData,
      atualizado_em: new Date().toISOString()
    };

    let error;
    if (isEdit) {
      const { error: err } = await supabase.from('indicadores').update(payload).eq('id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('indicadores').insert(payload);
      error = err;
    }

    if (!error) {
      toast.success(isEdit ? 'Indicador atualizado!' : 'Indicador criado com sucesso!');
      navigate('/indicadores');
    } else {
      toast.error('Erro ao salvar indicador.');
      console.error(error);
    }
    setLoading(false);
  };

  if (fetching) return <div className="p-8">Carregando formulário...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/indicadores')} className="btn-icon" style={{ background: 'var(--glass)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-1">{isEdit ? 'Editar Indicador' : 'Novo Indicador'}</h1>
          <p className="text-muted">Configure as metas e métricas deste KPI.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label-form">Nome do Indicador *</label>
            <input 
              type="text" 
              className="select-input w-full" 
              placeholder="Ex: Taxa de Conversão de Vendas" 
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="label-form">Setor Responsável *</label>
            <select 
              className="select-input w-full"
              value={formData.setor_id}
              onChange={e => setFormData({...formData, setor_id: e.target.value})}
              required
            >
              <option value="">Selecione um setor...</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-form">Periodicidade</label>
            <select 
              className="select-input w-full"
              value={formData.periodicidade}
              onChange={e => setFormData({...formData, periodicidade: e.target.value})}
            >
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div>
            <label className="label-form">Unidade de Medida</label>
            <input 
              type="text" 
              className="select-input w-full" 
              placeholder="Ex: %, R$, kg, qtd" 
              value={formData.unidade}
              onChange={e => setFormData({...formData, unidade: e.target.value})}
            />
          </div>

          <div>
            <label className="label-form">Meta de Sucesso</label>
            <input 
              type="number" 
              step="0.01"
              className="select-input w-full" 
              value={formData.meta}
              onChange={e => setFormData({...formData, meta: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="label-form">Valor Atual</label>
            <input 
              type="number" 
              step="0.01"
              className="select-input w-full" 
              value={formData.valor_atual}
              onChange={e => setFormData({...formData, valor_atual: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="label-form">Status</label>
            <select 
              className="select-input w-full"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="ativo">Ativo</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label-form">Descrição / Observações</label>
            <textarea 
              className="select-input w-full" 
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder="Descreva o que este indicador mede e como é calculado..."
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
            />
          </div>
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" className="btn-outline" onClick={() => navigate('/indicadores')}>Cancelar</button>
          <button type="submit" className="btn-primary flex-center gap-2" disabled={loading}>
            <Save size={18} /> {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Indicador')}
          </button>
        </div>
      </form>

      <style>{`
        .label-form { display: block; font-size: 0.875rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main); }
        .w-full { width: 100%; }
      `}</style>
    </div>
  );
}

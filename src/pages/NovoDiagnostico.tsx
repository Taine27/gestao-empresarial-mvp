import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type Template = {
  id: string;
  dimensao: string;
  pergunta: string;
  ordem: number;
};

type Resposta = {
  template_id: string;
  resposta: number;
  observacao?: string;
};

const DIMENSOES = ['processos', 'dados', 'tecnologia', 'pessoas', 'gestao'];

export default function NovoDiagnostico() {
  const { setorId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [setorNome, setSetorNome] = useState('');
  const [diagnosticoId, setDiagnosticoId] = useState<string | null>(null);
  
  // Perguntas do banco
  const [perguntas, setPerguntas] = useState<Template[]>([]);
  // Respostas locais
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  
  // Estado de navegação
  const [dimensaoIndex, setDimensaoIndex] = useState(0);
  const [perguntaIndex, setPerguntaIndex] = useState(0);

  // Controle de salvamento automático
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      if (!setorId) return;

      // 1. Pegar nome do setor
      const { data: setor } = await supabase.from('setores').select('nome').eq('id', setorId).single();
      if (setor) setSetorNome(setor.nome);

      // 2. Verificar se já existe um em andamento
      const cicloAtual = '2025-Q1'; // Mock para o MVP
      const { data: existente } = await supabase
        .from('diagnosticos')
        .select('id')
        .eq('setor_id', setorId)
        .eq('status', 'em_andamento')
        .eq('ciclo', cicloAtual)
        .single();

      let currentDiagId = existente?.id;

      if (existente) {
        toast('Retomando diagnóstico em andamento...', { icon: '🔄' });
        setDiagnosticoId(currentDiagId);
        
        // Puxar as respostas já salvas
        const { data: savedAnswers } = await supabase
          .from('respostas_diagnostico')
          .select('*')
          .eq('diagnostico_id', currentDiagId);
          
        if (savedAnswers) {
          const dict: Record<string, Resposta> = {};
          savedAnswers.forEach(ans => {
            dict[ans.template_id] = {
              template_id: ans.template_id,
              resposta: ans.resposta,
              observacao: ans.observacao || ''
            };
          });
          setRespostas(dict);
        }

      } else {
        // Criar novo diagnóstico
        const { data: newDiag, error } = await supabase
          .from('diagnosticos')
          .insert({
            setor_id: setorId,
            status: 'em_andamento',
            ciclo: cicloAtual
          })
          .select('id')
          .single();
          
        if (newDiag) {
          currentDiagId = newDiag.id;
          setDiagnosticoId(currentDiagId);
          toast.success('Novo diagnóstico iniciado.');
        } else {
          toast.error('Erro ao iniciar diagnóstico.');
          console.error(error);
        }
      }

      // 3. Puxar templates_diagnostico (perguntas)
      // Buscamos as globais + as específicas deste setor
      const { data: globalTemplates } = await supabase
        .from('templates_diagnostico')
        .select('*')
        .eq('ativo', true)
        .is('setor_id', null)
        .order('ordem', { ascending: true });

      const { data: sectorTemplates } = await supabase
        .from('templates_diagnostico')
        .select('*')
        .eq('ativo', true)
        .eq('setor_id', setorId)
        .order('ordem', { ascending: true });

      const allTemplates = [...(globalTemplates || []), ...(sectorTemplates || [])];
      
      if (allTemplates.length > 0) {
        setPerguntas(allTemplates as Template[]);
      }

      setLoading(false);
    }
    
    init();
  }, [setorId]);

  // Pegar as perguntas da dimensão atual
  const perguntasDaDimensao = perguntas.filter(p => p.dimensao.toLowerCase() === DIMENSOES[dimensaoIndex]);
  const perguntaAtual = perguntasDaDimensao[perguntaIndex];

  // Quantidade total preenchida na dimensão atual
  const respondidasDaDimensao = perguntasDaDimensao.filter(p => respostas[p.id]).length;
  const dimensaoCompleta = perguntasDaDimensao.length > 0 && respondidasDaDimensao === perguntasDaDimensao.length;

  const handleAnswer = async (nota: number) => {
    if (!perguntaAtual || !diagnosticoId) return;

    setSaving(true);
    
    // Atualizar local
    const newAnswer: Resposta = {
      template_id: perguntaAtual.id,
      resposta: nota,
      observacao: respostas[perguntaAtual.id]?.observacao || ''
    };
    
    setRespostas(prev => ({ ...prev, [perguntaAtual.id]: newAnswer }));

    // Auto-save no Supabase
    // Verificar se já tem ID dessa resposta para dar update, senão insert
    const { data: existingAnswer } = await supabase
      .from('respostas_diagnostico')
      .select('id')
      .eq('diagnostico_id', diagnosticoId)
      .eq('template_id', perguntaAtual.id)
      .single();

    if (existingAnswer) {
      await supabase
        .from('respostas_diagnostico')
        .update({ resposta: nota, respondido_em: new Date().toISOString() })
        .eq('id', existingAnswer.id);
    } else {
      await supabase
        .from('respostas_diagnostico')
        .insert({
          diagnostico_id: diagnosticoId,
          template_id: perguntaAtual.id,
          resposta: nota
        });
    }

    setSaving(false);
    
    // Feedback visual opcional
    toast.success('Salvo', { id: 'autosave', icon: '💾', duration: 1000 });
  };

  const handleObservacaoChange = (texto: string) => {
    if (!perguntaAtual) return;
    setRespostas(prev => ({
      ...prev,
      [perguntaAtual.id]: {
        template_id: perguntaAtual.id,
        resposta: prev[perguntaAtual.id]?.resposta || 0,
        observacao: texto
      }
    }));
  };

  const saveObservacao = async () => {
    // Ao perder o foco no textarea, salva no banco se houver resposta preenchida
    if (!perguntaAtual || !diagnosticoId || !respostas[perguntaAtual.id]) return;
    
    setSaving(true);
    await supabase
      .from('respostas_diagnostico')
      .update({ observacao: respostas[perguntaAtual.id].observacao })
      .eq('diagnostico_id', diagnosticoId)
      .eq('template_id', perguntaAtual.id);
    setSaving(false);
  };

  const proximaPergunta = () => {
    if (perguntaIndex < perguntasDaDimensao.length - 1) {
      setPerguntaIndex(prev => prev + 1);
    } else if (dimensaoIndex < DIMENSOES.length - 1) {
      setDimensaoIndex(prev => prev + 1);
      setPerguntaIndex(0);
    }
  };

  const perguntaAnterior = () => {
    if (perguntaIndex > 0) {
      setPerguntaIndex(prev => prev - 1);
    } else if (dimensaoIndex > 0) {
      setDimensaoIndex(prev => prev - 1);
      // Aqui idealmente voltar para a última pergunta da dimensão anterior, mas para MVP volta pra 0
      setPerguntaIndex(0); 
    }
  };

  const concluirDiagnostico = async () => {
    if (!diagnosticoId) return;

    if (Object.keys(respostas).length < perguntas.length) {
      if (!window.confirm('Existem perguntas sem resposta. Deseja concluir mesmo assim? A nota poderá ser impactada.')) {
        return;
      }
    } else {
      if (!window.confirm('Deseja finalizar o diagnóstico? Esta ação não pode ser desfeita.')) {
        return;
      }
    }

    setLoading(true);
    // 1. Calcular pontuação (mock simplificado de média aritmética para o MVP para não complicar joins de peso)
    // No MVP ideal faríamos a soma ponderada.
    let somaNotas = 0;
    Object.values(respostas).forEach(r => { somaNotas += r.resposta; });
    const media = Object.keys(respostas).length > 0 ? somaNotas / Object.keys(respostas).length : 0;
    
    // Converter de escala 1-5 para porcentagem
    const porcentagem = Math.round((media / 5) * 100);

    // Definir Nível (1 a 5) baseado na média (1.0 a 5.0)
    let nivel = 1;
    if (media >= 1.9) nivel = 2;
    if (media >= 2.7) nivel = 3;
    if (media >= 3.5) nivel = 4;
    if (media >= 4.3) nivel = 5;

    // 2. Atualizar diagnosticos
    const { error } = await supabase
      .from('diagnosticos')
      .update({
        status: 'concluido',
        pontuacao_total: porcentagem,
        nivel_maturidade: nivel,
        concluido_em: new Date().toISOString()
      })
      .eq('id', diagnosticoId);

    if (error) {
      toast.error('Erro ao concluir diagnóstico.');
      setLoading(false);
      return;
    }

    toast.success('Diagnóstico concluído com sucesso!');
    navigate(`/diagnosticos/${diagnosticoId}`);
  };

  if (loading) return <div className="p-8">Carregando questionário...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ background: 'var(--glass)' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 className="font-bold text-main" style={{ fontSize: '1.25rem' }}>{setorNome}</h2>
          <p className="text-muted text-sm">Suas respostas são salvas automaticamente.</p>
        </div>
        <div style={{ width: '40px' }}>
          {saving && <Save size={20} color="var(--primary)" className="animate-pulse" />}
        </div>
      </div>

      {/* Stepper Vertical/Horizontal Simplificado */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflowX: 'auto' }}>
        {DIMENSOES.map((dim, idx) => {
          const isCurrent = idx === dimensaoIndex;
          const isPast = idx < dimensaoIndex;
          
          return (
            <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isCurrent || isPast ? 1 : 0.5 }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                background: isPast ? '#22c55e' : (isCurrent ? 'var(--primary)' : 'var(--border)'),
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
              }}>
                {isPast ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <span className="text-sm font-bold" style={{ color: isCurrent ? 'var(--primary)' : 'inherit', textTransform: 'capitalize' }}>
                {dim}
              </span>
              {idx < DIMENSOES.length - 1 && <ChevronRight size={16} color="var(--border)" style={{ marginLeft: '0.5rem' }} />}
            </div>
          );
        })}
      </div>

      {/* Pergunta Card */}
      {perguntaAtual ? (
        <div className="glass-panel" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', marginBottom: '1rem' }}>
              Pergunta {perguntaIndex + 1} de {perguntasDaDimensao.length}
            </span>
            <h3 className="text-2xl font-bold text-main" style={{ lineHeight: '1.4' }}>
              {perguntaAtual.pergunta}
            </h3>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4, 5].map(nota => {
                const isSelected = respostas[perguntaAtual.id]?.resposta === nota;
                const labels = ['Inexistente', 'Inicial', 'Em Desenvolvimento', 'Estabelecido', 'Otimizado'];
                return (
                  <button
                    key={nota}
                    onClick={() => handleAnswer(nota)}
                    style={{
                      padding: '1.5rem 0.5rem',
                      background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.9)'}`,
                      color: isSelected ? 'white' : 'var(--text-main)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{nota}</span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', textAlign: 'center' }}>{labels[nota - 1]}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <p className="text-sm font-bold text-muted mb-1">Observações (Opcional)</p>
              <textarea 
                value={respostas[perguntaAtual.id]?.observacao || ''}
                onChange={(e) => handleObservacaoChange(e.target.value)}
                onBlur={saveObservacao}
                placeholder="Detalhes ou evidências sobre a resposta..."
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.9)',
                  background: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px',
                  color: 'var(--text-main)', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <button 
              onClick={perguntaAnterior} 
              disabled={dimensaoIndex === 0 && perguntaIndex === 0}
              className="btn-outline flex-center gap-2"
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            {dimensaoIndex === DIMENSOES.length - 1 && perguntaIndex === perguntasDaDimensao.length - 1 ? (
              <button 
                onClick={concluirDiagnostico} 
                className="btn-primary flex-center gap-2"
                style={{ background: '#22c55e', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)' }}
              >
                Concluir Diagnóstico <CheckCircle2 size={16} />
              </button>
            ) : (
              <button 
                onClick={proximaPergunta} 
                className="btn-primary flex-center gap-2"
              >
                Próxima <ChevronRight size={16} />
              </button>
            )}
          </div>

        </div>
      ) : (
        <div className="glass-panel p-8 text-center">
          <p>Nenhuma pergunta configurada para esta dimensão.</p>
          <button onClick={proximaPergunta} className="btn-primary mt-4">Avançar Dimensão</button>
        </div>
      )}

      {/* Progress Bar GERAL */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p className="text-sm text-muted mb-2">Progresso Geral do Diagnóstico</p>
        <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${(Object.keys(respostas).length / perguntas.length) * 100}%`, 
            height: '100%', background: '#22c55e', transition: 'width 0.3s ease' 
          }} />
        </div>
      </div>

    </div>
  );
}

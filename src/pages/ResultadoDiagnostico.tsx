import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useReactToPrint } from 'react-to-print';

type Resposta = {
  id: string;
  resposta: number;
  observacao: string;
  templates_diagnostico: {
    pergunta: string;
    dimensao: string;
  };
};

type DiagnosticoResult = {
  id: string;
  ciclo: string;
  pontuacao_total: number;
  nivel_maturidade: number;
  concluido_em: string;
  setores: {
    nome: string;
    tipo: string;
  };
};

export default function ResultadoDiagnostico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoResult | null>(null);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [expandedDim, setExpandedDim] = useState<string>('processos');

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Relatorio_Maturidade_${diagnostico?.setores?.nome || 'Setor'}`,
  });

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const { data: dData } = await supabase
        .from('diagnosticos')
        .select(`
          id, ciclo, pontuacao_total, nivel_maturidade, concluido_em,
          setores (nome, tipo)
        `)
        .eq('id', id)
        .single();
        
      if (dData) setDiagnostico(dData as any);

      const { data: rData } = await supabase
        .from('respostas_diagnostico')
        .select(`
          id, resposta, observacao,
          templates_diagnostico (pergunta, dimensao)
        `)
        .eq('diagnostico_id', id);

      if (rData) setRespostas(rData as any);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8">Gerando relatório...</div>;
  if (!diagnostico) return <div className="p-8">Diagnóstico não encontrado.</div>;

  // Agrupar respostas por dimensão para calcular médias
  const dimensoesAgg: Record<string, { soma: number, count: number, respostas: Resposta[] }> = {
    processos: { soma: 0, count: 0, respostas: [] },
    dados: { soma: 0, count: 0, respostas: [] },
    tecnologia: { soma: 0, count: 0, respostas: [] },
    pessoas: { soma: 0, count: 0, respostas: [] },
    gestao: { soma: 0, count: 0, respostas: [] },
  };

  respostas.forEach(r => {
    const dim = r.templates_diagnostico.dimensao.toLowerCase();
    if (dimensoesAgg[dim]) {
      dimensoesAgg[dim].soma += r.resposta;
      dimensoesAgg[dim].count += 1;
      dimensoesAgg[dim].respostas.push(r);
    }
  });

  const chartData = Object.keys(dimensoesAgg).map(key => {
    const media = dimensoesAgg[key].count > 0 ? (dimensoesAgg[key].soma / dimensoesAgg[key].count).toFixed(1) : 0;
    return {
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: Number(media),
      fullMark: 5,
      key
    };
  });

  const labelsMaturidade = ['Inexistente', 'Inicial', 'Em Desenvolvimento', 'Estabelecido', 'Otimizado'];
  const descricoesMaturidade = [
    'O setor não possui práticas estruturadas. A operação é totalmente ad-hoc e imprevisível.',
    'Existem algumas práticas, mas dependem de esforços individuais. Alta dependência manual.',
    'Processos começam a ser documentados e a tecnologia é introduzida, mas falta padronização.',
    'O setor possui processos padronizados, métricas definidas e uso consistente de tecnologia.',
    'A excelência foi atingida. Foco em melhoria contínua, inovação e uso de dados avançados.'
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Top Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/diagnosticos')} className="btn-icon" style={{ background: 'var(--glass)' }}>
          <ArrowLeft size={20} />
        </button>
        <button onClick={handlePrint as any} className="btn-outline flex-center gap-2">
          <Download size={18} /> Exportar PDF
        </button>
      </div>

      {/* Relatório Container (o que será impresso) */}
      <div ref={componentRef} style={{ padding: '2rem', background: 'transparent' }}>
        
        {/* Header Relatório */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="text-2xl font-bold text-main" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {diagnostico.setores.nome}
          </h1>
          <p className="text-muted">
            Relatório de Maturidade • {diagnostico.ciclo} • Concluído em {new Date(diagnostico.concluido_em).toLocaleDateString()}
          </p>
        </div>

        {/* Card Principal */}
        <div style={{ 
          background: `var(--badge-nivel-${diagnostico.nivel_maturidade})`,
          borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', marginBottom: '3rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          color: diagnostico.nivel_maturidade === 1 ? '#991b1b' : 
                 diagnostico.nivel_maturidade === 2 ? '#9a3412' : 
                 diagnostico.nivel_maturidade === 3 ? '#854d0e' : 
                 diagnostico.nivel_maturidade === 4 ? '#1e40af' : '#166534'
        }}>
          <h2 style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '0.5rem' }}>
            Nível {diagnostico.nivel_maturidade}
          </h2>
          <h3 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem', lineHeight: '1' }}>
            {labelsMaturidade[diagnostico.nivel_maturidade - 1]}
          </h3>
          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Score Final: {diagnostico.pontuacao_total}%
          </p>
          <p style={{ maxWidth: '600px', margin: '0 auto', opacity: 0.9 }}>
            {descricoesMaturidade[diagnostico.nivel_maturidade - 1]}
          </p>
        </div>

        {/* Gráfico e Dimensões */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem', alignItems: 'center' }}>
          
          <div className="glass-panel" style={{ height: '400px', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-main)', fontWeight: 'bold', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'var(--text-muted)' }} />
                <Radar name="Maturidade" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 className="font-bold text-main" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Desempenho por Dimensão</h3>
            {chartData.map(d => (
              <div key={d.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="font-bold">{d.subject}</span>
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>{d.A} / 5.0</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(d.A / 5) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '6px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Respostas Detalhadas (Accordion) */}
        <div style={{ pageBreakBefore: 'always' }}>
          <h3 className="font-bold text-main" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Respostas Detalhadas</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chartData.map(d => {
              const isExpanded = expandedDim === d.key;
              const dimData = dimensoesAgg[d.key].respostas;
              
              if (dimData.length === 0) return null;

              return (
                <div key={d.key} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setExpandedDim(isExpanded ? '' : d.key)}
                    style={{ 
                      width: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', 
                      alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer',
                      borderBottom: isExpanded ? '1px solid rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    <span className="font-bold text-main" style={{ fontSize: '1.125rem' }}>{d.subject}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>Score: {d.A}</span>
                      {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '1.5rem' }}>
                      <table className="table" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '50%' }}>Pergunta</th>
                            <th style={{ textAlign: 'center', width: '15%' }}>Resposta</th>
                            <th>Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dimData.map(resp => (
                            <tr key={resp.id}>
                              <td>{resp.templates_diagnostico.pergunta}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="font-bold" style={{ 
                                  display: 'inline-block', width: '28px', height: '28px', lineHeight: '28px',
                                  background: 'var(--primary)', color: 'white', borderRadius: '50%' 
                                }}>
                                  {resp.resposta}
                                </span>
                              </td>
                              <td className="text-muted text-sm">{resp.observacao || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

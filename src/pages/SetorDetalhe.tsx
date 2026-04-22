import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, PlayCircle, Info, History, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Diagnostico = {
  id: string;
  ciclo: string;
  status: string;
  pontuacao_total: number;
  nivel_maturidade: number;
  criado_em: string;
  concluido_em: string | null;
};

type SetorDetalheType = {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  status: string;
  criado_em: string;
  atualizado_em: string;
  template_base: string | null;
};

export default function SetorDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = true;

  const [setor, setSetor] = useState<SetorDetalheType | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // info, historico, evolucao
  
  // Mock Dimensões (Para o MVP, exibimos dados fixos se não houver respostas para não quebrar a tela)
  const [dimensoes, setDimensoes] = useState([
    { nome: 'Processos', nota: 3.5 },
    { nome: 'Dados', nota: 2.8 },
    { nome: 'Tecnologia', nota: 4.1 },
    { nome: 'Pessoas', nota: 3.0 },
    { nome: 'Gestão', nota: 3.2 },
  ]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (!id) return;

      // Buscar setor
      const { data: sData } = await supabase.from('setores').select('*').eq('id', id).single();
      if (sData) setSetor(sData);

      // Buscar diagnosticos do setor
      const { data: dData } = await supabase
        .from('diagnosticos')
        .select('*')
        .eq('setor_id', id)
        .order('criado_em', { ascending: false });
      
      if (dData) setDiagnosticos(dData);

      // (MVP) No futuro aqui faremos o fetch real das respostas_diagnostico do ultimo diag.

      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-muted">Carregando detalhes do setor...</div>;
  }

  if (!setor) {
    return (
      <div className="flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem' }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 className="text-2xl font-bold mb-1 text-main">Setor não encontrado</h2>
        <button onClick={() => navigate('/setores')} className="btn-outline mt-8">Voltar para Setores</button>
      </div>
    );
  }

  const ultimoDiag = diagnosticos.length > 0 ? diagnosticos[0] : null;

  // Preparar dados para o gráfico de evolução
  const chartData = [...diagnosticos].reverse().map((d, index) => ({
    name: d.ciclo || `Ciclo ${index + 1}`,
    nivel: d.nivel_maturidade || 0,
    pontuacao: d.pontuacao_total || 0,
    data: new Date(d.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }));

  return (
    <div className="animate-fade-in">
      {/* Header Profile */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/setores')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)', margin: 0 }}>{setor.nome}</h1>
              <span className={`badge badge-tipo-${setor.tipo}`}>{setor.tipo}</span>
              <span className={`badge badge-status-${setor.status}`}>{setor.status}</span>
            </div>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              ID: {setor.id.split('-')[0]} • Atualizado em {new Date(setor.atualizado_em).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isAdmin && (
            <button onClick={() => navigate(`/setores/${setor.id}/editar`)} className="btn-outline flex-center gap-2">
              <Edit2 size={16} /> Editar
            </button>
          )}
          <button className="btn-primary flex-center gap-2" disabled={setor.status !== 'ativo'} onClick={() => navigate(`/diagnostico/novo/${setor.id}`)}>
            <PlayCircle size={18} /> Iniciar Diagnóstico
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <Info size={16} /> Informações
        </button>
        <button 
          className={`tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          <History size={16} /> Histórico ({diagnosticos.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'evolucao' ? 'active' : ''}`}
          onClick={() => setActiveTab('evolucao')}
        >
          <TrendingUp size={16} /> Evolução
        </button>
      </div>

      {/* Tab Content: Informações */}
      {activeTab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="font-bold mb-4" style={{ fontSize: '1.125rem' }}>Detalhes do Setor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p className="text-sm text-muted mb-1">Descrição</p>
                <p>{setor.descricao || 'Nenhuma descrição fornecida.'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p className="text-sm text-muted mb-1">Tipo</p>
                  <p style={{ textTransform: 'capitalize' }}>{setor.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Template Herdado</p>
                  <p>{setor.template_base ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Criado em</p>
                  <p>{new Date(setor.criado_em).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="font-bold mb-4" style={{ fontSize: '1.125rem' }}>Maturidade Atual</h3>
            {ultimoDiag && ultimoDiag.nivel_maturidade ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ 
                    width: '80px', height: '80px', borderRadius: '50%', 
                    background: `var(--badge-nivel-${ultimoDiag.nivel_maturidade}, #dcfce7)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: 'bold', color: '#166534'
                  }}>
                    {ultimoDiag.nivel_maturidade}
                  </div>
                  <div>
                    <h4 className="font-bold text-2xl" style={{ margin: 0 }}>
                      {ultimoDiag.pontuacao_total}%
                    </h4>
                    <p className="text-muted">Último ciclo: {ultimoDiag.ciclo || 'Padrão'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-muted mb-4" style={{ textTransform: 'uppercase' }}>Por Dimensão (Último Ciclo)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {dimensoes.map(dim => (
                      <div key={dim.nome}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                          <span>{dim.nome}</span>
                          <span className="font-bold">{dim.nota} / 5</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(dim.nota / 5) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-center" style={{ flexDirection: 'column', height: '200px', opacity: 0.7 }}>
                <AlertCircle size={32} style={{ marginBottom: '1rem' }} />
                <p className="text-sm text-muted">Nenhum diagnóstico concluído para calcular a maturidade.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Histórico */}
      {activeTab === 'historico' && (
        <div className="table-container animate-fade-in">
          {diagnosticos.length === 0 ? (
            <div className="flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem' }}>
              <History size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p className="text-muted">Nenhum diagnóstico realizado ainda.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Ciclo</th>
                  <th>Status</th>
                  <th>Pontuação Total</th>
                  <th>Nível</th>
                  <th>Data de Início</th>
                  <th>Data de Conclusão</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticos.map(d => (
                  <tr key={d.id}>
                    <td className="font-bold">{d.ciclo || 'Ciclo Inicial'}</td>
                    <td>
                      <span className={`badge`} style={{ background: d.status === 'concluido' ? '#dcfce7' : '#dbeafe', color: d.status === 'concluido' ? '#166534' : '#1e40af' }}>
                        {d.status === 'concluido' ? 'Concluído' : 'Em Andamento'}
                      </span>
                    </td>
                    <td>{d.pontuacao_total ? `${d.pontuacao_total}%` : '-'}</td>
                    <td>
                      {d.nivel_maturidade ? (
                         <span className={`badge badge-nivel-${d.nivel_maturidade}`}>Nível {d.nivel_maturidade}</span>
                      ) : '-'}
                    </td>
                    <td>{new Date(d.criado_em).toLocaleDateString()}</td>
                    <td>{d.concluido_em ? new Date(d.concluido_em).toLocaleDateString() : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {d.status === 'concluido' ? (
                        <button className="btn-outline text-sm" style={{ padding: '0.25rem 0.75rem' }}>Ver Resultado</button>
                      ) : (
                        <button className="btn-primary text-sm" style={{ padding: '0.25rem 0.75rem' }}>Continuar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab Content: Evolução */}
      {activeTab === 'evolucao' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          {diagnosticos.filter(d => d.status === 'concluido').length < 2 ? (
            <div className="flex-center" style={{ flexDirection: 'column', padding: '3rem 2rem', opacity: 0.7 }}>
              <TrendingUp size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <p className="text-muted">Realize pelo menos 2 diagnósticos concluídos para visualizar a evolução do setor.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 className="font-bold" style={{ fontSize: '1.125rem' }}>Evolução de Maturidade Global</h3>
                <select className="select-input" style={{ width: '200px' }}>
                  <option value="geral">Geral (Nível)</option>
                  <option value="pontuacao">Geral (Pontuação %)</option>
                </select>
              </div>
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="nivel" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .tab-btn {
          background: transparent;
          border: none;
          padding: 0.75rem 0;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--text-main);
        }
        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
      `}</style>
    </div>
  );
}

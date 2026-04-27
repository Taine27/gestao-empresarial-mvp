import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { 
  Plus, Building2, BarChart2, TrendingUp, Users, Target, Activity, 
  AlertCircle, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Stats = {
  mediaGlobal: number;
  totalSetores: number;
  totalDiagnosticos: number;
  percentualConcluido: number;
  maturidadePorSetor: { name: string; value: number }[];
  maturidadePorDimensao: { subject: string; A: number; fullMark: number }[];
  kpisDestaque: any[];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [setoresRecentes, setSetoresRecentes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // 1. Buscar setores e diagnósticos
      const { data: setores } = await supabase.from('setores').select('*');
      const { data: diagnosticos } = await supabase.from('diagnosticos').select('*');
      const { data: kpis } = await supabase.from('indicadores').select('*, setores(nome)').eq('status', 'ativo').limit(4);
      
      if (!setores || !diagnosticos) {
        setLoading(false);
        return;
      }

      setSetoresRecentes(setores.slice(0, 4));

      // 2. Calcular Média Global
      const concluidos = diagnosticos.filter(d => d.status === 'concluido');
      const mediaGlobal = concluidos.length > 0 
        ? concluidos.reduce((acc, curr) => acc + Number(curr.nivel_maturidade), 0) / concluidos.length 
        : 0;

      // 3. Maturidade por Setor
      const maturidadePorSetor = setores.map(s => {
        const diagsSetor = concluidos.filter(d => d.setor_id === s.id);
        const media = diagsSetor.length > 0 
          ? diagsSetor.reduce((acc, curr) => acc + Number(curr.nivel_maturidade), 0) / diagsSetor.length 
          : 0;
        return { name: s.nome, value: Number(media.toFixed(1)) };
      }).filter(s => s.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

      // 4. Radar de Dimensões (Mock ou real se houver agregadores)
      const maturidadePorDimensao = [
        { subject: 'Processos', A: 3.5, fullMark: 5 },
        { subject: 'Dados', A: 2.8, fullMark: 5 },
        { subject: 'Tecnologia', A: 4.2, fullMark: 5 },
        { subject: 'Pessoas', A: 3.1, fullMark: 5 },
        { subject: 'Gestão', A: 3.4, fullMark: 5 },
      ];

      setStats({
        mediaGlobal: Number(mediaGlobal.toFixed(1)),
        totalSetores: setores.length,
        totalDiagnosticos: diagnosticos.length,
        percentualConcluido: diagnosticos.length > 0 
          ? Math.round((concluidos.length / diagnosticos.length) * 100) 
          : 0,
        maturidadePorSetor,
        maturidadePorDimensao,
        kpisDestaque: kpis || []
      });
      
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-muted">Carregando painel unificado...</div>;

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="animate-fade-in" style={{ padding: '0 1.5rem 4rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Unificado */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ letterSpacing: '-0.025em' }}>Painel Estratégico</h1>
          <p className="text-muted">Visão consolidada de maturidade e performance organizacional.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline flex-center gap-2" style={{ padding: '0.6rem 1.2rem' }} onClick={() => navigate('/diagnosticos')}>
            Ver Histórico
          </button>
          <button className="btn-primary flex-center gap-2" style={{ padding: '0.6rem 1.2rem' }} onClick={() => navigate('/setores')}>
            <Plus size={20} /> Novo Diagnóstico
          </button>
        </div>
      </div>

      {/* Grid de KPIs de Alto Nível */}
      <div className="stats-kpi-grid" style={{ marginBottom: '36px' }}>
        <div className="glass-panel card-stat" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span className="text-muted text-xs font-bold uppercase tracking-widest">Maturidade Geral</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <TrendingUp size={18} className="text-primary" />
            </div>
          </div>
          <div className="flex-row" style={{ alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="text-4xl font-bold" style={{ color: 'var(--text-main)' }}>{stats?.mediaGlobal || 0}</span>
            <span className="text-muted text-sm font-medium">/ 5.0</span>
          </div>
        </div>

        <div className="glass-panel card-stat" style={{ padding: '1.5rem', borderLeft: '4px solid #22c55e' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span className="text-muted text-xs font-bold uppercase tracking-widest">Diagnósticos</span>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <BarChart2 size={18} style={{ color: '#22c55e' }} />
            </div>
          </div>
          <div className="flex-row" style={{ alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="text-4xl font-bold" style={{ color: 'var(--text-main)' }}>{stats?.totalDiagnosticos || 0}</span>
            <span className="text-muted text-sm font-medium">{stats?.percentualConcluido}% concluídos</span>
          </div>
        </div>

        <div className="glass-panel card-stat" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span className="text-muted text-xs font-bold uppercase tracking-widest">Setores</span>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <Building2 size={18} style={{ color: '#8b5cf6' }} />
            </div>
          </div>
          <div className="flex-row" style={{ alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="text-4xl font-bold" style={{ color: 'var(--text-main)' }}>{stats?.totalSetores || 0}</span>
            <span className="text-muted text-sm font-medium">Monitorados</span>
          </div>
        </div>

        <div className="glass-panel card-stat" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span className="text-muted text-xs font-bold uppercase tracking-widest">KPIs Ativos</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <Target size={18} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div className="flex-row" style={{ alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="text-4xl font-bold" style={{ color: 'var(--text-main)' }}>{stats?.kpisDestaque.length || 0}</span>
            <span className="text-muted text-sm font-medium">Métricas de setor</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        {/* Gráfico Principal: Maturidade por Setor */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h3 className="font-bold text-xl">Maturidade por Setor</h3>
            <button className="text-primary text-sm font-bold flex-center gap-1 hover-underline" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/setores')}>
              Ver todos <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.maturidadePorSetor} margin={{ left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '0.75rem', fontWeight: '600' }} 
                  dy={10}
                />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} style={{ fontSize: '0.75rem' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                  {stats?.maturidadePorSetor.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar de Dimensões */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="font-bold text-xl mb-8">Equilíbrio de Dimensões</h3>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats?.maturidadePorDimensao}>
                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                <PolarAngleAxis dataKey="subject" style={{ fontSize: '0.8rem', fontWeight: '700', fill: 'var(--text-muted)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                <Radar 
                  name="Maturidade" 
                  dataKey="A" 
                  stroke="var(--primary)" 
                  fill="var(--primary)" 
                  fillOpacity={0.3} 
                  strokeWidth={3}
                />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Lista de KPIs Críticos ou Destaques */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className="font-bold text-xl">Métricas de Performance</h3>
            <button className="text-primary text-sm font-bold flex-center gap-1 hover-underline" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/indicadores')}>
              Gerenciar KPIs <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stats?.kpisDestaque.length === 0 ? (
              <div className="flex-center" style={{ height: '200px', flexDirection: 'column', opacity: 0.5 }}>
                <Target size={32} className="mb-2" />
                <p className="text-sm italic">Nenhum KPI cadastrado ainda.</p>
              </div>
            ) : (
              stats?.kpisDestaque.map(kpi => (
                <div key={kpi.id} className="flex-row item-kpi" style={{ 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'rgba(255,255,255,0.4)', 
                  padding: '1rem 1.25rem', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}>
                  <div>
                    <p className="text-xs text-muted font-bold uppercase tracking-widest mb-1" style={{ fontSize: '0.65rem' }}>{kpi.setores?.nome}</p>
                    <p className="font-bold text-base" style={{ color: 'var(--text-main)' }}>{kpi.nome}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>{kpi.valor_atual}<small style={{ fontSize: '0.75rem', fontWeight: '500', marginLeft: '0.1rem' }}>{kpi.unidade}</small></p>
                    <div className="flex-row" style={{ alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <p className="text-xs font-bold" style={{ color: kpi.valor_atual >= kpi.meta ? '#22c55e' : '#ef4444' }}>
                        {kpi.valor_atual >= kpi.meta ? 'Acima da meta' : 'Abaixo da meta'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recomendações e Insights */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="font-bold text-xl mb-6">Recomendações Estratégicas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="flex-row gap-4 insight-card" style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div style={{ background: '#f59e0b', padding: '0.6rem', borderRadius: '12px', height: 'fit-content' }}>
                <AlertCircle size={22} color="white" />
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: '#92400e' }}>Atenção: Maturidade em Dados</p>
                <p className="text-sm" style={{ color: '#b45309', lineHeight: '1.5' }}>O índice de Dados está 20% abaixo do esperado. Considere automatizar a coleta de indicadores nos setores de Financeiro e Logística.</p>
              </div>
            </div>
            <div className="flex-row gap-4 insight-card" style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '12px', height: 'fit-content' }}>
                <TrendingUp size={22} color="white" />
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: '#3730a3' }}>Oportunidade de Melhoria</p>
                <p className="text-sm" style={{ color: '#4338ca', lineHeight: '1.5' }}>Setores com maturidade nível 4+ em Tecnologia apresentam KPIs 15% melhores. Expanda as ferramentas de TI para o Comercial.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .stats-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 1200px) {
          .stats-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .stats-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
        .card-stat { transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.4); }
        .card-stat:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
        .hover-underline:hover { text-decoration: underline; }
        .item-kpi:hover { background: rgba(255,255,255,0.7) !important; transform: scale(1.02); }
        .insight-card { transition: transform 0.2s ease; }
        .insight-card:hover { transform: translateX(5px); }
      `}</style>
    </div>
  );
}

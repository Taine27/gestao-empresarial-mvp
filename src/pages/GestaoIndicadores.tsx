import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Filter, Archive, Edit3, TrendingUp, TrendingDown, 
  Minus, Target, LayoutGrid, List, ChevronRight, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Indicador = {
  id: string;
  nome: string;
  setor_id: string;
  setores: { nome: string };
  meta: number;
  valor_atual: number;
  unidade: string;
  periodicidade: string;
  status: string;
  descricao: string;
};

export default function GestaoIndicadores() {
  const navigate = useNavigate();
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [setorFilter, setSetorFilter] = useState('todos');
  const [setores, setSetores] = useState<{id: string, nome: string}[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Buscar setores para o filtro
      const { data: sData } = await supabase.from('setores').select('id, nome').order('nome');
      if (sData) setSetores(sData);

      // Buscar indicadores com join no setor
      const { data: iData, error } = await supabase
        .from('indicadores')
        .select(`
          *,
          setores ( nome )
        `)
        .order('nome');
      
      if (!error && iData) {
        setIndicadores(iData as any);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredIndicadores = indicadores.filter(i => {
    const matchesSearch = i.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = setorFilter === 'todos' || i.setor_id === setorFilter;
    return matchesSearch && matchesSetor;
  });

  const getStatusColor = (atual: number, meta: number) => {
    const percent = (atual / meta) * 100;
    if (percent >= 100) return '#22c55e'; // Verde
    if (percent >= 80) return '#f59e0b';  // Amarelo/Laranja
    return '#ef4444'; // Vermelho
  };

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold mb-1">Gestão de Indicadores (KPIs)</h1>
          <p className="text-muted">Acompanhe e gerencie as métricas de desempenho por setor.</p>
        </div>
        <button className="btn-primary flex-center gap-2" onClick={() => navigate('/indicadores/novo')}>
          <Plus size={20} /> Novo Indicador
        </button>
      </div>

      <div className="filters-bar" style={{ marginBottom: '2rem' }}>
        <div className="input-wrapper" style={{ flex: 1 }}>
          <Search className="input-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar indicador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="select-input"
          value={setorFilter}
          onChange={(e) => setSetorFilter(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="todos">Todos os Setores</option>
          {setores.map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>

        <div className="flex-row" style={{ background: 'var(--glass)', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            onClick={() => setViewMode('grid')}
            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
            style={{ background: viewMode === 'grid' ? 'white' : 'transparent', boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
            style={{ background: viewMode === 'list' ? 'white' : 'transparent', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-muted">Carregando indicadores...</div>
      ) : (
        <>
          {filteredIndicadores.length === 0 ? (
            <div className="glass-panel flex-center" style={{ padding: '4rem', flexDirection: 'column' }}>
              <AlertCircle size={40} className="text-muted mb-2" />
              <p className="text-muted">Nenhum indicador encontrado.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid-container" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {filteredIndicadores.map(i => (
                <div key={i.id} className="glass-panel card-hover" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <span className="badge" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                        {i.setores?.nome}
                      </span>
                      <h3 className="font-bold text-lg">{i.nome}</h3>
                    </div>
                    <div style={{ color: getStatusColor(i.valor_atual, i.meta) }}>
                      {i.valor_atual >= i.meta ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <span className="text-3xl font-bold">{i.valor_atual}<small style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>{i.unidade}</small></span>
                      <span className="text-muted text-sm">Meta: {i.meta}{i.unidade}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min((i.valor_atual / i.meta) * 100, 100)}%`, 
                        height: '100%', 
                        background: getStatusColor(i.valor_atual, i.meta),
                        borderRadius: '4px' 
                      }} />
                    </div>
                  </div>

                  <div className="flex-row" style={{ justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
                    <span className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Atualização {i.periodicidade}</span>
                    <div className="flex-row gap-2">
                      <button className="btn-icon sm" onClick={() => navigate(`/indicadores/${i.id}/editar`)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-icon sm" title="Ver Histórico">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Indicador</th>
                    <th>Setor</th>
                    <th>Valor Atual</th>
                    <th>Meta</th>
                    <th>Progresso</th>
                    <th>Frequência</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIndicadores.map(i => (
                    <tr key={i.id}>
                      <td className="font-bold">{i.nome}</td>
                      <td>{i.setores?.nome}</td>
                      <td>{i.valor_atual}{i.unidade}</td>
                      <td>{i.meta}{i.unidade}</td>
                      <td style={{ width: '150px' }}>
                        <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px' }}>
                            <div style={{ width: `${Math.min((i.valor_atual / i.meta) * 100, 100)}%`, height: '100%', background: getStatusColor(i.valor_atual, i.meta), borderRadius: '3px' }} />
                          </div>
                          <span className="text-xs font-bold">{Math.round((i.valor_atual / i.meta) * 100)}%</span>
                        </div>
                      </td>
                      <td>{i.periodicidade}</td>
                      <td style={{ textAlign: 'center' }}>
                         <div className="flex-row" style={{ justifyContent: 'center', gap: '0.5rem' }}>
                           <button className="btn-icon sm" onClick={() => navigate(`/indicadores/${i.id}/editar`)}><Edit3 size={16} /></button>
                           <button className="btn-icon sm"><Archive size={16} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <style>{`
        .btn-icon.sm { width: 32px; height: 32px; padding: 0; }
        .card-hover:hover { transform: translateY(-4px); }
      `}</style>
    </div>
  );
}

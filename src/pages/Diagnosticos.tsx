import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PlayCircle, Plus, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

type DiagnosticoList = {
  id: string;
  setor_id: string;
  ciclo: string;
  status: string;
  pontuacao_total: number;
  nivel_maturidade: number;
  criado_em: string;
  concluido_em: string | null;
  setores: {
    nome: string;
    tipo: string;
  };
};

export default function Diagnosticos() {
  const navigate = useNavigate();
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoList[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnosticos')
        .select(`
          *,
          setores (nome, tipo)
        `)
        .order('criado_em', { ascending: false });

      if (!error && data) {
        setDiagnosticos(data as any);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredData = diagnosticos.filter(d => {
    const matchesSearch = 
      d.setores?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.ciclo && d.ciclo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'todos' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold mb-1">Diagnósticos</h1>
          <p className="text-muted">Histórico de avaliações de todos os setores.</p>
        </div>
        <button className="btn-primary flex-center gap-2" onClick={() => navigate('/setores')}>
          <Plus size={20} /> Novo Diagnóstico
        </button>
      </div>

      <div className="filters-bar">
        <div className="input-wrapper" style={{ minWidth: '250px' }}>
          <Search className="input-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por setor ou ciclo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="select-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todos">Status: Todos</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
        </select>

        <button 
          className="btn-outline flex-center gap-2" 
          style={{ padding: '0.6rem 1rem' }}
          onClick={() => { setSearchTerm(''); setStatusFilter('todos'); }}
        >
          <Filter size={16} /> Limpar
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Carregando diagnósticos...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredData.length === 0 ? (
            <div className="flex-center" style={{ flexDirection: 'column', gridColumn: '1 / -1', padding: '4rem 2rem' }}>
              <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p className="text-muted">Nenhum diagnóstico encontrado.</p>
            </div>
          ) : (
            filteredData.map(d => (
              <div key={d.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 className="font-bold text-main" style={{ fontSize: '1.125rem' }}>{d.setores?.nome}</h3>
                    <p className="text-muted text-sm">{d.ciclo || 'Ciclo Inicial'}</p>
                  </div>
                  <span className={`badge`} style={{ 
                    background: d.status === 'concluido' ? '#dcfce7' : '#dbeafe', 
                    color: d.status === 'concluido' ? '#166534' : '#1e40af' 
                  }}>
                    {d.status === 'concluido' ? 'Concluído' : 'Em Andamento'}
                  </span>
                </div>

                <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                  {d.status === 'concluido' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '50px', height: '50px', borderRadius: '50%', 
                        background: `var(--badge-nivel-${d.nivel_maturidade}, #dcfce7)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.25rem', fontWeight: 'bold', color: '#166534'
                      }}>
                        {d.nivel_maturidade}
                      </div>
                      <div>
                        <p className="font-bold">{d.pontuacao_total}%</p>
                        <p className="text-sm text-muted">Maturidade Atingida</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', height: '50px' }}>
                      <p className="text-sm text-muted">Aguardando finalização do questionário.</p>
                      {/* Fake progress bar for UI representation */}
                      <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '30%', height: '100%', background: 'var(--primary)' }}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
                  <span className="text-sm text-muted">
                    {d.status === 'concluido' 
                      ? `Concluído em ${new Date(d.concluido_em!).toLocaleDateString()}`
                      : `Iniciado em ${new Date(d.criado_em).toLocaleDateString()}`
                    }
                  </span>
                  
                  {d.status === 'concluido' ? (
                    <button 
                      onClick={() => navigate(`/diagnosticos/${d.id}`)}
                      className="btn-icon" style={{ color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)' }}
                    >
                      <FileText size={18} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/diagnostico/novo/${d.setor_id}`)}
                      className="btn-icon" style={{ color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)' }}
                    >
                      <PlayCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { Plus, Building2, BarChart2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Setor = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
};

export default function Dashboard() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSetores() {
      const { data, error } = await supabase
        .from('setores')
        .select('*')
        .eq('status', 'ativo')
        .limit(6);
        
      if (!error && data) {
        setSetores(data);
      }
      setLoading(false);
    }
    fetchSetores();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bem-vindo ao SIGME</h1>
          <p className="text-muted">Acompanhe a maturidade da sua organização.</p>
        </div>
        <button className="btn-primary flex-center gap-2">
          <Plus size={20} /> Novo Diagnóstico
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="icon-wrapper bg-blue"><Building2 size={24} /></div>
          <div className="stat-info">
            <h3>{setores.length}</h3>
            <p>Setores Ativos</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="icon-wrapper bg-green"><BarChart2 size={24} /></div>
          <div className="stat-info">
            <h3>0</h3>
            <p>Diagnósticos Concluídos</p>
          </div>
        </div>
      </div>

      <div className="section-title mt-8 mb-4">
        <h2>Visão Geral dos Setores</h2>
      </div>

      {loading ? (
        <p className="text-muted">Carregando setores...</p>
      ) : (
        <div className="sectors-grid">
          {setores.map(setor => (
            <div key={setor.id} className="sector-card glass-panel">
              <div className="sector-header">
                <h3>{setor.nome}</h3>
                <span className="badge-outline">{setor.tipo}</span>
              </div>
              <div className="sector-body">
                <p className="text-sm text-muted">Sem avaliações recentes.</p>
              </div>
              <div className="sector-footer">
                <button className="btn-outline text-sm w-full">Ver Detalhes</button>
              </div>
            </div>
          ))}
          {setores.length === 0 && (
             <p className="text-muted">Nenhum setor cadastrado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Settings2, FileQuestion, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Setor = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  _count_perguntas?: number;
};

export default function ConfiguracaoDiagnostico() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/dashboard');
      return;
    }

    async function fetchSetores() {
      setLoading(true);
      
      // Buscar setores
      const { data: sectors, error: sError } = await supabase
        .from('setores')
        .select('*')
        .order('nome');

      if (sError) {
        console.error('Erro ao buscar setores:', sError);
        setLoading(false);
        return;
      }

      // Buscar contagem de perguntas para cada setor
      const { data: counts, error: cError } = await supabase
        .from('templates_diagnostico')
        .select('setor_id');

      if (!cError && sectors) {
        const sectorList = sectors.map(s => ({
          ...s,
          _count_perguntas: counts.filter(c => c.setor_id === s.id).length
        }));
        setSetores(sectorList);
      } else if (sectors) {
        setSetores(sectors);
      }

      setLoading(false);
    }

    fetchSetores();
  }, [isSuperAdmin, navigate]);

  const filteredSetores = setores.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold mb-1">Configuração de Diagnóstico</h1>
          <p className="text-muted">Gerencie os questionários e perguntas de cada setor do sistema.</p>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: '2rem' }}>
        <div className="input-wrapper" style={{ flex: 1 }}>
          <Search className="input-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar setor para configurar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <p className="text-muted">Carregando setores e configurações...</p>
        </div>
      ) : (
        <div className="grid-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {/* Card do Formulário Padrão (Global) */}
          <div className="glass-panel card-hover" style={{ 
            padding: '1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(255, 255, 255, 0.6) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{ background: 'var(--primary)', color: 'white', marginBottom: '0.5rem', display: 'inline-block' }}>
                  Sistema
                </span>
                <h3 className="font-bold text-lg">Formulário Padrão</h3>
              </div>
              <Settings2 size={24} className="text-primary" />
            </div>

            <p className="text-sm text-muted">
              Estas perguntas serão exibidas em <strong>todos</strong> os setores, complementando as perguntas específicas de cada área.
            </p>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <button 
                className="btn-primary w-full flex-center gap-2" 
                style={{ padding: '0.75rem' }}
                onClick={() => navigate(`/configuracao-diagnostico/padrao`)}
              >
                Configurar Perguntas Globais <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {filteredSetores.length === 0 ? (
            <div className="glass-panel flex-center" style={{ gridColumn: '1 / -1', padding: '4rem', flexDirection: 'column' }}>
              <AlertCircle size={40} className="text-muted mb-2" />
              <p className="text-muted">Nenhum setor encontrado.</p>
            </div>
          ) : (
            filteredSetores.map(setor => (
              <div key={setor.id} className="glass-panel card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className={`badge badge-tipo-${setor.tipo}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                      {setor.tipo}
                    </span>
                    <h3 className="font-bold text-lg">{setor.nome}</h3>
                  </div>
                  <Settings2 size={24} className="text-primary" style={{ opacity: 0.5 }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <FileQuestion size={16} />
                  <span>{setor._count_perguntas || 0} perguntas configuradas</span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <button 
                    className="btn-outline w-full flex-center gap-2" 
                    style={{ padding: '0.75rem' }}
                    onClick={() => navigate(`/setores/${setor.id}/editar`, { state: { initialTab: 'questionario' } })}
                  >
                    Editar Questionário <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .w-full { width: 100%; }
        .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); }
      `}</style>
    </div>
  );
}

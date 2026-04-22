import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, Eye, Edit2, Archive, Plus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Diagnostico = {
  id: string;
  status: string;
  nivel_maturidade: number;
  criado_em: string;
  concluido_em: string | null;
};

type Setor = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  diagnosticos?: Diagnostico[];
};

export default function Setores() {
  const navigate = useNavigate();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');

  // Modal de Arquivamento
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [sectorToArchive, setSectorToArchive] = useState<Setor | null>(null);

  // Mock Admin role
  const isAdmin = true;

  const fetchSetores = async () => {
    setLoading(true);
    // Usamos um select com join para pegar diagnósticos (o array vem vazio se não houver)
    const { data, error } = await supabase
      .from('setores')
      .select(`
        *,
        diagnosticos (
          id,
          status,
          nivel_maturidade,
          criado_em,
          concluido_em
        )
      `)
      .order('criado_em', { ascending: false });

    if (!error && data) {
      setSetores(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSetores();
  }, []);

  const handleArchiveClick = (setor: Setor) => {
    setSectorToArchive(setor);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!sectorToArchive) return;
    
    const { error } = await supabase
      .from('setores')
      .update({ status: 'arquivado', atualizado_em: new Date().toISOString() })
      .eq('id', sectorToArchive.id);

    if (!error) {
      // Atualiza o estado local para refletir a mudança sem refetch
      setSetores(prev => prev.map(s => s.id === sectorToArchive.id ? { ...s, status: 'arquivado' } : s));
    }
    
    setShowArchiveModal(false);
    setSectorToArchive(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setTipoFilter('todos');
  };

  // Lógica de Filtros no Client Side (poderia ser no Supabase, mas assim a UI é mais instantânea para MVP)
  const filteredSetores = setores.filter(setor => {
    const matchesSearch = setor.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || setor.status === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || setor.tipo === tipoFilter;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getUltimoDiagnostico = (diagnosticos?: Diagnostico[]) => {
    if (!diagnosticos || diagnosticos.length === 0) return null;
    // Opcionalmente ordenar por data (se a API não garantir a ordem)
    const sorted = [...diagnosticos].sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    return sorted[0];
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold mb-1">Setores</h1>
          <p className="text-muted">Gerencie os setores da organização.</p>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/setores/novo')} className="btn-primary flex-center gap-2">
            <Plus size={20} /> Novo Setor
          </button>
        )}
      </div>

      <div className="filters-bar animate-fade-in">
        <div className="input-wrapper" style={{ minWidth: '250px' }}>
          <Search className="input-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar setor..." 
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
          <option value="ativo">Ativo</option>
          <option value="arquivado">Arquivado</option>
        </select>

        <select 
          className="select-input"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value="todos">Tipo: Todos</option>
          <option value="nativo">Nativo</option>
          <option value="customizado">Customizado</option>
          <option value="generico">Genérico</option>
        </select>

        <button onClick={clearFilters} className="btn-outline flex-center gap-2" style={{ padding: '0.6rem 1rem' }}>
          <Filter size={16} /> Limpar
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Carregando setores...</p>
      ) : (
        <div className="table-container animate-fade-in">
          {filteredSetores.length === 0 ? (
            <div className="flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem' }}>
              <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <p className="text-muted">Nenhum setor encontrado com os filtros atuais.</p>
              {isAdmin && <button onClick={() => navigate('/setores/novo')} className="btn-outline mt-8 text-sm">Clique em Novo Setor para começar</button>}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Último Diagnóstico</th>
                  <th>Nível de Maturidade</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSetores.map(setor => {
                  const ultimoDiag = getUltimoDiagnostico(setor.diagnosticos);
                  return (
                    <tr key={setor.id}>
                      <td className="font-bold">{setor.nome}</td>
                      <td>
                        <span className={`badge badge-tipo-${setor.tipo}`}>
                          {setor.tipo}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status-${setor.status}`}>
                          {setor.status}
                        </span>
                      </td>
                      <td>
                        {ultimoDiag ? new Date(ultimoDiag.criado_em).toLocaleDateString('pt-BR') : <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {ultimoDiag && ultimoDiag.nivel_maturidade ? (
                           <span className={`badge badge-nivel-${ultimoDiag.nivel_maturidade}`}>
                             Nível {ultimoDiag.nivel_maturidade}
                           </span>
                        ) : (
                           <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="flex-row" style={{ justifyContent: 'center', gap: '0.25rem' }}>
                          <button 
                            className="btn-icon" 
                            title="Ver Detalhes"
                            onClick={() => navigate(`/setores/${setor.id}`)}
                          >
                            <Eye size={18} />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button className="btn-icon" title="Editar">
                                <Edit2 size={18} />
                              </button>
                              {setor.status !== 'arquivado' && (
                                <button 
                                  className="btn-icon danger" 
                                  title="Arquivar"
                                  onClick={() => handleArchiveClick(setor)}
                                >
                                  <Archive size={18} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Overlay para Arquivar */}
      {showArchiveModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 className="text-2xl font-bold mb-1">Arquivar setor?</h3>
            <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
              O setor <strong>{sectorToArchive?.nome}</strong> será desativado, mas todo o seu histórico de diagnósticos será preservado para relatórios futuros.
            </p>
            <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn-outline" 
                onClick={() => setShowArchiveModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                onClick={confirmArchive}
              >
                Confirmar Arquivamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

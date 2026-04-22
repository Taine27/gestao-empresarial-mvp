import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Lock, ShieldAlert, UserX, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

type Profile = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  status: string;
  criado_em: string;
};

export default function Usuarios() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Form Cadastro
  const [cadNome, setCadNome] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadPerfil, setCadPerfil] = useState('analista');
  const [cadLoading, setCadLoading] = useState(false);

  // Form Edit
  const [editPerfil, setEditPerfil] = useState('analista');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchUsuarios();
  }, [isAdmin, navigate]);

  async function fetchUsuarios() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('criado_em', { ascending: false });
    if (data) setUsuarios(data as Profile[]);
    setLoading(false);
  }

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadNome || !cadEmail || !cadSenha) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setCadLoading(true);
    try {
      // Usar signUp pode deslogar o admin no frontend dependendo da config,
      // mas como é MVP e opção escolhida, vamos seguir e avisar se der erro
      const { data, error } = await supabase.auth.signUp({
        email: cadEmail,
        password: cadSenha,
        options: {
          data: { nome: cadNome }
        }
      });

      if (error) throw error;

      // O trigger on_auth_user_created fará o insert em profiles, 
      // mas precisamos atualizar o perfil que por padrão é 'analista'
      if (data.user && cadPerfil === 'admin') {
        // Aguarda 1 seg para o trigger dar tempo (no MVP real-time é complicado sem backend)
        setTimeout(async () => {
          await supabase.from('profiles').update({ perfil: 'admin' }).eq('id', data.user!.id);
          fetchUsuarios();
        }, 1500);
      } else {
        setTimeout(fetchUsuarios, 1500);
      }

      toast.success('Usuário cadastrado com sucesso!');
      setShowCadastroModal(false);
      
      // Limpar form
      setCadNome(''); setCadEmail(''); setCadSenha(''); setCadPerfil('analista');
      
    } catch (err: any) {
      toast.error('Erro ao cadastrar: ' + err.message);
    } finally {
      setCadLoading(false);
    }
  };

  const handleEditClick = (user: Profile) => {
    setSelectedUser(user);
    setEditPerfil(user.perfil);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    // Se o usuário logado (admin) está tentando tirar seu próprio admin:
    if (selectedUser.id === profile?.id && editPerfil !== 'admin') {
      toast.error('Você não pode remover seus próprios privilégios de administrador.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ perfil: editPerfil })
      .eq('id', selectedUser.id);

    if (error) {
      toast.error('Erro ao atualizar perfil.');
    } else {
      toast.success('Perfil atualizado com sucesso.');
      setUsuarios(prev => prev.map(u => u.id === selectedUser.id ? { ...u, perfil: editPerfil } : u));
      setShowEditModal(false);
    }
  };

  const handleToggleStatus = async (user: Profile) => {
    if (user.id === profile?.id) {
      toast.error('Você não pode desativar seu próprio acesso.');
      return;
    }

    const novoStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    
    const { error } = await supabase
      .from('profiles')
      .update({ status: novoStatus })
      .eq('id', user.id);

    if (!error) {
      toast.success(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}.`);
      setUsuarios(prev => prev.map(u => u.id === user.id ? { ...u, status: novoStatus } : u));
    }
  };

  if (loading) return <div className="p-8">Carregando usuários...</div>;

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold mb-1">Usuários</h1>
          <p className="text-muted">Gerencie os acessos ao sistema.</p>
        </div>
        <button className="btn-primary flex-center gap-2" onClick={() => setShowCadastroModal(true)}>
          <Plus size={20} /> Cadastrar Usuário
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Data de Cadastro</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td className="font-bold">{u.nome || '-'}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge" style={{ 
                    background: u.perfil === 'admin' ? '#f3e8ff' : '#dbeafe', 
                    color: u.perfil === 'admin' ? '#6b21a8' : '#1e40af' 
                  }}>
                    {u.perfil}
                  </span>
                </td>
                <td>
                  <span className="badge" style={{ 
                    background: u.status === 'ativo' ? '#dcfce7' : '#f1f5f9', 
                    color: u.status === 'ativo' ? '#166534' : '#475569' 
                  }}>
                    {u.status}
                  </span>
                </td>
                <td>{new Date(u.criado_em).toLocaleDateString()}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => handleEditClick(u)} title="Editar Perfil">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className={`btn-icon ${u.id === profile?.id ? '' : 'danger'}`}
                      onClick={() => handleToggleStatus(u)} 
                      disabled={u.id === profile?.id}
                      title={u.status === 'ativo' ? 'Desativar Acesso' : 'Ativar Acesso'}
                      style={{ opacity: u.id === profile?.id ? 0.3 : 1 }}
                    >
                      {u.status === 'ativo' ? <UserX size={18} /> : <ShieldAlert size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro */}
      {showCadastroModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 className="text-2xl font-bold">Cadastrar Usuário</h3>
              <button className="btn-icon" onClick={() => setShowCadastroModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Nome Completo</label>
                <input type="text" className="select-input" style={{ width: '100%' }} value={cadNome} onChange={e => setCadNome(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Email</label>
                <input type="email" className="select-input" style={{ width: '100%' }} value={cadEmail} onChange={e => setCadEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Senha Inicial</label>
                <input type="password" className="select-input" style={{ width: '100%' }} value={cadSenha} onChange={e => setCadSenha(e.target.value)} required minLength={6} />
              </div>
              <div>
                <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Perfil de Acesso</label>
                <select className="select-input" style={{ width: '100%' }} value={cadPerfil} onChange={e => setCadPerfil(e.target.value)}>
                  <option value="analista">Analista (Comum)</option>
                  <option value="admin">Administrador</option>
                  <option value="super_admin">Administrador Geral</option>
                </select>
              </div>

              <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCadastroModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={cadLoading}>
                  {cadLoading ? 'Criando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 className="text-2xl font-bold mb-4">Editar Perfil</h3>
            <p className="text-muted mb-4">{selectedUser.nome} ({selectedUser.email})</p>
            
            <div style={{ marginBottom: '2rem' }}>
              <label className="text-sm font-bold mb-1" style={{ display: 'block' }}>Perfil de Acesso</label>
              <select className="select-input" style={{ width: '100%' }} value={editPerfil} onChange={e => setEditPerfil(e.target.value)}>
                <option value="analista">Analista</option>
                <option value="admin">Administrador</option>
                <option value="super_admin">Administrador Geral</option>
              </select>
            </div>

            <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-outline" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveEdit}>Salvar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

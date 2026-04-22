import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Save, Shield, KeyRound, Mail, User as UserIcon } from 'lucide-react';

export default function Perfil() {
  const { user, profile } = useAuth();
  
  const [nome, setNome] = useState(profile?.nome || '');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  if (!profile || !user) return <div className="p-8">Carregando perfil...</div>;

  const getInicial = (nome: string) => {
    return nome ? nome.charAt(0).toUpperCase() : '?';
  };

  const handleSaveName = async () => {
    if (!nome.trim()) {
      toast.error('O nome não pode ser vazio.');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nome })
      .eq('id', profile.id);

    if (error) {
      toast.error('Erro ao salvar nome.');
    } else {
      toast.success('Perfil atualizado com sucesso!');
      // Update the user metadata in auth as well for consistency
      await supabase.auth.updateUser({ data: { nome } });
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Deseja receber um e-mail para redefinir sua senha?')) return;
    
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    } else {
      toast.success(`E-mail de redefinição enviado para ${profile.email}`);
    }
    setResetLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold mb-1">Meu Perfil</h1>
          <p className="text-muted">Gerencie suas informações e segurança.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Seção de Dados Pessoais */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <UserIcon size={24} color="var(--primary)" />
            <h2 className="text-2xl font-bold">Dados Pessoais</h2>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '100px', height: '100px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(99,102,241,0.3)'
              }}>
                {getInicial(nome || profile.email)}
              </div>
              <span className="badge" style={{ 
                background: profile.perfil === 'admin' ? '#f3e8ff' : '#dbeafe', 
                color: profile.perfil === 'admin' ? '#6b21a8' : '#1e40af',
                fontSize: '0.875rem'
              }}>
                {profile.perfil === 'admin' ? 'Administrador' : 'Analista'}
              </span>
            </div>

            {/* Form */}
            <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="text-sm font-bold mb-1 text-muted" style={{ display: 'block' }}>Nome Completo</label>
                <input 
                  type="text" 
                  className="select-input" 
                  style={{ width: '100%' }} 
                  value={nome} 
                  onChange={e => setNome(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1 text-muted" style={{ display: 'block' }}>Endereço de E-mail</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    disabled 
                    value={profile.email} 
                    style={{ background: 'rgba(0,0,0,0.02)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  className="btn-primary flex-center gap-2" 
                  onClick={handleSaveName}
                  disabled={loading || nome === profile.nome}
                >
                  <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Segurança */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Shield size={24} color="#ef4444" />
            <h2 className="text-2xl font-bold">Segurança e Acesso</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <h3 className="font-bold mb-1">Senha de Acesso</h3>
              <p className="text-sm text-muted" style={{ maxWidth: '400px' }}>
                Para alterar sua senha atual, nós enviaremos um link seguro diretamente para o seu e-mail cadastrado.
              </p>
            </div>
            
            <button 
              className="btn-outline flex-center gap-2" 
              onClick={handleResetPassword}
              disabled={resetLoading}
            >
              <KeyRound size={18} /> {resetLoading ? 'Enviando...' : 'Alterar Senha'}
            </button>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '2rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <h3 className="font-bold mb-1 text-sm">Status da Conta</h3>
               <p className="text-sm text-muted">Acesso {profile.status === 'ativo' ? 'permitido' : 'bloqueado'}.</p>
             </div>
             <div style={{ textAlign: 'right' }}>
               <h3 className="font-bold mb-1 text-sm">Último Acesso</h3>
               <p className="text-sm text-muted">{new Date(user.last_sign_in_at || profile.atualizado_em).toLocaleString()}</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

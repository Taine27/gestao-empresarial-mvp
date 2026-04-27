import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, FileBarChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const { user, profile, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar glass-panel-no-border">
        <div className="sidebar-header">
          <div className="logo">SIGME</div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/setores" className={`nav-item ${isActive('/setores')}`}>
            <Users size={20} />
            <span>Setores</span>
          </Link>
          <Link to="/diagnosticos" className={`nav-item ${isActive('/diagnosticos')}`}>
            <FileBarChart size={20} />
            <span>Diagnósticos</span>
          </Link>
          {isAdmin && (
            <Link to="/usuarios" className={`nav-item ${isActive('/usuarios')}`}>
              <Users size={20} />
              <span>Usuários</span>
            </Link>
          )}
          {isSuperAdmin && (
            <Link to="/configuracao-diagnostico" className={`nav-item ${isActive('/configuracao-diagnostico')}`}>
              <Settings size={20} />
              <span>Configurações</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link to="/perfil" className="user-info" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="user-avatar">{profile?.nome?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-email">{profile?.nome || user?.email?.split('@')[0]}</span>
              <span className="user-role" style={{ textTransform: 'capitalize' }}>{profile?.perfil || 'Analista'}</span>
            </div>
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar glass-panel-no-border">
          <h2 className="page-title">Painel Geral</h2>
        </header>
        
        <div className="content-area animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

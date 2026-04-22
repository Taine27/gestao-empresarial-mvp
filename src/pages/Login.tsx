import { useState } from 'react';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
    // TODO: Integração com Supabase Auth
  };

  return (
    <div className="login-container animate-fade-in">
      <Link to="/" className="back-link">
        <ArrowLeft size={20} /> Voltar
      </Link>
      
      <div className="glass-panel login-box">
        <div className="login-header">
          <div className="logo-small">SIGME</div>
          <h2>Acesse sua conta</h2>
          <p>Entre para gerenciar seus diagnósticos.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-mail Corporativo</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                id="email"
                placeholder="nome@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Lembrar de mim</span>
            </label>
            <a href="#" className="forgot-password">Esqueceu a senha?</a>
          </div>

          <button type="submit" className="btn-primary w-full">
            Entrar no Sistema
          </button>
        </form>
        
        <div className="login-footer">
          <p>Não tem uma conta? <a href="#">Fale com um consultor</a></p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 2rem;
        }

        .back-link {
          position: absolute;
          top: 2rem;
          left: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--text-main);
        }

        .login-box {
          width: 100%;
          max-width: 440px;
          padding: 3rem 2.5rem;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-small {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 1rem;
        }

        .login-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          cursor: pointer;
        }

        .forgot-password {
          color: var(--primary);
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-password:hover {
          color: var(--primary-hover);
        }

        .w-full {
          width: 100%;
          margin-top: 0.5rem;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .login-footer a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default Login;

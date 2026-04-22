import { useState } from 'react';
import { Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Conta criada com sucesso! Você já pode fazer login.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard'); // Rota do painel (será criada depois)
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <Link to="/" className="back-link">
        <ArrowLeft size={20} /> Voltar
      </Link>
      
      <div className="glass-panel login-box">
        <div className="login-header">
          <div className="logo-small">SIGME</div>
          <h2>{isSignUp ? 'Crie sua conta' : 'Acesse sua conta'}</h2>
          <p>{isSignUp ? 'Preencha os dados abaixo para se cadastrar.' : 'Entre para gerenciar seus diagnósticos.'}</p>
        </div>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={handleAuth} className="login-form">
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
                minLength={6}
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Lembrar de mim</span>
              </label>
              <a href="#" className="forgot-password">Esqueceu a senha?</a>
            </div>
          )}

          <button type="submit" className="btn-primary w-full flex-center" disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : (isSignUp ? 'Cadastrar' : 'Entrar no Sistema')}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button className="link-button" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Faça login' : 'Crie uma agora'}
            </button>
          </p>
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
          margin-bottom: 2rem;
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

        .alert {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          text-align: center;
        }

        .error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .success {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.2);
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
        
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .link-button {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
        }

        .link-button:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default Login;

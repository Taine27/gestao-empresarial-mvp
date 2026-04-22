import { ArrowRight, Activity, BarChart3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">SIGME</div>
          <div className="nav-links">
            <a href="#about">Metodologia</a>
            <a href="#features">Recursos</a>
            <Link to="/login" className="btn-outline">Login</Link>
          </div>
        </div>
      </nav>

      <main className="container hero-section animate-fade-in">
        <div className="hero-text">
          <div className="badge">MVP Version 1.0</div>
          <h1 className="hero-title">
            Gestão Organizacional <br />
            <span className="text-gradient">Orientada a Dados</span>
          </h1>
          <p className="hero-subtitle">
            Diagnóstico inteligente e prático para avaliar a maturidade da sua equipe. 
            Identifique gargalos estruturais e eleve os resultados do seu setor.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn-primary flex-center" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Iniciar Diagnóstico <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>

        <div className="hero-cards glass-panel">
          <div className="feature">
            <div className="icon-wrapper bg-blue"><Activity size={24} /></div>
            <div>
              <h3>Processos Ágeis</h3>
              <p>Identifique ruídos na operação diária.</p>
            </div>
          </div>
          <div className="feature">
            <div className="icon-wrapper bg-purple"><BarChart3 size={24} /></div>
            <div>
              <h3>Métricas Claras</h3>
              <p>Mensure o engajamento e a tecnologia.</p>
            </div>
          </div>
          <div className="feature">
            <div className="icon-wrapper bg-green"><ShieldCheck size={24} /></div>
            <div>
              <h3>Decisão Segura</h3>
              <p>Relatórios baseados na sua maturidade.</p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .navbar {
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--border);
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .nav-links a {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-links a:hover {
          color: var(--text-main);
        }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-main);
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .hero-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          padding-top: 6rem;
          align-items: center;
        }
        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary);
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .hero-title {
          font-size: 3.5rem;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -1px;
          margin-bottom: 1.5rem;
        }
        .text-gradient {
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          max-width: 480px;
        }
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ml-2 { margin-left: 0.5rem; }

        .hero-cards {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .feature {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .feature h3 {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }
        .feature p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .icon-wrapper {
          padding: 0.75rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
        .bg-purple { background: rgba(168, 85, 247, 0.1); color: #c084fc; }
        .bg-green { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
      `}</style>
    </div>
  );
}

export default Landing;

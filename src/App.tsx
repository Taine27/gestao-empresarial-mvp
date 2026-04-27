import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Setores from './pages/Setores';
import NovoSetor from './pages/NovoSetor';
import SetorDetalhe from './pages/SetorDetalhe';
import EditarSetor from './pages/EditarSetor';
import Diagnosticos from './pages/Diagnosticos';
import NovoDiagnostico from './pages/NovoDiagnostico';
import ResultadoDiagnostico from './pages/ResultadoDiagnostico';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import ConfiguracaoDiagnostico from './pages/ConfiguracaoDiagnostico';
import EditarTemplatePadrao from './pages/EditarTemplatePadrao';
import GestaoIndicadores from './pages/GestaoIndicadores';
import FormIndicador from './pages/FormIndicador';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setores" element={<Setores />} />
          <Route path="/setores/novo" element={<NovoSetor />} />
          <Route path="/setores/:id" element={<SetorDetalhe />} />
          <Route path="/setores/:id/editar" element={<EditarSetor />} />
          <Route path="/diagnosticos" element={<Diagnosticos />} />
          <Route path="/diagnostico/novo/:setorId" element={<NovoDiagnostico />} />
          <Route path="/diagnosticos/:id" element={<ResultadoDiagnostico />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracao-diagnostico" element={<ConfiguracaoDiagnostico />} />
          <Route path="/configuracao-diagnostico/padrao" element={<EditarTemplatePadrao />} />
          <Route path="/indicadores" element={<GestaoIndicadores />} />
          <Route path="/indicadores/novo" element={<FormIndicador />} />
          <Route path="/indicadores/:id/editar" element={<FormIndicador />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

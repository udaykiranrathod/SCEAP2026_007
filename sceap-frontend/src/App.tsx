import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CableSizing from './pages/CableSizing';
import TrayFill from './pages/TrayFill';
import { PathProvider } from './context/PathContext';

function App() {
  return (
    <Router>
      <PathProvider>
        <div className="flex h-screen bg-slate-950">
          <Sidebar />
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cable-sizing" element={<CableSizing />} />
              <Route path="/tray-fill" element={<TrayFill />} />
            </Routes>
          </Layout>
        </div>
      </PathProvider>
    </Router>
  );
}

export default App;
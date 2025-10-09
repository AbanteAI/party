import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import App from './App';
import Snake from './Snake';
import Stock from './Stock';
import Polls from './Polls';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/chat" element={<App />} />
      <Route path="/snake" element={<Snake />} />
      <Route path="/stock" element={<Stock />} />
      <Route path="/polls" element={<Polls />} />
    </Routes>
  );
}

export default Router;

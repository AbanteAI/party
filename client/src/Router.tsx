import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Chat from './Chat';
import StockTicker from './StockTicker';
import Polls from './Polls';
import Navigation from './Navigation';

function Router() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<Chat />} />
        <Route path="/stock" element={<StockTicker />} />
        <Route path="/polls" element={<Polls />} />
      </Routes>
    </>
  );
}

export default Router;

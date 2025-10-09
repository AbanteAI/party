import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import App from './App';
import Stock from './Stock';
import Polls from './Polls';
import Chat from './Chat';
import Navigation from './Navigation';

function Router() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<App />} />
        <Route path="/ai" element={<Chat />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/polls" element={<Polls />} />
      </Routes>
    </>
  );
}

export default Router;

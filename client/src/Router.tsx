import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Chat from './Chat';
import Navigation from './Navigation';

function Router() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<Chat />} />
      </Routes>
    </>
  );
}

export default Router;

import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Chat from './Chat';
import StockTicker from './StockTicker';
import Polls from './Polls';
import ImageFeed from './ImageFeed';
import Auth from './Auth';
import Navigation from './Navigation';

function Router() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('mentat-user');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('mentat-user');
    setCurrentUser(null);
  };

  if (showAuth) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <Navigation
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuth(true)}
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<Chat currentUser={currentUser} />} />
        <Route path="/stock" element={<StockTicker />} />
        <Route path="/polls" element={<Polls currentUser={currentUser} />} />
        <Route path="/feed" element={<ImageFeed currentUser={currentUser} />} />
      </Routes>
    </>
  );
}

export default Router;

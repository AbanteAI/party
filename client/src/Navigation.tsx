import { Link, useLocation } from 'react-router-dom';
import { Home, Bot, User } from 'lucide-react';

interface NavigationProps {
  currentUser: string | null;
  onLogout: () => void;
  onShowAuth: () => void;
}

export default function Navigation({
  currentUser,
  onLogout,
  onShowAuth,
}: NavigationProps) {
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/ai', label: 'AI Chat', icon: Bot },
  ];

  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '12px 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: isActive
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'transparent',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User info and auth */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {currentUser ? (
            <>
              <span
                style={{
                  color: 'white',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <User size={16} />
                {currentUser}
              </span>
              <button
                onClick={onLogout}
                style={{
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onShowAuth}
              style={{
                color: 'white',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

import { useEffect } from 'react';

function Snake() {
  useEffect(() => {
    // Set page title
    document.title = 'Snake Game 🐍';

    return () => {
      document.title = 'Mentat Party';
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#0f0c29',
      }}
    >
      <iframe
        src="/snake-game/"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        title="Snake Game"
      />
    </div>
  );
}

export default Snake;

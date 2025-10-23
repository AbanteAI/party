import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface SharedImage {
  id: string;
  prompt: string;
  creator: string;
  timestamp: number;
  likes: string[];
}

interface ImageFeedProps {
  currentUser: string | null;
}

export default function ImageFeed({ currentUser }: ImageFeedProps) {
  const [images, setImages] = useState<SharedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images');
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (imageId: string) => {
    if (!currentUser) {
      alert('Please log in to like images');
      return;
    }

    try {
      const response = await fetch(`/api/images/${imageId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser }),
      });

      if (response.ok) {
        // Update local state
        setImages(
          images.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  likes: img.likes.includes(currentUser)
                    ? img.likes.filter((u) => u !== currentUser)
                    : [...img.likes, currentUser],
                }
              : img
          )
        );
      }
    } catch (error) {
      console.error('Failed to like image:', error);
    }
  };

  const getImageUrl = (prompt: string) => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ fontSize: '24px', color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        padding: '40px 20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '40px' }}
      >
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          🖼️ Image Feed
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
          }}
        >
          Community shared AI-generated images
        </p>
      </div>

      {/* Images Grid */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px',
        }}
      >
        {images.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: 'white',
              fontSize: '18px',
              padding: '60px 20px',
            }}
          >
            No images shared yet. Be the first to share!
          </div>
        ) : (
          images.map((image) => (
            <div
              key={image.id}
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Image */}
              <img
                src={getImageUrl(image.prompt)}
                alt={image.prompt}
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover',
                }}
              />

              {/* Content */}
              <div style={{ padding: '20px' }}>
                {/* Prompt */}
                <p
                  style={{
                    fontSize: '14px',
                    color: '#1f2937',
                    marginBottom: '15px',
                    lineHeight: '1.5',
                  }}
                >
                  {image.prompt}
                </p>

                {/* Meta */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    by <strong>{image.creator}</strong>
                  </div>
                  <button
                    onClick={() => handleLike(image.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: image.likes.includes(currentUser || '')
                        ? '#ef4444'
                        : '#e5e7eb',
                      color: image.likes.includes(currentUser || '')
                        ? 'white'
                        : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Heart
                      size={16}
                      fill={
                        image.likes.includes(currentUser || '')
                          ? 'white'
                          : 'none'
                      }
                    />
                    {image.likes.length}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back Button */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '40px auto 0',
          textAlign: 'center',
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '15px 30px',
            borderRadius: '15px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

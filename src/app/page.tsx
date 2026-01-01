"use client";

import { useState, useEffect } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
};

type GenerateResponse = {
  playlistName: string;
  tracks: Track[];
};

type SpotifyUser = {
  id: string;
  display_name: string;
  email?: string;
  image?: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [vibes, setVibes] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  
  const [playlistName, setPlaylistName] = useState<string>("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check Spotify auth status on mount
  useEffect(() => {
    // Try to read user from cookie first for immediate display
    const userCookie = document.cookie
      .split("; ")
      .find(row => row.startsWith("spotify_user="));
    
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
        setSpotifyUser(userData);
      } catch (e) {
        console.error("Error parsing user cookie:", e);
      }
    }
    
    // Then verify with API
    checkSpotifyAuth();
    
    // Check for OAuth callback errors in URL
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(`Authentication error: ${errorParam}`);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function checkSpotifyAuth() {
    try {
      const res = await fetch("/api/spotify/user");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setSpotifyUser(data.user);
      } else {
        setSpotifyUser(null);
      }
    } catch (e) {
      console.error("Error checking auth:", e);
      setSpotifyUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }

  function handleLogin() {
    // Redirect to Spotify OAuth
    window.location.href = `/api/spotify/auth?callback=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }

  async function handleLogout() {
    try {
      await fetch("/api/spotify/logout", { method: "POST" });
      setSpotifyUser(null);
      // Also clear the cookie on client side
      document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch (e) {
      console.error("Error logging out:", e);
      // Clear user state anyway
      setSpotifyUser(null);
    }
  }

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setPlaylistUrl("");
    setPlaylistName("");
    setTracks([]);
    setVibes([]);
    setDescription("");

    const planRes = await fetch("/api/ai/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const plan = await planRes.json();
    if (!planRes.ok) throw new Error(plan?.error ?? "AI plan failed");
    
    setPlaylistName(plan.playlistName);
    setVibes(plan.vibes ?? []);
    setDescription(plan.description ?? "");
    
    try {
      const res = await fetch("/api/mock/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await res.json()) as GenerateResponse | { error?: string };
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Request failed");

      const parsed = data as GenerateResponse;
      setTracks(parsed.tracks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onCreatePlaylist() {
    // Require Spotify login to create playlist
    if (!spotifyUser) {
      setError("Please log in with Spotify to create a playlist");
      return;
    }

    setCreating(true);
    setError(null);
    setPlaylistUrl("");

    try {
      const res = await fetch("/api/mock/create-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistName, tracks }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Create failed");

      setPlaylistUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  // Generate subtle particle elements (fewer, less visible)
  const particles = Array.from({ length: 12 }).map((_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${15 + Math.random() * 15}s`,
        '--tx': `${-50 + Math.random() * 100}px`
      } as React.CSSProperties & { '--tx': string }}
    />
  ));

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0a0a0a",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Subtle dark background elements with minimal green */}
      <div style={{
        position: "absolute",
        top: "-40%",
        left: "-20%",
        width: "1000px",
        height: "1000px",
        background: "radial-gradient(circle, rgba(0, 66, 37, 0.08) 0%, transparent 70%)",
        animation: "morph 40s ease-in-out infinite",
        pointerEvents: "none",
        filter: "blur(100px)"
      }} />
      <div style={{
        position: "absolute",
        top: "30%",
        right: "-15%",
        width: "800px",
        height: "800px",
        background: "radial-gradient(circle, rgba(205, 127, 50, 0.06) 0%, transparent 70%)",
        animation: "morph 50s ease-in-out infinite reverse",
        pointerEvents: "none",
        filter: "blur(120px)"
      }} />
      
      {/* Subtle floating particles */}
      {particles}

      <main style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: "40px 24px",
        position: "relative",
        zIndex: 1
      }}>
        {/* Header with Login */}
        <div style={{ marginBottom: 48, textAlign: "center", position: "relative" }}>
          {/* Login/User section in top right */}
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            {!checkingAuth && (
              spotifyUser ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 16px",
                  background: "rgba(20, 20, 20, 0.9)",
                  borderRadius: 50,
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}>
                  {spotifyUser.image && (
                    <img
                      src={spotifyUser.image}
                      alt={spotifyUser.display_name}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "2px solid #CD7F32",
                        boxShadow: "0 0 8px rgba(205, 127, 50, 0.3)"
                      }}
                    />
                  )}
                  <span style={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    {spotifyUser.display_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "1px solid rgba(205, 127, 50, 0.3)",
                      background: "rgba(205, 127, 50, 0.1)",
                      color: "#CD7F32",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(205, 127, 50, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.5)";
                      e.currentTarget.style.color = "#E6A857";
                      e.currentTarget.style.boxShadow = "0 0 15px rgba(205, 127, 50, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(205, 127, 50, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.3)";
                      e.currentTarget.style.color = "#CD7F32";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderRadius: 50,
                    border: "1px solid rgba(205, 127, 50, 0.3)",
                    background: "rgba(20, 20, 20, 0.8)",
                    color: "#CD7F32",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(205, 127, 50, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.5)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(205, 127, 50, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(20, 20, 20, 0.8)";
                    e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.3)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Log in with Spotify
                </button>
              )
            )}
          </div>

          <h1 style={{ 
            fontSize: "clamp(42px, 7vw, 72px)", 
            fontWeight: 900, 
            marginBottom: 16,
            background: "linear-gradient(135deg, #ffffff 0%, #CD7F32 50%, #ffffff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.03em",
            animation: "slide-in 0.8s ease-out"
          }}>
            AI Playlist Builder
          </h1>
          <p style={{ 
            fontSize: 20, 
            color: "#888888", 
            marginBottom: 12,
            fontWeight: 400,
            letterSpacing: "0.02em"
          }}>
            Transform your vibe into curated music
          </p>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "#CD7F32",
            padding: "8px 16px",
            background: "rgba(20, 20, 20, 0.8)",
            borderRadius: 25,
            border: "1px solid rgba(205, 127, 50, 0.2)",
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#CD7F32",
              opacity: 0.8
            }} />
            Mock Mode
          </div>
        </div>

        {/* Input Card */}
        <div style={{
          background: "rgba(15, 15, 15, 0.8)",
          backdropFilter: "blur(30px)",
          borderRadius: 24,
          padding: 40,
          marginBottom: 40,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
          animation: "slide-in 0.6s ease-out 0.2s backwards",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Very subtle accent border */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(205, 127, 50, 0.3), transparent)"
          }} />
          
          <div style={{ display: "flex", gap: 20, alignItems: "stretch", position: "relative", zIndex: 1 }}>
            <div style={{ flex: 1, position: "relative" }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && prompt.trim() && onGenerate()}
                placeholder='Describe your vibe... e.g. "late-night coding, chill electronic, minimal vocals"'
                disabled={loading}
          style={{
                  width: "100%",
                  padding: "20px 28px",
                  borderRadius: 16,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(10, 10, 10, 0.6)",
                  color: "#ffffff",
                  fontSize: 16,
                  fontFamily: "inherit",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5)"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(205, 127, 50, 0.5)";
                  e.target.style.background = "rgba(15, 15, 15, 0.8)";
                  e.target.style.boxShadow = "inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(205, 127, 50, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.background = "rgba(10, 10, 10, 0.6)";
                  e.target.style.boxShadow = "inset 0 2px 10px rgba(0, 0, 0, 0.5)";
                }}
              />
            </div>
        <button
          onClick={onGenerate}
          disabled={loading || prompt.trim().length === 0}
          style={{
                padding: "20px 36px",
                borderRadius: 16,
                border: "1px solid rgba(205, 127, 50, 0.3)",
                background: loading 
                  ? "rgba(205, 127, 50, 0.1)" 
                  : "rgba(205, 127, 50, 0.15)",
                color: loading ? "#666" : "#CD7F32",
            cursor: loading ? "not-allowed" : "pointer",
                minWidth: 180,
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "0.5px",
                transition: "all 0.3s ease",
                boxShadow: loading ? "none" : "0 4px 20px rgba(205, 127, 50, 0.15)",
                transform: loading ? "scale(1)" : "scale(1)",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (!loading && prompt.trim()) {
                  e.currentTarget.style.background = "rgba(205, 127, 50, 0.25)";
                  e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.5)";
                  e.currentTarget.style.boxShadow = "0 6px 25px rgba(205, 127, 50, 0.25)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "rgba(205, 127, 50, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.3)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(205, 127, 50, 0.15)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <span style={{
                    width: 18,
                    height: 18,
                    border: "3px solid #888",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block"
                  }} />
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
        </button>
          </div>
      </div>

      {error && (
          <div style={{
            marginBottom: 24,
            padding: "16px 24px",
            background: "rgba(255, 59, 48, 0.15)",
            border: "1px solid rgba(255, 59, 48, 0.3)",
            borderRadius: 12,
            color: "#ff6b6b"
          }}>
          <strong>Error:</strong> {error}
        </div>
      )}

        {/* Playlist Card */}
        {(playlistName || tracks.length > 0) && (
          <div style={{
            background: "rgba(15, 15, 15, 0.8)",
            backdropFilter: "blur(30px)",
            borderRadius: 24,
            padding: 48,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            animation: "slide-in 0.8s ease-out",
            position: "relative"
          }}>
            {/* Subtle top accent line */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(0, 66, 37, 0.4), rgba(205, 127, 50, 0.4), transparent)"
            }} />
            {/* Playlist Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 24,
              marginBottom: 32,
              flexWrap: "wrap"
            }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "#888888",
                  marginBottom: 12,
                  fontWeight: 700
                }}>
                  Playlist
                </div>
                <h2 style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  margin: "0 0 16px 0",
                  background: "linear-gradient(135deg, #ffffff 0%, #CD7F32 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.2
                }}>
                  {playlistName}
                </h2>
                {description && (
                  <div style={{
                    marginTop: 16,
                    color: "#888888",
                    fontSize: 17,
                    lineHeight: 1.7,
                    maxWidth: "85%"
                  }}>
                    {description}
                  </div>
                )}

                {vibes.length > 0 && (
                  <div style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 20
                  }}>
                    {vibes.map((v) => (
                      <span
                        key={v}
                        style={{
                          fontSize: 13,
                          padding: "8px 16px",
                          borderRadius: 20,
                          border: "1px solid rgba(205, 127, 50, 0.25)",
                          background: "rgba(205, 127, 50, 0.08)",
                          color: "#CD7F32",
                          fontWeight: 600,
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(205, 127, 50, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.4)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(205, 127, 50, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(205, 127, 50, 0.08)";
                          e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.25)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            <button
              onClick={onCreatePlaylist}
                disabled={creating || tracks.length === 0 || !spotifyUser}
              style={{
                  padding: "14px 28px",
                  borderRadius: 50,
                  border: "1px solid rgba(205, 127, 50, 0.3)",
                  background: creating || tracks.length === 0 || !spotifyUser
                    ? "rgba(205, 127, 50, 0.1)"
                    : "rgba(205, 127, 50, 0.15)",
                  color: creating || tracks.length === 0 || !spotifyUser ? "#666" : "#CD7F32",
                  cursor: creating || tracks.length === 0 || !spotifyUser ? "not-allowed" : "pointer",
                  minWidth: 200,
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                  boxShadow: creating || tracks.length === 0 || !spotifyUser
                    ? "none"
                    : "0 4px 20px rgba(205, 127, 50, 0.15)",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  if (!creating && tracks.length > 0 && spotifyUser) {
                    e.currentTarget.style.background = "rgba(205, 127, 50, 0.25)";
                    e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.5)";
                    e.currentTarget.style.boxShadow = "0 6px 25px rgba(205, 127, 50, 0.25)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating) {
                    e.currentTarget.style.background = "rgba(205, 127, 50, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.3)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(205, 127, 50, 0.15)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
                title={!spotifyUser ? "Log in with Spotify to create playlists" : undefined}
              >
                {creating ? "Creating..." : !spotifyUser ? "Login to Create" : "Create Playlist"}
            </button>
          </div>

            {/* Tracks List */}
            {tracks.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "#888888",
                  marginBottom: 16,
                  fontWeight: 600
                }}>
                  Tracks ({tracks.length})
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}>
                  {tracks.map((t, index) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "12px 16px",
                        borderRadius: 8,
                        background: "transparent",
                        transition: "all 0.2s ease",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                        e.currentTarget.style.borderLeft = "2px solid rgba(205, 127, 50, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderLeft = "none";
                      }}
                    >
                      <div style={{
                        minWidth: 32,
                        fontSize: 16,
                        color: "#666666",
                        fontWeight: 500,
                        textAlign: "right"
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 500,
                          marginBottom: 4
                        }}>
                          {t.title}
                        </div>
                        <div style={{
                          color: "#CD7F32",
                          fontSize: 14
                        }}>
                          {t.artist}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
          {playlistUrl && (
              <div style={{
                marginTop: 32,
                padding: "20px 24px",
                background: "rgba(15, 15, 15, 0.9)",
                border: "1px solid rgba(205, 127, 50, 0.3)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16
              }}>
                <div>
                  <div style={{
                    fontSize: 14,
                    color: "#1ed760",
                    fontWeight: 600,
                    marginBottom: 4
                  }}>
                    Playlist Created Successfully!
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: "#b3b3b3"
                  }}>
                    Your playlist is ready to play
                  </div>
                </div>
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 50,
                    border: "1px solid rgba(205, 127, 50, 0.3)",
                    background: "rgba(205, 127, 50, 0.15)",
                    color: "#CD7F32",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(205, 127, 50, 0.2)";
                    e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.5)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(205, 127, 50, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(205, 127, 50, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(205, 127, 50, 0.3)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Open in Spotify →
              </a>
            </div>
          )}
        </div>
      )}
    </main>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>
    </div>
  );
}
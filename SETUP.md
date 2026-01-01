# Spotify Integration Setup

This app uses Spotify OAuth to authenticate users and create playlists in their Spotify accounts.

## Environment Variables

When Spotify's API is available again, you'll need to add these environment variables:

```env
# Spotify OAuth credentials (get from https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# OAuth redirect URI (should match your Spotify app settings)
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback

# Base URL for your app (optional, defaults to localhost:3000)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OpenAI API key (already required for AI playlist planning)
OPENAI_API_KEY=your_openai_key_here
```

## Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/spotify/callback` (and your production URL if applicable)
4. Copy the Client ID and Client Secret to your `.env.local` file

## How It Works

- **Login is optional**: Users can browse and generate playlists without logging in
- **Login is required**: To create playlists in Spotify, users must authenticate
- **OAuth Flow**: Uses standard Spotify OAuth 2.0 Authorization Code flow
- **Token Storage**: Access tokens stored in httpOnly cookies for security
- **User Data**: User profile (name, image) stored in cookies for UI display

## Current Status

The app is currently in **Mock Mode** - it uses fake/sample tracks. Once you have Spotify API credentials, you can:
1. Update `/api/mock/generate` to use real Spotify search API
2. Update `/api/mock/create-playlist` to create real playlists via Spotify API
3. Remove the "Mock Mode" indicator from the UI

## Features

- ✅ Optional Spotify login
- ✅ User profile display when logged in
- ✅ Login required for playlist creation
- ✅ Secure token storage (httpOnly cookies)
- ✅ Ready for real Spotify API integration


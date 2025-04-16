// api/youtube-search.js

// Use dynamic import for node-fetch if using CommonJS (typical for simple Vercel functions)
// If using ES Modules, use standard import: import fetch from 'node-fetch';
// However, Vercel's runtime often includes a global fetch, so explicit import might not be needed.

export default async function handler(request, response) {
    // Get API key from environment variables (set in Vercel dashboard)
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
        return response.status(500).json({ error: 'YouTube API key is not configured.' });
    }

    // Get the artist query parameter from the request URL
    const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
    const artist = searchParams.get('artist');

    if (!artist) {
        return response.status(400).json({ error: 'Missing artist query parameter.' });
    }

    // Construct the search query and API URL
    const searchQuery = `${decodeURIComponent(artist)} karaoke`; // Decode artist name just in case
    const YOUTUBE_API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&key=${YOUTUBE_API_KEY}&maxResults=15&q=${encodeURIComponent(searchQuery)}`;

    try {
        console.log(`Fetching YouTube for: ${searchQuery}`); // Log server-side
        const youtubeResponse = await fetch(YOUTUBE_API_URL);

        if (!youtubeResponse.ok) {
            const errorText = await youtubeResponse.text();
            console.error('YouTube API Error:', youtubeResponse.status, errorText);
            return response.status(youtubeResponse.status).json({ error: `YouTube API Error: ${youtubeResponse.statusText}` });
        }

        const data = await youtubeResponse.json();

        // Return only the necessary data to the frontend
        const videos = (data.items || []).map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title
        }));

        // Set CORS headers - Adjust origin in production if needed
        response.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin (adjust for production)
        response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Send the processed video data back
        return response.status(200).json({ videos });

    } catch (error) {
        console.error('Error in youtube-search handler:', error);
        return response.status(500).json({ error: 'Internal server error fetching YouTube data.' });
    }
} 
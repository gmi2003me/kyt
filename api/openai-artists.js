// api/openai-artists.js

export default async function handler(request, response) {
    // Allow CORS from any origin (adjust for production)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
    }

    // Get API key from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return response.status(500).json({ error: 'OpenAI API key is not configured.' });
    }

    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    try {
        // Parse the request body to get the prompt
        const { prompt } = request.body;

        if (!prompt) {
            return response.status(400).json({ error: 'Missing prompt in request body.' });
        }

        console.log(`Fetching OpenAI for prompt: "${prompt.substring(0, 50)}..."`); // Log server-side

        const openaiResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                max_tokens: 150
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('OpenAI API Error Data:', errorData);
            return response.status(openaiResponse.status).json({ error: `OpenAI API Error: ${openaiResponse.statusText}` });
        }

        const data = await openaiResponse.json();

        if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
            console.error('Invalid OpenAI response format:', data);
            return response.status(500).json({ error: 'Invalid response format from OpenAI API.' });
        }

        const artistsText = data.choices[0].message.content.trim();

        // Send the raw artists text back
        return response.status(200).json({ artistsText });

    } catch (error) {
        console.error('Error in openai-artists handler:', error);
        // Handle potential JSON parsing errors in the request body
        if (error instanceof SyntaxError) {
             return response.status(400).json({ error: 'Invalid JSON in request body.' });
        }
        return response.status(500).json({ error: 'Internal server error fetching OpenAI data.' });
    }
} 
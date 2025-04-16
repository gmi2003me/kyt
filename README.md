# Karaoke Fun Web App

## Description

A simple, responsive web application that allows users to search for karaoke videos of artists or bands on YouTube and play them directly on the page. It also suggests related artists based on the user's search.

## Features

*   **Artist/Band Search:** Search for karaoke videos by artist or band name.
*   **YouTube Integration:** Fetches and displays karaoke video results from the YouTube Data API v3.
*   **External Playback:** Opens selected YouTube videos in a new browser tab.
*   **Related Artists:** Suggests 10 related artists using the OpenAI API based on the current search.
*   **Responsive Design:** Basic responsive layout that adapts to different screen sizes.

## Tech Stack

*   HTML5
*   CSS3 (Flexbox for layout)
*   Vanilla JavaScript (ES6+)
*   YouTube Data API v3 (via Serverless Function)
*   OpenAI API (gpt-3.5-turbo or similar model, via Serverless Function)
*   Vercel Serverless Functions (Node.js runtime)

### YouTube Data API Usage Details

This application utilizes the `search.list` endpoint of the YouTube Data API v3 via a Vercel Serverless Function (`/api/youtube-search.js`) to find relevant karaoke videos.

1.  **Trigger:** When the user enters an artist or band name and clicks "Search", the `handleSearch` function in `script.js` is called.
2.  **Frontend API Call:** Inside `handleSearch`, the `fetchYoutubeVideos(artist)` function is invoked. This function makes a `fetch` request to the application's own backend endpoint: `/api/youtube-search?artist={artistName}`.
3.  **Serverless Function Execution (`/api/youtube-search.js`):**
    *   The serverless function receives the request.
    *   It retrieves the `YOUTUBE_API_KEY` securely from Vercel Environment Variables (`process.env.YOUTUBE_API_KEY`).
    *   It extracts the `artist` query parameter.
    *   It constructs the search query string: `` `${artist} karaoke` ``.
    *   It builds the full YouTube Data API request URL using the API key and query.
    *   It makes a `fetch` request to the *actual* YouTube Data API (`https://www.googleapis.com/youtube/v3/search?...`).
    *   It processes the response from YouTube, extracting relevant video data (ID and title).
    *   It sends a JSON response containing the `{ videos: [...] }` array back to the frontend.
4.  **Frontend Response Processing:**
    *   The `fetchYoutubeVideos` function receives the JSON response from the serverless function.
    *   The `displayYoutubeResults` function is called with the `data.videos` array.
5.  **Displaying Results & User Interaction:**
    *   `displayYoutubeResults` iterates through the `videos` array.
    *   For each item, it extracts the video title from `item.snippet.title` and the video ID from `item.id.videoId`.
    *   It creates a list item (`<li>`) containing a link (`<a>`). The link text is the video title, and the `data-videoId` attribute stores the video ID.
    *   When a user clicks on one of these generated video links, the `handleVideoClick` function uses the stored `data-videoId` to construct a standard YouTube watch URL (`https://www.youtube.com/watch?v=VIDEO_ID`) and opens it in a new browser tab using `window.open()`.

### OpenAI API Usage Details

Similar to the YouTube integration, OpenAI API calls are handled via a Vercel Serverless Function (`/api/openai-artists.js`) to keep the API key secure.

1.  **Trigger:** Calls are made either during the initial page load (`initializeApp`) for genre lists or when a user search triggers `fetchRelatedArtists`.
2.  **Frontend API Call:** The `fetchArtistsFromBackend(prompt, listElement, displayFn)` function is called. This function makes a `fetch` request with the `POST` method to the application's backend endpoint: `/api/openai-artists`.
    *   The request body contains a JSON object with the specific `prompt` (e.g., `{ "prompt": "Give me a list of..." }`).
3.  **Serverless Function Execution (`/api/openai-artists.js`):**
    *   The serverless function receives the POST request.
    *   It retrieves the `OPENAI_API_KEY` securely from Vercel Environment Variables (`process.env.OPENAI_API_KEY`).
    *   It parses the request body to get the `prompt`.
    *   It makes a `fetch` request with the `POST` method to the *actual* OpenAI Chat Completions API (`https://api.openai.com/v1/chat/completions`).
    *   It sends the prompt within the required JSON structure for the OpenAI API.
    *   It processes the response from OpenAI, extracting the text content containing the artist list.
    *   It sends a JSON response containing `{ artistsText: "..." }` back to the frontend.
4.  **Frontend Response Processing:**
    *   The `fetchArtistsFromBackend` function receives the JSON response.
    *   It calls the `displayArtistList` function with the `data.artistsText`.
5.  **Displaying Results:** `displayArtistList` parses the comma-separated string, creates the links, and populates the appropriate list (`relatedList`, `male80sList`, or `female80sList`).

## Setup Instructions

1.  **Clone or Download:** Get the project files (`index.html`, `style.css`, `script.js`).
2.  **API Keys:** You need API keys from Google Cloud Platform and OpenAI.
    *   **YouTube Data API v3 Key:**
        *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
        *   Create a new project or select an existing one.
        *   Navigate to "APIs & Services" > "Library".
        *   Search for and enable the "YouTube Data API v3".
        *   Navigate to "APIs & Services" > "Credentials".
        *   Create an API key.
        *   **Important:** Restrict your API key to prevent unauthorized use (e.g., by HTTP referrers if deploying to a specific domain).
    *   **OpenAI API Key:**
        *   Sign up or log in at [OpenAI](https://platform.openai.com/).
        *   Navigate to the API keys section.
        *   Create a new secret key.
3.  **Configure `script.js`:**
    *   Open the `script.js` file.
    *   Find the lines:
        ```javascript
        const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY';
        const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';
        ```
    *   Replace `'YOUR_YOUTUBE_API_KEY'` and `'YOUR_OPENAI_API_KEY'` with the keys you obtained in the previous step.

    *   **🚨 Security Warning:** Embedding API keys directly in client-side JavaScript is **not recommended for production environments** as they can be easily exposed. See the Deployment section for best practices.

## Running Locally

1.  Ensure you have completed the Setup Instructions (especially adding API keys).
2.  Open the `index.html` file directly in your web browser (e.g., Chrome, Firefox, Safari).

## Deployment (Vercel Example)

This app is simple enough to be deployed as static files on platforms like Vercel.

1.  **Push to Git:** Push your project code (including `index.html`, `style.css`, `script.js`) to a Git repository (e.g., GitHub, GitLab).
2.  **Import to Vercel:** Import your Git repository into Vercel.
3.  **Configure Environment Variables (Recommended for Security):**
    *   Instead of hardcoding API keys in `script.js`, use Vercel Environment Variables.
    *   In your Vercel project settings, add environment variables named `VITE_YOUTUBE_API_KEY` and `VITE_OPENAI_API_KEY` (or similar, Vercel often exposes variables prefixed with `VITE_` to the client-side build, although this is **still not the most secure method** for the OpenAI key).
    *   **Better Security:** For the OpenAI API key (and potentially the YouTube key to prevent quota abuse), create Vercel Serverless Functions (e.g., in an `/api` directory) that act as proxies. Your frontend JavaScript would call these serverless functions instead of calling the OpenAI/YouTube APIs directly. The serverless functions would securely use the environment variables on the backend.
4.  **Deploy:** Vercel will automatically build and deploy your site.

## File Structure

*   `index.html`: The main HTML structure of the web page.
*   `style.css`: Contains all the CSS rules for styling and layout.
*   `script.js`: Handles user interactions, API calls (YouTube, OpenAI), dynamic content updates, and YouTube player control.
*   `README.md`: This file - provides information about the project. # kyt

// --- Configuration ---
// !! IMPORTANT: Replace with your actual API keys !!

// const YOUTUBE_API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&key=${YOUTUBE_API_KEY}&maxResults=15&q=`; // Max 15 results
// const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'; // Using Chat endpoint

// --- DOM Elements ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsTitle = document.getElementById('results-title');
const resultsList = document.getElementById('results-list');
const relatedTitle = document.getElementById('related-title'); // Get related title h2
const relatedList = document.getElementById('related-list');
const male80sList = document.getElementById('male-80s-list'); // New list
const female80sList = document.getElementById('female-80s-list'); // New list
const artists80sList = document.getElementById('artists-80s-list'); // New list
const artists90sList = document.getElementById('artists-90s-list'); // New list

// --- Event Listeners ---
searchForm.addEventListener('submit', handleSearch);
resultsList.addEventListener('click', handleVideoClick);
relatedList.addEventListener('click', handleRelatedArtistClick);
male80sList.addEventListener('click', handleRelatedArtistClick); // Reuse handler
female80sList.addEventListener('click', handleRelatedArtistClick); // Reuse handler
artists80sList.addEventListener('click', handleRelatedArtistClick); // Reuse handler
artists90sList.addEventListener('click', handleRelatedArtistClick); // Reuse handler

// --- Generic Functions ---

/**
 * Displays a list of artists (from comma-separated text) in a target UL element.
 * @param {string} artistsText - Comma-separated string of artist names.
 * @param {HTMLElement} targetListElement - The UL element to populate.
 */
function displayArtistList(artistsText, targetListElement) {
    targetListElement.innerHTML = ''; // Clear previous results or loading message

    if (artistsText === null || artistsText === undefined) {
         targetListElement.innerHTML = '<li>Could not fetch artists.</li>';
         console.error("displayArtistList called with null/undefined artistsText");
         return;
    }

    // Split by comma, trim whitespace, THEN remove leading numbers, and filter empty
    const artistNames = artistsText.split(',')
                                 .map(name => name.trim().replace(/^\d+[\.\)]?\s*/, '')) // Trim first, then remove numbers (optional . or ) )
                                 .filter(name => name);

    if (artistNames.length === 0) {
        targetListElement.innerHTML = '<li>No artists found.</li>';
        return;
    }

    artistNames.forEach(name => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#'; // Prevent page jump
        a.textContent = name;
        a.dataset.artistName = name; // Store artist name for click handler
        li.appendChild(a);
        targetListElement.appendChild(li); // Append each li to the ul
    });
}

/**
 * Fetches a list of artists from our backend API endpoint and displays it.
 * @param {string} prompt - The prompt to send to the backend.
 * @param {HTMLElement} listElement - The UL element to update.
 * @param {function} displayFn - The function to call to display the results (e.g., displayArtistList).
 */
async function fetchArtistsFromBackend(prompt, listElement, displayFn) {
    listElement.innerHTML = '<li>Loading artists...</li>';

    try {
        // Call our backend API endpoint
        const response = await fetch('/api/openai-artists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }) // Send prompt in the body
        });

        if (!response.ok) {
             // Try to get error message from backend response
             let errorMsg = `Error ${response.status} fetching artists.`;
             try {
                 const errorData = await response.json();
                 errorMsg = errorData.error || errorMsg;
             } catch (e) { /* Ignore if response is not JSON */ }
             console.error("Backend API Error:", errorMsg);
             listElement.innerHTML = `<li>${errorMsg}. Check console.</li>`;
            throw new Error(errorMsg);
        }

        const data = await response.json();
        // Call the provided display function with the artistsText from the response
        displayFn(data.artistsText, listElement);

    } catch (error) {
        console.error(`Error fetching artists via backend for prompt "${prompt.substring(0,50)}...":`, error);
        if (listElement.innerHTML.includes('Loading')) {
            // Use error message from the caught error if available
             listElement.innerHTML = `<li>Error fetching artists: ${error.message || 'Unknown error'}. Check console.</li>`;
        }
    }
}


// --- Specific Fetch Functions ---

async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    resultsTitle.textContent = `Songs by ${query}`;
    relatedTitle.textContent = `Artists related to ${query}`;
    resultsList.innerHTML = '<li>Loading songs...</li>';
    relatedList.innerHTML = '<li>Loading related artists...</li>'; // Keep this loading message

    try {
        // Fetch songs and related artists for the searched query
        await Promise.all([
            fetchYoutubeVideos(query),
            fetchRelatedArtists(query) // Will call the generic fetcher
        ]);
    } catch (error) {
        console.error("Error during search:", error);
        // Error messages are handled within the fetch functions now
    }
}

async function fetchYoutubeVideos(artist) {
    resultsList.innerHTML = '<li>Loading songs...</li>'; // Set loading message here
    const url = `/api/youtube-search?artist=${encodeURIComponent(artist)}`; // Use our backend endpoint

    try {
        const response = await fetch(url);
        if (!response.ok) {
             let errorMsg = `Error ${response.status} fetching videos.`;
             try {
                 const errorData = await response.json();
                 errorMsg = errorData.error || errorMsg;
             } catch (e) { /* Ignore if response is not JSON */ }
             console.error("Backend API Error:", errorMsg);
            resultsList.innerHTML = `<li>${errorMsg} Check console.</li>`;
            throw new Error(errorMsg);
        }
        const data = await response.json();
        // Pass the data.videos array from our backend response
        displayYoutubeResults(data.videos || []);
    } catch (error) {
        console.error("Error fetching YouTube videos via backend:", error);
         if (resultsList.innerHTML.includes('Loading')) {
            resultsList.innerHTML = `<li>Error fetching videos: ${error.message || 'Unknown error'}. Check console.</li>`;
         }
    }
}

function displayYoutubeResults(videos) {
    resultsList.innerHTML = '';
    if (!videos || videos.length === 0) {
        resultsList.innerHTML = '<li>No karaoke videos found.</li>';
        return;
    }

    videos.forEach(video => { // video object now directly contains videoId and title
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = video.title; // Use title directly
        a.dataset.videoId = video.videoId; // Use videoId directly
        li.appendChild(a);
        resultsList.appendChild(li);
    });
}

async function fetchRelatedArtists(artist) {
    const prompt = `List exactly 20 artists or bands most similar to ${artist}. Provide ONLY the names, separated by a single comma and a space (e.g., Artist 1, Artist 2, Artist 3). Do NOT use numbering or any other formatting.`;
    // Use the generic fetch function pointed at our backend
    await fetchArtistsFromBackend(prompt, relatedList, displayArtistList);
}

// Updated function to use the generic backend fetcher
async function fetchMale80sArtists() {
    const prompt = "Give me a list of the top 20 artists of the genre: male 80's r&b. Give me just the artist names, separated by comma.";
    await fetchArtistsFromBackend(prompt, male80sList, displayArtistList);
}

// Updated function to use the generic backend fetcher
async function fetchFemale80sArtists() {
    const prompt = "Give me a list of the top 20 artists of the genre: female 80's r&b. Give me just the artist names, separated by comma.";
    await fetchArtistsFromBackend(prompt, female80sList, displayArtistList);
}

// Function to fetch 80s artists
async function fetch80sArtists() {
    const prompt = "Give me a random list of 20 popular music artists and bands from the 80s. Gime me ONLY the name, separated by comma.";
    await fetchArtistsFromBackend(prompt, artists80sList, displayArtistList);
}

// Function to fetch 90s artists
async function fetch90sArtists() {
    const prompt = "Give me a random list of 20 popular music artists and bands from the 90s. Gime me ONLY the name, separated by comma";
    await fetchArtistsFromBackend(prompt, artists90sList, displayArtistList);
}

// --- Click Handlers ---

function handleVideoClick(event) {
    event.preventDefault();
    if (event.target.tagName === 'A' && event.target.dataset.videoId) {
        const videoId = event.target.dataset.videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        window.open(videoUrl, '_blank');
    }
}

// This handler is now used for related artists AND the new genre lists
function handleRelatedArtistClick(event) {
    event.preventDefault();
    if (event.target.tagName === 'A' && event.target.dataset.artistName) {
        const artistName = event.target.dataset.artistName;
        searchInput.value = artistName;
        // Trigger a new search
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        searchForm.dispatchEvent(submitEvent);
        // Optional: Scroll search into view
        searchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// --- Initial Setup ---
function initializeApp() {
    // Set initial titles
    resultsTitle.textContent = 'Search Results';
    relatedTitle.textContent = 'Related Artists';
    // Set initial list content
    resultsList.innerHTML = '<li>Search for an artist to see karaoke songs.</li>';
    relatedList.innerHTML = '<li>Related artists will appear after a search.</li>';

    // Fetch initial genre lists immediately on load
    fetchMale80sArtists();
    fetchFemale80sArtists();
    fetch80sArtists(); // Add call for 80s artists
    fetch90sArtists(); // Add call for 90s artists
}

initializeApp(); // Call the setup function 
// --- Global Data Arrays & DOM Elements ---
let quotes = []; // Main array to store all quote objects
let filteredQuotes = []; // Stores quotes after applying category filter

// --- DOM Element References ---
// Get references to all necessary HTML elements by their IDs
const quoteDisplayDiv = document.getElementById('quoteDisplay');
const quoteAuthorDiv = document.getElementById('quoteAuthor');
const newQuoteButton = document.getElementById('newQuoteBtn');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const addQuoteButton = document.getElementById('addQuoteBtn');
const categoryFilterSelect = document.getElementById('categoryFilter');
const importFileInput = document.getElementById('importFile');
const exportQuotesButton = document.getElementById('exportQuotesBtn');
const lastViewedQuoteDisplay = document.getElementById('lastViewedQuoteDisplay');
const notificationDisplay = document.getElementById('notificationDisplay');

// Default quotes to seed the application if no other data is available
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration", author: "Steve Jobs" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Motivation", author: "Albert Einstein" },
    { text: "The mind is everything. What you think you become.", category: "Mindset", author: "Buddha" },
    { text: "An unexamined life is not worth living.", category: "Philosophy", author: "Socrates" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Business", author: "Steve Jobs" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams", author: "Eleanor Roosevelt" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Motivation", author: "Nelson Mandela" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Inspiration", author: "Aristotle" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life", author: "John Lennon" }
];

// --- Mock Server Configuration ---
// JSONPlaceholder provides a free fake API for testing and prototyping.
// IMPORTANT: Data posted here is NOT persistent and will not be saved across sessions.
// This is purely for simulating network requests and responses.
const JSONPLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com/posts';

// --- Utility Functions: Notifications & Session Storage for Last Viewed Quote ---

/**
 * Displays a temporary notification message to the user.
 * The notification will automatically hide after 5 seconds.
 * @param {string} message - The text message to display.
 * @param {string} type - The type of message ('success', 'info', or 'error') for styling.
 */
function displayNotification(message, type) {
    notificationDisplay.textContent = message;
    notificationDisplay.className = 'notification'; // Reset existing classes
    notificationDisplay.classList.add(type); // Add the specific type class
    notificationDisplay.style.display = 'block'; // Make the notification visible

    // Set a timeout to hide the notification after 5 seconds
    setTimeout(() => {
        notificationDisplay.style.display = 'none';
    }, 5000);
}

/**
 * Saves the currently displayed quote to the browser's sessionStorage.
 * This data persists only for the duration of the browser tab/window session.
 * @param {object} quote - The quote object to be saved.
 */
function saveLastViewedQuote(quote) {
    try {
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
        // Update the UI element that shows the last viewed quote
        lastViewedQuoteDisplay.textContent = `Last viewed: "${quote.text}" - ${quote.author || quote.category}`;
        console.log("Last viewed quote saved to session storage.");
    } catch (e) {
        console.error("Error saving last viewed quote to session storage:", e);
    }
}

/**
 * Loads the last viewed quote from the browser's sessionStorage.
 * @returns {object|null} The last viewed quote object, or null if not found or an error occurs.
 */
function loadLastViewedQuote() {
    try {
        const lastQuote = sessionStorage.getItem('lastViewedQuote');
        if (lastQuote) {
            const parsedQuote = JSON.parse(lastQuote);
            // Update the UI element with the loaded quote
            lastViewedQuoteDisplay.textContent = `Last viewed: "${parsedQuote.text}" - ${parsedQuote.author || parsedQuote.category}`;
            console.log("Last viewed quote loaded from session storage.");
            return parsedQuote;
        }
    } catch (e) {
        console.error("Error loading last viewed quote from session storage:", e);
    }
    return null; // Return null if no quote is found or an error occurs
}

// --- Server Interaction (JSONPlaceholder Simulation) ---

/**
 * Simulates fetching data from a server (JSONPlaceholder).
 * This function updates the local 'quotes' array with data from the mock server.
 * It implements a simple conflict resolution strategy where server data takes precedence.
 */
async function fetchQuotesFromServer() {
    displayNotification('Fetching quotes from server simulation...', 'info');
    try {
        // Fetch a limited number of posts to simulate quotes
        const response = await fetch(JSONPLACEHOLDER_URL + '?_limit=10');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const serverPosts = await response.json();

        // Convert JSONPlaceholder posts (which have 'title', 'body', 'userId')
        // into our application's 'quote' format ('text', 'author', 'category').
        const serverQuotes = serverPosts.map(post => ({
            text: post.title, // Use post title as the quote text
            author: `User ${post.userId}`, // Use userId as a generic author
            category: 'Server' // Assign a generic category for fetched data
        }));

        // Simple Conflict Resolution: The data fetched from the server
        // directly replaces the current local 'quotes' array.
        // In a real-world scenario, you might have more sophisticated merging logic
        // based on timestamps or unique IDs to handle concurrent edits.
        quotes = serverQuotes;
        displayNotification('Quotes synced from server!', 'success');
        console.log('Quotes updated from server:', quotes);

        // After updating quotes from the server, refresh all UI components
        // that depend on the 'quotes' array.
        populateCategories(); // Re-populate the categories dropdown
        filterQuotes();       // Re-apply the current filter and display a new quote
        loadLastViewedQuote(); // Attempt to display the last viewed quote if available
    } catch (error) {
        console.error("Could not fetch quotes from server simulation:", error);
        displayNotification(`Error fetching quotes: ${error.message}`, 'error');
        // If server fetch fails, fall back to loading quotes from local storage
        loadQuotesFromLocalStorage();
    }
}

/**
 * Simulates sending a new quote to the server (JSONPlaceholder) via a POST request.
 * Note: JSONPlaceholder does not persistently save data; this is for demonstration.
 * @param {object} newQuote - The quote object to send to the server.
 */
async function postQuoteToServer(newQuote) {
    displayNotification('Sending quote to server simulation...', 'info');
    try {
        const response = await fetch(JSONPLACEHOLDER_URL, {
            method: 'POST', // Use POST method to create a new resource
            headers: {
                'Content-Type': 'application/json', // Specify content type as JSON
            },
            // Convert the quote object to a JSON string for the request body
            body: JSON.stringify({
                title: newQuote.text,
                body: `${newQuote.author} - ${newQuote.category}`, // Combine author/category for body
                userId: 1, // A generic user ID for the mock API
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json(); // Parse the JSON response from the server
        displayNotification('Quote sent to server simulation successfully!', 'success');
        console.log('Server simulation response:', responseData);

        // After a simulated successful post, trigger a fetch to "re-sync" with the server.
        // This mimics a real-time update where the client would receive the new data.
        fetchQuotesFromServer();

    } catch (error) {
        console.error("Could not post quote to server simulation:", error);
        displayNotification(`Error sending quote: ${error.message}`, 'error');
    }
}

// --- Local Storage Management ---

/**
 * Saves the current 'quotes' array to the browser's local storage.
 * This acts as a persistent backup for the quotes.
 */
function saveQuotesToLocalStorage() {
    try {
        localStorage.setItem('quotes_local_backup', JSON.stringify(quotes));
        console.log("Quotes backed up to local storage.");
    } catch (e) {
        console.error("Error saving quotes to local storage:", e);
    }
}

/**
 * Loads quotes from the browser's local storage into the 'quotes' array.
 * If no stored data is found or an error occurs during loading/parsing,
 * it falls back to using the 'defaultQuotes' array.
 */
function loadQuotesFromLocalStorage() {
    try {
        const storedQuotes = localStorage.getItem('quotes_local_backup');
        if (storedQuotes) {
            quotes = JSON.parse(storedQuotes); // Parse the stored JSON string back into an array
            console.log("Quotes loaded from local storage backup.");
        } else {
            console.log("No quotes found in local storage backup. Using default quotes.");
            quotes = [...defaultQuotes]; // Use spread to create a new array from defaults
        }
        // Always save the current state to ensure local storage is up-to-date
        saveQuotesToLocalStorage();
    } catch (e) {
        console.error("Error loading quotes from local storage:", e);
        quotes = [...defaultQuotes]; // Fallback to default if parsing fails
        saveQuotesToLocalStorage(); // Attempt to save defaults again
    }
}

/**
 * Dynamically populates the category filter dropdown menu.
 * It extracts all unique categories from the 'quotes' array and adds them as <option> elements.
 * It also restores the user's last selected filter from local storage.
 */
function populateCategories() {
    // Get unique, non-empty categories from the current 'quotes' array.
    // .filter(cat => cat) ensures empty or null categories are not included.
    const categories = new Set(quotes.map(quote => quote.category).filter(cat => cat));
    
    // Clear existing options in the dropdown, but keep the "All Categories" option.
    categoryFilterSelect.innerHTML = '<option value="all">All Categories</option>';

    // Add each unique category as a new <option> element to the dropdown.
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;      // The value sent when selected
        option.textContent = category; // The visible text in the dropdown
        categoryFilterSelect.appendChild(option);
    });

    // Restore the user's last selected filter from local storage.
    const lastSelectedCategory = localStorage.getItem('lastCategoryFilter');
    // Check if the last selected category is still valid (exists in the current categories
    // or is the "all" option).
    if (lastSelectedCategory && (categories.has(lastSelectedCategory) || lastSelectedCategory === 'all')) {
        categoryFilterSelect.value = lastSelectedCategory;
    } else {
        categoryFilterSelect.value = 'all'; // Default to 'all' if the last selected is no longer valid
    }
    console.log("Categories populated and filter restored.");
}

/**
 * Filters the 'quotes' array based on the category selected in the dropdown.
 * Updates the 'filteredQuotes' array and then calls showRandomQuote() to display a relevant quote.
 * The selected filter preference is saved to local storage for persistence.
 */
function filterQuotes() {
    const selectedCategory = categoryFilterSelect.value;
    // Save the currently selected filter to local storage for persistence.
    localStorage.setItem('lastCategoryFilter', selectedCategory);

    if (selectedCategory === 'all') {
        filteredQuotes = [...quotes]; // If "All Categories" is selected, copy all quotes
    } else {
        // Filter the main 'quotes' array to get only quotes matching the selected category.
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    showRandomQuote(); // Display a random quote from the (now filtered) list
    console.log(`Quotes filtered by: ${selectedCategory}`);
}

// --- Core Application Logic ---

/**
 * Displays a random quote from the currently active list of quotes.
 * This list is either the 'filteredQuotes' (if a category filter is active and has results)
 * or the entire 'quotes' array. It also handles cases where no quotes are available.
 */
function showRandomQuote() {
    // Determine which array to use: filtered quotes if available, otherwise all quotes.
    const quotesToDisplay = filteredQuotes.length > 0 ? filteredQuotes : quotes;

    if (quotesToDisplay.length === 0) {
        // If no quotes are available in the current filtered view, try to show the last viewed.
        const lastViewed = loadLastViewedQuote();
        // Only display the last viewed quote if it still exists in the overall quotes list.
        if (lastViewed && quotes.some(q => q.text === lastViewed.text && q.category === lastViewed.category)) {
            quoteDisplayDiv.textContent = `"${lastViewed.text}"`;
            quoteAuthorDiv.textContent = `- ${lastViewed.author || lastViewed.category}`;
            quoteDisplayDiv.classList.remove('no-quote');
            displayNotification("No quotes in current filter. Showing last viewed from overall quotes.", "info");
            return;
        } else {
            // If no quotes at all, or last viewed is gone, display a default message.
            quoteDisplayDiv.textContent = "No quotes available for this category. Add some or select 'All Categories'.";
            quoteAuthorDiv.textContent = "";
            quoteDisplayDiv.classList.add('no-quote');
            return;
        }
    }

    // Select a random quote from the determined list.
    const randomIndex = Math.floor(Math.random() * quotesToDisplay.length);
    const randomQuote = quotesToDisplay[randomIndex];

    // Update the DOM to display the selected quote and its author/category.
    quoteDisplayDiv.textContent = `"${randomQuote.text}"`;
    quoteAuthorDiv.textContent = `- ${randomQuote.author || randomQuote.category}`;
    quoteDisplayDiv.classList.remove('no-quote'); // Remove 'no-quote' class if present

    saveLastViewedQuote(randomQuote); // Save the newly displayed quote to session storage
}

/**
 * Handles adding a new quote based on user input from the form fields.
 * It performs validation, adds the quote to the local array, saves to local storage,
 * simulates a server post, and refreshes the UI (categories and filters).
 */
function addQuote() {
    const text = newQuoteTextInput.value.trim();
    const category = newQuoteCategoryInput.value.trim();
    const author = 'User Added'; // Assign a default author for user-added quotes

    // Basic input validation: ensure both text and category are provided.
    if (text === "" || category === "") {
        displayNotification("Please enter both quote text and category.", "error");
        return; // Stop the function if validation fails
    }

    const newQuote = { text, category, author };
    quotes.push(newQuote); // Add the new quote to the main 'quotes' array
    saveQuotesToLocalStorage(); // Save the updated 'quotes' array to local storage backup

    // Simulate sending the new quote to the server.
    // In a real application, this would involve an API call to your backend.
    postQuoteToServer(newQuote);

    // Clear the input fields after the quote has been processed.
    newQuoteTextInput.value = "";
    newQuoteCategoryInput.value = "";

    // Crucial steps: Update the UI after adding a new quote.
    // 1. Re-populate the categories dropdown: This ensures that if the new quote
    //    introduced a unique category, it will now appear in the filter options.
    populateCategories();
    // 2. Re-apply the current filter: This ensures that the displayed quote
    //    is still relevant to the selected category (or shows the new quote if it matches).
    filterQuotes();

    displayNotification('Quote added locally and sending to server...', "info");
}

/**
 * Exports the current 'quotes' array as a JSON file.
 * This allows users to download their collection of quotes.
 */
function exportQuotes() {
    try {
        // Convert the 'quotes' array to a human-readable JSON string (with 2-space indentation).
        const dataStr = JSON.stringify(quotes, null, 2);
        // Create a Blob object from the JSON string, specifying its MIME type.
        const blob = new Blob([dataStr], { type: 'application/json' });
        // Create a URL for the Blob, which can be used as a download link.
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor (<a>) element to trigger the download.
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quotes.json'; // Set the default filename for the download
        document.body.appendChild(a); // Append to body (required for Firefox to click)
        a.click(); // Programmatically click the link to trigger the download
        document.body.removeChild(a); // Clean up the temporary link

        URL.revokeObjectURL(url); // Release the object URL to free up memory
        displayNotification('Quotes exported successfully to quotes.json!', "success");
        console.log("Quotes exported to quotes.json");
    } catch (e) {
        console.error("Error exporting quotes:", e);
        displayNotification("Error: Could not export quotes.", "error");
    }
}

/**
 * Handles importing quotes from a JSON file selected by the user.
 * It reads the file, parses the JSON, merges new quotes into the existing array,
 * skips duplicates, updates local storage, and refreshes the UI.
 * @param {Event} event - The change event object from the file input.
 */
function importFromJsonFile(event) {
    const file = event.target.files[0]; // Get the selected file
    if (!file) {
        return; // Exit if no file was selected
    }

    const fileReader = new FileReader(); // Create a new FileReader instance
    fileReader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result); // Parse the file content as JSON

            // Validate the imported data structure: ensure it's an array of objects
            // with 'text' and 'category' properties.
            if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => typeof q.text === 'string' && typeof q.category === 'string')) {
                displayNotification('Invalid JSON file format. Expected an array of quote objects with "text" and "category" properties.', "error");
                return;
            }

            let addedCount = 0;
            let skippedCount = 0;
            const newQuotesToSimulatePost = []; // Temporary array to hold quotes that will be "posted"

            // Iterate over each imported quote to check for duplicates and add new ones.
            importedQuotes.forEach(importedQuote => {
                // Conflict Resolution: Check if an exact duplicate (same text AND category)
                // already exists in the current 'quotes' array.
                const isDuplicate = quotes.some(existingQuote =>
                    existingQuote.text === importedQuote.text && existingQuote.category === importedQuote.category
                );

                if (!isDuplicate) {
                    quotes.push(importedQuote); // Add the non-duplicate quote to the main array
                    newQuotesToSimulatePost.push(importedQuote); // Add to list for simulated server post
                    addedCount++;
                } else {
                    skippedCount++;
                }
            });

            saveQuotesToLocalStorage(); // Save the merged (existing + new) quotes to local storage backup

            // Provide feedback to the user and simulate posting new quotes to the server.
            if (addedCount > 0) {
                 displayNotification(`Imported ${addedCount} quotes. Skipping ${skippedCount} duplicates. Attempting to sync new quotes to server.`, "info");
                 // Post each newly added quote to the server simulation.
                 newQuotesToSimulatePost.forEach(newQuote => {
                     postQuoteToServer(newQuote);
                 });
            } else {
                 displayNotification(`Skipped all ${skippedCount} quotes as they were duplicates.`, "info");
            }

            // Refresh the UI components after import.
            populateCategories(); // Update the categories dropdown
            filterQuotes();       // Re-apply the current filter
            event.target.value = ''; // Clear the file input value for re-selection
        } catch (parseError) {
            console.error("Error parsing JSON file:", parseError);
            displayNotification('Error parsing JSON file. Please ensure it\'s valid JSON.', "error");
            event.target.value = ''; // Clear input on error
        }
    };
    fileReader.onerror = function() {
        console.error("Error reading file.");
        displayNotification('Error reading file.', "error");
        event.target.value = ''; // Clear input on error
    };
    fileReader.readAsText(file); // Start reading the file content as text
}


// --- Event Listeners & Initial Setup ---

// Attach event listeners to buttons and dropdowns
newQuoteButton.addEventListener('click', showRandomQuote);
addQuoteButton.addEventListener('click', addQuote);
exportQuotesButton.addEventListener('click', exportQuotes);
categoryFilterSelect.addEventListener('change', filterQuotes); // Listen for filter changes
importFileInput.addEventListener('change', importFromJsonFile); // Listen for file selection

// Initial setup logic to run when the entire page has loaded
window.onload = function() {
    // 1. Load any existing quotes from local storage (our persistent backup).
    loadQuotesFromLocalStorage();
    // 2. Populate the category filter dropdown based on the loaded quotes.
    populateCategories();
    // 3. Apply the initial or last-remembered filter and display a quote.
    filterQuotes();
    // 4. Load and display the last viewed quote from session storage.
    loadLastViewedQuote();

    // 5. Set up periodic data fetching from the simulated server.
    // This will call fetchQuotesFromServer every 10 seconds to mimic real-time updates.
    setInterval(fetchQuotesFromServer, 10000);
    // 6. Perform an initial fetch immediately when the page loads.
    fetchQuotesFromServer();
};

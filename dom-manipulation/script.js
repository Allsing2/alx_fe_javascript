document.addEventListener('DOMContentLoaded', function() {
    // Helper to generate unique IDs for quotes (useful for syncing and conflict resolution)
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    // 1. Initial Data & Local Storage Integration
    // CHECKPOINT: Ensure that the application loads existing quotes from local storage when initialized.
    let quotes = JSON.parse(localStorage.getItem('quotes')) || [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Inspiration" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "Innovation" },
        { text: "The mind is everything. What you think you become.", author: "Buddha", category: "Wisdom" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "Life" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Inspiration" },
        { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein", category: "Wisdom" }
    ];
    // Ensure all initial/loaded quotes have IDs, or generate them if missing
    quotes = quotes.map(quote => ({ ...quote, id: quote.id || generateUniqueId() }));


    // --- Simulate Server Interaction (Step 1) ---
    // CHECKPOINT: Setup Server Simulation: Use JSONPlaceholder or a similar mock API to simulate fetching and posting data.
    // Initialize mock server with a deep copy of the current local data for consistency.
    let mockServerQuotes = JSON.parse(JSON.stringify(quotes));

    // CHECKPOINT: Implement periodic data fetching to simulate receiving updates from a server.
    // Function to simulate fetching data from the server
    // CHECKPOINT: Fetching data from the server using a mock API.
    async function fetchQuotesFromServer() {
        // Simulate network delay
        return new Promise(resolve => {
            setTimeout(() => {
                // Return a deep copy to ensure modifications to 'quotes' don't directly alter 'mockServerQuotes'
                resolve(JSON.parse(JSON.stringify(mockServerQuotes)));
            }, 500); // 0.5 second delay
        });
    }

    // Function to simulate posting/updating data on the server
    // CHECKPOINT: Posting data to the server using a mock API.
    async function postQuoteToServer(quote) {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = mockServerQuotes.findIndex(q => q.id === quote.id);
                if (index > -1) {
                    // Update existing quote by ID
                    mockServerQuotes[index] = { ...quote }; // Use spread to ensure deep copy
                    console.log("Mock server updated existing quote:", quote);
                } else {
                    // Add new quote
                    mockServerQuotes.push({ ...quote }); // Use spread to ensure deep copy
                    console.log("Mock server added new quote:", quote);
                }
                resolve({ success: true, updatedQuote: { ...quote } });
            }, 300); // 0.3 second delay
        });
    }

    // DOM Element References: Get references to all necessary HTML elements
    const quoteDisplay = document.getElementById('quoteDisplay');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const newQuoteBtn = document.getElementById('newQuoteBtn');
    const newQuoteText = document.getElementById('newQuoteText');
    const newQuoteCategory = document.getElementById('newQuoteCategory');
    const addQuoteBtn = document.getElementById('addQuoteBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const exportQuotesBtn = document.getElementById('exportQuotesBtn');
    const importFile = document.getElementById('importFile');
    const lastViewedQuoteDisplay = document.getElementById('lastViewedQuoteDisplay');
    const notificationDisplay = document.getElementById('notificationDisplay'); // Notification UI element


    // Set to keep track of unique categories for the filter dropdown.
    const uniqueCategories = new Set();

    // --- Web Storage Helper Functions ---

    // Function: Saves the current 'quotes' array to Local Storage.
    // CHECKPOINT: Modify the JavaScript code to save the quotes array to local storage every time a new quote is added.
    function saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    }

    // Function: Saves the last viewed quote to Session Storage.
    // CHECKPOINT: Demonstrate the use of session storage by temporarily storing user preferences or session-specific data.
    function saveLastViewedQuote(quote) {
        if (quote) {
            sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
            displayLastViewedQuote(); // Update display immediately after saving
        }
    }

    // Function: Displays the last viewed quote from Session Storage.
    function displayLastViewedQuote() {
        const lastQuote = JSON.parse(sessionStorage.getItem('lastViewedQuote'));
        if (lastQuote) {
            lastViewedQuoteDisplay.textContent = `Last viewed: "${lastQuote.text}" - ${lastQuote.author || 'Unknown'}`;
        } else {
            lastViewedQuoteDisplay.textContent = "No last viewed quote found.";
        }
    }

    // Function: Saves the currently selected filter category to Local Storage.
    // CHECKPOINT: Remember the Last Selected Filter: Use local storage to save the last selected category filter.
    function saveLastSelectedFilter(category) {
        localStorage.setItem('lastSelectedCategoryFilter', category);
    }

    // Function: Loads the last selected filter category from Local Storage.
    // CHECKPOINT: Remember the Last Selected Filter: Restore it when the user revisits the page.
    function loadLastSelectedFilter() {
        return localStorage.getItem('lastSelectedCategoryFilter') || 'all'; // Default to 'all'
    }

    // --- Core Display & Filtering Functions ---

    // Helper function: Displays a single quote.
    function displayQuote(quote) {
        if (quote) {
            quoteDisplay.textContent = `"${quote.text}"`;
            quoteAuthor.textContent = `- ${quote.author || 'Unknown'}`;
            quoteDisplay.classList.remove('no-quote');
            saveLastViewedQuote(quote); // Save to session storage when displayed
        } else {
            quoteDisplay.textContent = "No quotes available for this category.";
            quoteAuthor.textContent = "";
            quoteDisplay.classList.add('no-quote');
            saveLastViewedQuote(null); // Clear last viewed if no quote is available
        }
    }

    // Function: populateCategories
    // CHECKPOINT: Populate Categories Dynamically: Use the existing quotes array to extract unique categories and populate the dropdown menu.
    // CHECKPOINT: Name the function behind this implementation populateCategories.
    window.populateCategories = function() {
        // Clear all existing options first, but keep "All Categories".
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        uniqueCategories.clear(); // Clear the Set to re-populate from scratch

        // Iterate over each quote to collect unique categories.
        quotes.forEach(quote => {
            if (quote.category && typeof quote.category === 'string' && quote.category.trim() !== '') {
                const trimmedCategory = quote.category.trim();
                if (!uniqueCategories.has(trimmedCategory)) {
                    uniqueCategories.add(trimmedCategory);
                    const option = document.createElement('option');
                    option.value = trimmedCategory;
                    option.textContent = trimmedCategory;
                    categoryFilter.appendChild(option);
                }
            }
        });

        // Restore the last selected filter after populating categories
        const lastFilter = loadLastSelectedFilter();
        // Ensure the restored filter is actually an available category or 'all'
        if (Array.from(uniqueCategories).includes(lastFilter) || lastFilter === 'all') {
            categoryFilter.value = lastFilter;
        } else {
            // If the last filter category no longer exists (e.g., deleted), reset to 'all'
            categoryFilter.value = 'all';
            saveLastSelectedFilter('all'); // Also update local storage for this change
        }
    };

    // Function: filterQuotes
    // CHECKPOINT: Filter Quotes Based on Selected Category: Implement the filterQuotes function to update the displayed quotes based on the selected category.
    window.filterQuotes = function() {
        const selectedCategory = categoryFilter.value;
        saveLastSelectedFilter(selectedCategory); // Save the selected filter to local storage

        let filteredQuotes = quotes;
        if (selectedCategory !== 'all') {
            filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
        }

        if (filteredQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
            displayQuote(filteredQuotes[randomIndex]);
        } else {
            displayQuote(null); // No quotes found for this category
        }
    };

    // Alias for showRandomQuote to use the new filterQuotes logic
    window.showRandomQuote = window.filterQuotes;

    // --- Quote Addition & Data Management ---

    // Function: addQuote
    // CHECKPOINT: Update the addQuote function to also update the categories in the dropdown if a new category is introduced.
    // CHECKPOINT: Ensure that changes in categories and filters are reflected in real-time and persisted across sessions.
    window.addQuote = async function() { // Made async because it will call postQuoteToServer
        const text = newQuoteText.value.trim();
        const category = newQuoteCategory.value.trim();
        const author = "User";

        if (text === "" || category === "") {
            displayNotification("Please enter both quote text and category.", "error");
            return;
        }

        const newQuote = { id: generateUniqueId(), text, author, category };
        quotes.push(newQuote); // Add new quote to the local array
        saveQuotes(); // This line saves the updated 'quotes' array to Local Storage

        populateCategories(); // Update categories dropdown (re-scans and adds new if present)

        newQuoteText.value = '';
        newQuoteCategory.value = '';

        // Simulate posting to server and then syncing
        displayNotification("Quote added locally. Syncing with server...", "info");
        await postQuoteToServer(newQuote);
        await syncQuotes();
        displayNotification("Quote added and synced successfully!", "success");

        filterQuotes(); // Refresh displayed quote based on current filter
    };

    // --- JSON Import/Export Functions ---

    // Function: Exports quotes to a JSON file.
    // CHECKPOINT: Implement JSON Export: Provide a button that allows users to export their quotes to a JSON file. Use Blob and URL.createObjectURL.
    window.exportQuotesToJson = function() {
        const jsonString = JSON.stringify(quotes, null, 2); // null, 2 for pretty printing JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quotes.json'; // Set the download filename
        document.body.appendChild(a); // Append to body to ensure it's in DOM for click to work
        a.click();
        document.body.removeChild(a); // Clean up the temporary anchor
        URL.revokeObjectURL(url); // Clean up the object URL
        console.log("Quotes exported successfully!");
        displayNotification("Quotes exported successfully!", "info");
    };

    // Function: Imports quotes from a JSON file.
    // CHECKPOINT: Implement JSON Import: Provide a file input to allow users to upload a JSON file containing quotes. Read the file and update.
    window.importFromJsonFile = async function(event) {
        const fileReader = new FileReader();
        fileReader.onload = async function(event) {
            try {
                const importedQuotes = JSON.parse(event.target.result);

                if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => typeof q.text === 'string' && typeof q.category === 'string')) {
                    throw new Error("Invalid JSON file format. Expected an array of quote objects with 'text' and 'category' (strings).");
                }

                importedQuotes.forEach(q => { if (!q.id) q.id = generateUniqueId(); });

                const existingQuoteIds = new Set(quotes.map(q => q.id));
                const newQuotesToAdd = importedQuotes.filter(q => !existingQuoteIds.has(q.id));
                quotes.push(...newQuotesToAdd); // Add unique imported quotes
                
                saveQuotes(); // This line saves the updated 'quotes' array to Local Storage

                populateCategories();
                filterQuotes();

                displayNotification('Quotes imported successfully! Initiating sync...', "info");
                await syncQuotes(); // Trigger sync after import
                displayNotification('Quotes imported and synced successfully!', "success");

            } catch (error) {
                console.error('Error importing quotes:', error.message);
                displayNotification(`Error importing quotes: ${error.message}`, "error");
            }
        };
        if (event.target.files[0]) {
            fileReader.readAsText(event.target.files[0]);
        }
    };

    // --- Data Syncing Logic (Step 2 & 3) ---
    // CHECKPOINT: Implement Data Syncing Logic: Add functionality to periodically check for new quotes from the server and update the local storage accordingly.
    // CHECKPOINT: Implement a simple conflict resolution strategy where the server’s data takes precedence in case of discrepancies.
    // CHECKPOINT: Add a UI element or notification system to inform users when data has been updated or if conflicts were resolved.
    // Note: Manual conflict resolution is outside the scope of this "simple simulation" but can be added.
    async function syncQuotes() {
        console.log("Initiating sync with server...");
        displayNotification("Syncing data...", "info");

        try {
            const serverQuotes = await fetchQuotesFromServer(); // Get server's version

            const localQuotesMap = new Map(quotes.map(q => [q.id, q]));
            const serverQuotesMap = new Map(serverQuotes.map(q => [q.id, q]));

            let changesDetected = false;
            let notifications = []; // Collect specific changes for console log

            // Phase 1: Incorporate server changes into local data (Server precedence)
            serverQuotesMap.forEach((serverQuote, id) => {
                if (localQuotesMap.has(id)) {
                    // Quote exists locally, check for discrepancies
                    const localQuote = localQuotesMap.get(id);
                    // Deep compare content to detect actual change
                    if (JSON.stringify(localQuote) !== JSON.stringify(serverQuote)) {
                        // Content differs, server's version wins (conflict resolution)
                        Object.assign(localQuote, serverQuote); // Update in place (modifies 'quotes' array by reference)
                        notifications.push(`Updated quote: "${serverQuote.text.substring(0, Math.min(serverQuote.text.length, 30))}..." from server.`);
                        changesDetected = true;
                    }
                } else {
                    // Quote exists on server but not locally, add it
                    quotes.push({ ...serverQuote }); // Add a copy to avoid direct reference issues
                    notifications.push(`Added new quote: "${serverQuote.text.substring(0, Math.min(serverQuote.text.length, 30))}..." from server.`);
                    changesDetected = true;
                }
            });

            // Phase 2: Remove local quotes that are not on the server (server precedence for deletions)
            // Filter the local 'quotes' array to only keep items that are also present on the server.
            // This implicitly handles deletions from the server taking precedence.
            let quotesBeforeFilterCount = quotes.length;
            quotes = quotes.filter(q => serverQuotesMap.has(q.id));
            if (quotes.length < quotesBeforeFilterCount) {
                 // Simple check if any quotes were removed
                const removedCount = quotesBeforeFilterCount - quotes.length;
                notifications.push(`Removed ${removedCount} local quotes (deleted on server).`);
                changesDetected = true;
            }


            if (changesDetected) {
                saveQuotes(); // Save updated local state to localStorage
                populateCategories(); // Re-populate categories if quotes changed
                filterQuotes(); // Refresh displayed quote based on potentially new data
                displayNotification("Data synced successfully! Check console for details.", "success");
                notifications.forEach(msg => console.log(`Sync Log: ${msg}`));
            } else {
                displayNotification("Local data is up-to-date with server. No changes found.", "info");
            }

        } catch (error) {
            console.error("Error during sync:", error);
            displayNotification("Error during sync with server. Check console.", "error");
        }
    }

    // --- Notification System ---
    // CHECKPOINT: Add a UI element or notification system to inform users when data has been updated or if conflicts were resolved.
    function displayNotification(message, type = "info") { // type: info, success, error
        if (notificationDisplay) { // Ensure the element exists
            notificationDisplay.textContent = message;
            notificationDisplay.className = `notification ${type}`; // Add base class and type class
            notificationDisplay.style.display = 'block'; // Make it visible
            setTimeout(() => {
                notificationDisplay.style.display = 'none'; // Hide after 7 seconds
            }, 7000);
        }
    }

    // --- Utility Function (Demonstrates map()) ---
    function getAllQuoteSummaries() {
        return quotes.map(quote => {
            const author = quote.author || 'Unknown';
            return `"${quote.text}" by ${author} (${quote.category})`;
        });
    }


    // --- Event Listeners and Initial Load ---
    newQuoteBtn.addEventListener('click', filterQuotes);
    addQuoteBtn.addEventListener('click', addQuote);
    categoryFilter.addEventListener('change', filterQuotes);
    exportQuotesBtn.addEventListener('click', exportQuotesToJson);

    // CHECKPOINT: Implement periodic data fetching to simulate receiving updates from a server.
    setInterval(syncQuotes, 15000); // Sync every 15 seconds.

    // Initial setup when the page loads:
    populateCategories(); // Populate categories based on initial local/loaded quotes
    filterQuotes();       // Display a quote based on current filter (restored or default)
    displayLastViewedQuote(); // Show last viewed quote from session storage
    syncQuotes();         // Perform an initial sync on page load
});

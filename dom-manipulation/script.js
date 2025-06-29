document.addEventListener('DOMContentLoaded', function() {
    // Helper to generate unique IDs for quotes (useful for syncing and conflict resolution)
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    // 1. Initial Data & Local Storage Integration
    // CHECKPOINT: Modify the JavaScript code to save the quotes array to local storage every time a new quote is added.
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


    // --- Simulate Server Interaction (from later tasks, kept for completeness) ---
    let mockServerQuotes = JSON.parse(JSON.stringify(quotes));

    async function fetchQuotesFromServer() {
        return new Promise(resolve => { setTimeout(() => resolve(JSON.parse(JSON.stringify(mockServerQuotes))), 500); });
    }

    async function postQuoteToServer(quote) {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = mockServerQuotes.findIndex(q => q.id === quote.id);
                if (index > -1) { mockServerQuotes[index] = { ...quote }; }
                else { mockServerQuotes.push({ ...quote }); }
                resolve({ success: true, updatedQuote: { ...quote } });
            }, 300);
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
    // CHECKPOINT: Modify the JavaScript code to save the quotes array to local storage.
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

    // Function: Saves the currently selected filter category to Local Storage (from later task).
    function saveLastSelectedFilter(category) {
        localStorage.setItem('lastSelectedCategoryFilter', category);
    }

    // Function: Loads the last selected filter category from Local Storage (from later task).
    function loadLastSelectedFilter() {
        return localStorage.getItem('lastSelectedCategoryFilter') || 'all';
    }

    // --- Core Display & Filtering Functions (from later tasks) ---

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
            saveLastViewedQuote(null);
        }
    }

    // Populates the category filter dropdown.
    window.populateCategories = function() {
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        uniqueCategories.clear();
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
        const lastFilter = loadLastSelectedFilter();
        if (Array.from(uniqueCategories).includes(lastFilter) || lastFilter === 'all') {
            categoryFilter.value = lastFilter;
        } else {
            categoryFilter.value = 'all';
            saveLastSelectedFilter('all');
        }
    };

    // Filters and displays quotes.
    window.filterQuotes = function() {
        const selectedCategory = categoryFilter.value;
        saveLastSelectedFilter(selectedCategory);

        let filteredQuotes = quotes;
        if (selectedCategory !== 'all') {
            filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
        }

        if (filteredQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
            displayQuote(filteredQuotes[randomIndex]);
        } else {
            displayQuote(null);
        }
    };

    window.showRandomQuote = window.filterQuotes;

    // --- Quote Addition & Data Management ---

    // Function: addQuote
    // CHECKPOINT: Modify the JavaScript code to save the quotes array to local storage every time a new quote is added.
    window.addQuote = async function() {
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

        populateCategories(); // Re-populate categories (will include new category if present)

        newQuoteText.value = '';
        newQuoteCategory.value = '';

        // Simulate posting to server and then syncing (from later tasks)
        displayNotification("Quote added locally. Syncing with server...", "info");
        await postQuoteToServer(newQuote);
        await syncQuotes();
        displayNotification("Quote added and synced successfully!", "success");

        filterQuotes(); // Refresh displayed quote based on current filter
    };

    // --- JSON Import/Export Functions ---

    // Function: Exports quotes to a JSON file.
    // CHECKPOINT: Implement JSON Export: Provide a button that allows users to export their quotes to a JSON file.
    window.exportQuotesToJson = function() {
        const jsonString = JSON.stringify(quotes, null, 2); // null, 2 for pretty printing JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quotes.json'; // Set the download filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Quotes exported successfully!");
        displayNotification("Quotes exported successfully!", "info");
    };

    // Function: Imports quotes from a JSON file.
    // CHECKPOINT: Implement JSON Import: Provide a file input to allow users to upload a JSON file containing quotes.
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

    // --- Data Syncing Logic (from later tasks, kept for completeness) ---
    async function syncQuotes() {
        console.log("Initiating sync with server...");
        displayNotification("Syncing data...", "info");
        try {
            const serverQuotes = await fetchQuotesFromServer();
            const localQuotesMap = new Map(quotes.map(q => [q.id, q]));
            const serverQuotesMap = new Map(serverQuotes.map(q => [q.id, q]));
            let changesDetected = false;
            serverQuotesMap.forEach((serverQuote, id) => {
                if (localQuotesMap.has(id)) {
                    const localQuote = localQuotesMap.get(id);
                    if (JSON.stringify(localQuote) !== JSON.stringify(serverQuote)) {
                        Object.assign(localQuote, serverQuote);
                        changesDetected = true;
                    }
                } else {
                    quotes.push({ ...serverQuote });
                    changesDetected = true;
                }
            });
            quotes = quotes.filter(q => serverQuotesMap.has(q.id));
            if (changesDetected) {
                saveQuotes();
                populateCategories();
                filterQuotes();
                displayNotification("Data synced successfully!", "success");
            } else {
                displayNotification("Local data is up-to-date with server. No changes found.", "info");
            }
        } catch (error) {
            console.error("Error during sync:", error);
            displayNotification("Error during sync with server. Check console.", "error");
        }
    }

    // --- Notification System ---
    function displayNotification(message, type = "info") {
        if (notificationDisplay) {
            notificationDisplay.textContent = message;
            notificationDisplay.className = `notification ${type}`;
            notificationDisplay.style.display = 'block';
            setTimeout(() => {
                notificationDisplay.style.display = 'none';
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

    // Periodic data fetching simulation (from later task)
    setInterval(syncQuotes, 15000);

    // Initial setup when the page loads:
    populateCategories();
    filterQuotes();
    displayLastViewedQuote();
    syncQuotes(); // Initial sync on page load
});

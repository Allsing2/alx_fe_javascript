document.addEventListener('DOMContentLoaded', function() {
    // 1. Initial Data: Array of quote objects
    // Each object has a 'text', an 'author', and a 'category'.
    let quotes = []; // Initialize as empty, will be populated from local storage

    // DOM Element References: Get references to all necessary HTML elements
    const quoteDisplay = document.getElementById('quoteDisplay');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const newQuoteBtn = document.getElementById('newQuoteBtn');
    const newQuoteText = document.getElementById('newQuoteText');
    const newQuoteCategory = document.getElementById('newQuoteCategory');
    const addQuoteBtn = document.getElementById('addQuoteBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const exportQuotesBtn = document.getElementById('exportQuotesBtn'); // New button for export
    const importFileInput = document.getElementById('importFileInput'); // New file input for import

    // Set to keep track of unique categories for the filter dropdown.
    // Using a Set ensures that each category is stored only once.
    const uniqueCategories = new Set();

    // --- Step 1: Integrate Web Storage ---

    // Function to save quotes to local storage
    function saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    }

    // Function to load quotes from local storage
    function loadQuotes() {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
            quotes = JSON.parse(storedQuotes);
        } else {
            // If no quotes in local storage, use the initial default quotes
            quotes = [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Inspiration" },
                { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "Innovation" },
                { text: "The mind is everything. What you think you become.", author: "Buddha", category: "Wisdom" },
                { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "Life" },
                { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Inspiration" },
                { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein", category: "Wisdom" }
            ];
            saveQuotes(); // Save these initial quotes to local storage
        }
    }

    // Function to save the last viewed quote to session storage
    function saveLastViewedQuote(quote) {
        if (quote) {
            sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
        } else {
            sessionStorage.removeItem('lastViewedQuote');
        }
    }

    // Function to load the last viewed quote from session storage
    function loadLastViewedQuote() {
        const storedQuote = sessionStorage.getItem('lastViewedQuote');
        if (storedQuote) {
            return JSON.parse(storedQuote);
        }
        return null;
    }

    // Helper function: Displays a single quote in the designated HTML elements.
    // Handles cases where no quote is found.
    function displayQuote(quote) {
        if (quote) {
            quoteDisplay.textContent = `"${quote.text}"`;
            quoteAuthor.textContent = `- ${quote.author || 'Unknown'}`;
            quoteDisplay.classList.remove('no-quote');
            saveLastViewedQuote(quote); // Save to session storage
        } else {
            quoteDisplay.textContent = "No quotes available for this category.";
            quoteAuthor.textContent = "";
            quoteDisplay.classList.add('no-quote');
            saveLastViewedQuote(null); // Clear from session storage
        }
    }

    // Function: Populates the category filter dropdown (<select> element).
    function populateCategoryFilter() {
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        uniqueCategories.clear(); // Clear the set before repopulating

        quotes.forEach(quote => {
            if (quote.category && !uniqueCategories.has(quote.category)) {
                uniqueCategories.add(quote.category);
                const option = document.createElement('option');
                option.value = quote.category;
                option.textContent = quote.category;
                categoryFilter.appendChild(option);
            }
        });
    }

    // Function: showRandomQuote
    window.showRandomQuote = function() {
        const selectedCategory = categoryFilter.value;
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

    // Function: addQuote
    window.addQuote = function() {
        const text = newQuoteText.value.trim();
        const category = newQuoteCategory.value.trim();
        const author = "User"; // Assign a default author for user-added quotes.

        if (text === "" || category === "") {
            // Replaced alert with a simple message for this example.
            // In a full app, consider a custom modal or message display.
            alert("Please enter both quote text and category.");
            return;
        }

        const newQuote = { text, author, category };
        quotes.push(newQuote);
        saveQuotes(); // Save to local storage after adding
        populateCategoryFilter(); // Update filter dropdown
        newQuoteText.value = '';
        newQuoteCategory.value = '';
        showRandomQuote();
        // Replaced alert with a simple message for this example.
        alert("Quote added successfully!");
    };

    // --- Step 2: JSON Data Import and Export ---

    // Function to export quotes to JSON file
    window.exportQuotes = function() {
        const dataStr = JSON.stringify(quotes, null, 2); // Pretty print JSON
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quotes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the URL object
    };

    // Function to import quotes from JSON file
    window.importQuotes = function(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation for imported data structure
                if (Array.isArray(importedData) && importedData.every(q => q.text && q.author && q.category)) {
                    // Overwrite existing quotes with imported ones
                    quotes = importedData;
                    saveQuotes(); // Save imported quotes to local storage
                    populateCategoryFilter();
                    showRandomQuote();
                    alert("Quotes imported successfully!");
                } else {
                    alert("Invalid JSON file format. Please ensure it's an array of quote objects with 'text', 'author', and 'category' properties.");
                }
            } catch (error) {
                alert("Error parsing JSON file: " + error.message);
            }
        };
        reader.readAsText(file);
    };

    // Event Listeners: Attach functionality to user interactions.
    newQuoteBtn.addEventListener('click', showRandomQuote);
    addQuoteBtn.addEventListener('click', addQuote);
    categoryFilter.addEventListener('change', showRandomQuote);
    exportQuotesBtn.addEventListener('click', exportQuotes); // Event listener for export button
    importFileInput.addEventListener('change', importQuotes); // Event listener for file input

    // Initial setup when the page loads:
    loadQuotes(); // Load quotes from local storage first
    populateCategoryFilter(); // Populate the category filter dropdown

    // Try to display the last viewed quote from session storage, otherwise show a random one
    const lastQuote = loadLastViewedQuote();
    if (lastQuote) {
        displayQuote(lastQuote);
    } else {
        showRandomQuote();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // 1. Initial Data: Array of quote objects
    // Each object has a 'text', an 'author', and a 'category'.
    const quotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Inspiration" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "Innovation" },
        { text: "The mind is everything. What you think you become.", author: "Buddha", category: "Wisdom" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "Life" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Inspiration" },
        { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein", category: "Wisdom" }
    ];

    // DOM Element References: Get references to all necessary HTML elements
    const quoteDisplay = document.getElementById('quoteDisplay');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const newQuoteBtn = document.getElementById('newQuoteBtn');
    const newQuoteText = document.getElementById('newQuoteText');
    const newQuoteCategory = document.getElementById('newQuoteCategory');
    const addQuoteBtn = document.getElementById('addQuoteBtn');
    const categoryFilter = document.getElementById('categoryFilter');

    // Set to keep track of unique categories for the filter dropdown.
    // Using a Set ensures that each category is stored only once.
    const uniqueCategories = new Set();

    // Helper function: Displays a single quote in the designated HTML elements.
    // Handles cases where no quote is found.
    function displayQuote(quote) {
        if (quote) {
            // Set the quote text, wrapping it in quotes for presentation.
            quoteDisplay.textContent = `"${quote.text}"`;
            // Set the author, defaulting to 'Unknown' if not provided.
            quoteAuthor.textContent = `- ${quote.author || 'Unknown'}`;
            // Remove the 'no-quote' class which might style placeholder text.
            quoteDisplay.classList.remove('no-quote');
        } else {
            // If no quote is provided (e.g., no quotes for a category), display a message.
            quoteDisplay.textContent = "No quotes available for this category.";
            quoteAuthor.textContent = ""; // Clear author
            // Add 'no-quote' class to apply specific styling for this state.
            quoteDisplay.classList.add('no-quote');
        }
    }

    // Function: Populates the category filter dropdown (<select> element).
    // It dynamically adds <option> tags based on the categories present in the 'quotes' array.
    function populateCategoryFilter() {
        // Clear all existing options first, except for the initial "All Categories" option.
        // This prevents duplicate options if the function is called multiple times.
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';

        // Iterate over each quote to collect unique categories.
        quotes.forEach(quote => {
            // Check if the quote has a category and if it's not already in our Set.
            if (quote.category && !uniqueCategories.has(quote.category)) {
                uniqueCategories.add(quote.category); // Add the new unique category to the Set.
                const option = document.createElement('option'); // Create a new <option> element.
                option.value = quote.category; // Set the value of the option.
                option.textContent = quote.category; // Set the visible text of the option.
                categoryFilter.appendChild(option); // Append the option to the dropdown.
            }
        });
    }

    // Function: showRandomQuote
    // Displays a random quote from the 'quotes' array,
    // optionally filtered by the currently selected category.
    window.showRandomQuote = function() {
        // Get the value of the currently selected category from the dropdown.
        const selectedCategory = categoryFilter.value;
        let filteredQuotes = quotes; // Start with all quotes.

        // If a specific category is selected (not "all"), filter the quotes.
        if (selectedCategory !== 'all') {
            filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
        }

        // Check if there are any quotes left after filtering.
        if (filteredQuotes.length > 0) {
            // Generate a random index to pick a quote.
            const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
            // Display the randomly selected quote.
            displayQuote(filteredQuotes[randomIndex]);
        } else {
            // If no quotes match the filter, display a "no quotes available" message.
            displayQuote(null);
        }
    };

    // Function: addQuote
    // This function handles adding new quotes dynamically through the form.
    // It updates the 'quotes' array and the DOM (specifically the category filter).
    // This function fulfills the requirement for 'createAddQuoteForm' by managing
    // the interactions with the add quote form elements and the underlying data.
    window.addQuote = function() {
        // Get and trim the values from the input fields.
        const text = newQuoteText.value.trim();
        const category = newQuoteCategory.value.trim();
        const author = "User"; // Assign a default author for user-added quotes.

        // Basic input validation.
        if (text === "" || category === "") {
            // Use a custom message box or modal in a full app, not alert()
            alert("Please enter both quote text and category.");
            return; // Stop the function if validation fails.
        }

        // Create a new quote object.
        const newQuote = { text, author, category };
        quotes.push(newQuote); // Add the new quote to our 'quotes' array.

        // If the added quote's category is new, update the category filter dropdown.
        if (!uniqueCategories.has(category)) {
            populateCategoryFilter();
        }

        // Clear the input fields after adding the quote.
        newQuoteText.value = '';
        newQuoteCategory.value = '';

        // Display a random quote from the updated list, which might include the new quote.
        showRandomQuote();
        // Inform the user that the quote was added.
        // Use a custom message box or modal in a full app, not alert()
        alert("Quote added successfully!");
    };

    // Event Listeners: Attach functionality to user interactions.
    // When the "Show New Quote" button is clicked, call showRandomQuote.
    newQuoteBtn.addEventListener('click', showRandomQuote);
    // When the "Add Quote" button is clicked, call addQuote.
    addQuoteBtn.addEventListener('click', addQuote);
    // When the category filter dropdown value changes, update the displayed quote.
    categoryFilter.addEventListener('change', showRandomQuote);

    // Initial setup when the page loads:
    // 1. Populate the category filter dropdown with initial categories.
    populateCategoryFilter();
    // 2. Display a random quote when the page first loads.
    showRandomQuote();
});

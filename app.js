// API request options
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json' // Corrected typo
    },
};

const showShimmer = () => document.querySelector('.shimmer-container').style.display = "flex";
const hideShimmer = () =>  document.querySelector('.shimmer-container').style.display = "none";

let coins = []; // Array to store coin data
let currentPage = 1; // Current page

const initializePage = async () =>{
   await fetchCoins(currentPage);
   renderCoins(coins,currentPage,25)
}

//Function to fetch coins data
const fetchCoins = async (page = 1) => {
    try {
        showShimmer();    //loding effect
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=${page}`,
            options
        );
       coins = await response.json(); // Parse JSON data
       console.log(coins);
    } catch (err) {
        console.error("Error fetching coins:", err);
    } finally {
        hideShimmer();
    }

    return coins;
};

//Retrived favorites from localStorage
const getFavorites = () => JSON.parse(localStorage.getItem('favorites')) || [];

//Save favorites from localStorage
const saveFavorites = (favorites) => localStorage.setItem('favorites', JSON.stringify(favorites));

//Handel favorite icon click
const handleFavoriteClick = (coinId) => {
    const favorites = toggleFavorite(coinId);
    saveFavorites(favorites);
    renderCoins(coins, currentPage, 25);
}

//Toggle favorite status
const toggleFavorite = (coinId) => {
    let favorites = getFavorites();
    if (favorites.includes(coinId)){
        favorites = favorites.filter(id => id !== coinId);
    } else {
        favorites.push(coinId);
    }

    return favorites;
};

//Render Coin
const renderCoins = (coinsToDisplay, page,itemsPerPage) => {
    const start = (page - 1) * itemsPerPage + 1;
    const favorites = getFavorites();
    const tableBody = document.querySelector('#crypto-table tbody');
    tableBody.innerHTML = '';

    coinsToDisplay.forEach((coin, index) => {
        const row = renderCoinRow(coin, index, start, favorites);
        attachRowEvents(row, coin.id);
       tableBody.appendChild(row);
    });
};

const renderCoinRow = (coin, index, start, favorites) => {
    const isFavorite = favorites.includes(coin.id);
    const row = document.createElement('tr');
    row.innerHTML = `
    <td>${start + index} </td>
    <td><img src="${coin.image}" alt="${coin.name}" width ="24" height="24"/></td>
    <td>${coin.name}</td>
    <td>$${coin.current_price.toLocaleString()}</td>
    <td>$${coin.total_volume.toLocaleString()}</td>
    <td>$${coin.market_cap.toLocaleString()}</td>
    <td> <i class="fas fa-star favorite-icon ${isFavorite ? 'favorite' : ''}" data-id="${coin.id}"></i></td>
    `;
    return row;
}

// Attach events to a coin row
const attachRowEvents = (row, coinId) => {
    row.addEventListener('click', (event) => {
       if(!event.target.classList.contains('favorite-icon')){
           window.location.href = `coin.html?id=${coinId}`;
       }
    });

    row.querySelector('.favorite-icon').addEventListener('click', (event) => {
        event.stopPropagation();
        handleFavoriteClick(coinId);
    });
};

//previous button
const handlePrevButtonClick = async () => {
    if(currentPage > 1){
        currentPage--;
        await fetchCoins(currentPage);
        renderCoins(coins, currentPage, 25);
        updatePaginationControls();
    }
}

//next button
 const handleNextButtonClick = async () => {
    currentPage++;
    await fetchCoins(currentPage);
    renderCoins(coins, currentPage, 25);
    updatePaginationControls();
 }
 const previousButton = document.querySelector('#prev-button');
 const nextButton = document.querySelector('#next-button');

 const updatePaginationControls = () => {
    previousButton.disabled = currentPage === 1;
    nextButton.disabled = coins.length < 25;
};

document.addEventListener('DOMContentLoaded',initializePage);
previousButton.addEventListener('click', handlePrevButtonClick);
nextButton.addEventListener('click', handleNextButtonClick);


const sortCoinsByField = (field, order) => {
    coins.sort((a,b) => 
        order === 'asc' ? a[field] - b[field] : b[field] - a[field]
    );

    renderCoins(coins, currentPage, 25);
}

document.querySelector('#sort-price-asc').addEventListener('click', () => sortCoinsByField('current_price', 'asc'));
document.querySelector('#sort-price-desc').addEventListener('click', () => sortCoinsByField('current_price', 'desc'));
document.querySelector('#sort-volume-asc').addEventListener('click' , () => sortCoinsByField('total_volume', 'asc'));
document.querySelector('#sort-volume-desc').addEventListener('click', () => sortCoinsByField('total_volume', 'desc'));
document.querySelector('#sort-market-asc').addEventListener('click', ()=> sortCoinsByField('market_cap', 'asc'));
document.querySelector('#sort-market-desc').addEventListener('click', () => sortCoinsByField('market_cap', 'desc'));


//Fetch display search result
const  fetchSearchResults = async (query) => {
    try{
       const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`, options)
       const data = await response.json();
       return data.coins;
    }catch(err) {
        console.error("Error fetching search result:", err);
        return [];
    };
}

// show search result in dialog
const showSearchResults =  (results) => {
    const searchDialog = document.querySelector('#search-dialog');
    const resultsList = document.querySelector('#search-results');

    resultsList.innerHTML = '';
    if(results.length !== 0){
    results.slice(0, 10).forEach( result => {
        const listItem = document.createElement('li');
        listItem.innerHTML=`
        <img src="${result.thumb}" alt="${result.name}" width = "24" height="24"/>
        <span>${result.name}</span>`;
        listItem.dataset.id = result.id;
        resultsList.appendChild(listItem);
    });
} else {
    resultsList.innerHTML = '<li>No coin found.</li>';
}

    // Attach click event to each list item
    resultsList.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', (event) => {
            const coinId = event.currentTarget.dataset.id; // retive the coin ID from data attribute
            window.location.href = `coin.html?id=${coinId}`
        });
    });

    searchDialog.style.display = 'block';
};


// Close the search dialog
const closeSearchDialog = () => {
    const searchDialog = document.querySelector('#search-dialog');
    searchDialog.style.display = 'none';
};

//Handle Search input
const handleSearchInput = async () => {
    const searchTerm = document.querySelector('#search-box').value.trim();
    if(searchTerm){
        const results = await fetchSearchResults(searchTerm);
        showSearchResults(results);
    } else {
        closeSearchDialog();
    }
}

document.querySelector('#search-box').addEventListener('input', handleSearchInput);
document.querySelector('#search-icon').addEventListener('click', handleSearchInput);
document.querySelector('#close-dialog').addEventListener('click', closeSearchDialog);



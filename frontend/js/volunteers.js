const userSpan = document.querySelector('#userSpan');
const collectsTable = document.querySelector('#collectsTable');
const citySelector = document.querySelector('#citySelector');
const trashButtonsContainer = document.querySelector('#trashButtonsContainer');

let itemNumber = 0;

document.addEventListener('DOMContentLoaded', function () {
    const declareCollectButton = document.getElementById('declareCollectButton');
    const dashboard = document.getElementById('dashboard');

    declareCollectButton.addEventListener('click', function () {
        dashboard.style.display = 'none';
    });

    const cancelButton = document.getElementById('cancelButton');

    cancelButton.addEventListener('click', function () {
        window.location.reload();
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const defaultUserName = "Invité";

    if (userId) {
        try {
            const response = await fetch(`http://localhost:3000/users/${userId}`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const user = await response.json();
            if (user) {
                userSpan.textContent = user.first_name;
            } else {
                userSpan.textContent = defaultUserName;
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de l'utilisateur :", error);
            userSpan.textContent = defaultUserName;
        };
    };

    try {
        // Fetch collects for the specific user
        const collectsResponse = await fetch(`http://localhost:3000/collects`);
        if (!collectsResponse.ok) {
            throw new Error(`Erreur HTTP: ${collectsResponse.status}`);
        }
        const collects = await collectsResponse.json();
        // Populate the table with the collects data
        for (const collect of collects.data) {
            collectsTable.innerHTML += `<tr>
                    <td>${collect.city_id}</td>
                    <td>${collect.date}</td>
                    <td>${collect.collected_trashes}</td>
                    <td><table>🔍</table></td>
                </tr>`;
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des données de collecte :', error);
        alert('Une erreur est survenue lors de la récupération des données de collecte. Veuillez réessayer.');
    };

    try {
        const citiesResponse = await fetch('http://localhost:3000/cities');
        if (!citiesResponse.ok) {
            throw new Error(`Erreur HTTP: ${citiesResponse.status}`);
        }
        const cities = await citiesResponse.json();
        // Populate the city selector with the cities
        for (const city of cities.data) {
            citySelector.innerHTML += `<option value="${city.id}">${city.name}</option>`;
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des villes :', error);
        alert('Une erreur est survenue lors de la récupération des villes. Veuillez réessayer.');
    };

    try {
        const trashesResponse = await fetch('http://localhost:3000/trashes');
        if (!trashesResponse.ok) {
            throw new Error(`Erreur HTTP: ${trashesResponse.status}`);
        }
        const trashes = await trashesResponse.json();
        console.log("voici la liste des déchets :", trashes);
        for (const trash of trashes.data) {
            trashButtonsContainer.innerHTML += `<div class="trashButtons"><div><h3>${trash.emoji}</h3></div><div><button class="minus">-</button></div>
            <div><span id="item-${itemNumber}"> 0</span> ${trash.trash_name} </br>(${trash.trash_score} points)</div><div><button class="plus">+</button></div></div>`;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des types de déchets :', error);
        alert('Une erreur est survenue lors de la récupération des types de déchets. Veuillez réessayer.');
    };
});
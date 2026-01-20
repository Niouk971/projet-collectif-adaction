const API_URL = "https://projet-collectif-adaction.onrender.com"; // ← mets ton URL Render ici

const userSpan = document.querySelector('#userSpan');
const collectsTable = document.querySelector('#collectsTable');
const citySelector = document.querySelector('#citySelector');
const trashButtonsContainer = document.querySelector('#trashButtonsContainer');
const cancelButton = document.querySelector('#cancelButton');
const buttonMinus = document.getElementsByClassName('minus');
const buttonPlus = document.getElementsByClassName('plus');
let itemNumber = 0;

const reloadPage = () => {
    window.location.href = window.location.href;
};

cancelButton.addEventListener('click', reloadPage);

// affiche le prénom de l'usager connecté
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const defaultUserName = "Invité";

    if (userId) {
        try {
            const response = await fetch(`${API_URL}/users/${userId}`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const user = await response.json();
            userSpan.textContent = user ? user.first_name : defaultUserName;
        } catch (error) {
            console.error("Erreur lors de la récupération de l'utilisateur :", error);
            userSpan.textContent = defaultUserName;
        }
    }

    // Liste les collectes du bénévole dans le tableau
    try {
        const collectsResponse = await fetch(`${API_URL}/collects?user_id=${userId}`);
        if (!collectsResponse.ok) {
            throw new Error(`Erreur HTTP: ${collectsResponse.status}`);
        }
        const collects = await collectsResponse.json();

        for (const collect of collects.data) {
            // Fetch collected trashes for the specific collect
            const collectedTrashesResponse = await fetch(`${API_URL}/collected_trashes?collect_id=${collect.id}`);
            if (!collectedTrashesResponse.ok) {
                throw new Error(`Erreur HTTP: ${collectedTrashesResponse.status}`);
            }
            const collectedTrashes = await collectedTrashesResponse.json();

            let cigaretteButts = 0;
            let plasticPackages = 0;
            let glassBottles = 0;
            let fishingGear = 0;
            let metalObjects = 0;

            for (const collectedTrash of collectedTrashes.data) {
                switch (collectedTrash.trash_id) {
                    case 1:
                        cigaretteButts = collectedTrash.quantity;
                        break;
                    case 2:
                        plasticPackages = collectedTrash.quantity;
                        break;
                    case 3:
                        glassBottles = collectedTrash.quantity;
                        break;
                    case 4:
                        fishingGear = collectedTrash.quantity;
                        break;
                    case 5:
                        metalObjects = collectedTrash.quantity;
                        break;
                }
            }

            collectsTable.innerHTML += `
                <tr>
                    <td>${collect.city_name || 'Ville inconnue'}</td>
                    <td>${collect.date.split('T')[0]}</td>
                    <td>${cigaretteButts}</td>
                    <td>${plasticPackages}</td>
                    <td>${glassBottles}</td>
                    <td>${fishingGear}</td>
                    <td>${metalObjects}</td>
                </tr>`;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données de collecte :', error);
        alert('Une erreur est survenue lors de la récupération des données de collecte. Veuillez réessayer.');
    }

    // Liste des villes
    try {
        const citiesResponse = await fetch(`${API_URL}/cities`);
        if (!citiesResponse.ok) {
            throw new Error(`Erreur HTTP: ${citiesResponse.status}`);
        }
        const cities = await citiesResponse.json();

        for (const city of cities.data) {
            citySelector.innerHTML += `<option value="${city.id}">${city.name}</option>`;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des villes :', error);
        alert('Une erreur est survenue lors de la récupération des villes. Veuillez réessayer.');
    }

    // Liste des types de déchets
    try {
        const trashesResponse = await fetch(`${API_URL}/trashes`);
        if (!trashesResponse.ok) {
            throw new Error(`Erreur HTTP: ${trashesResponse.status}`);
        }
        const trashes = await trashesResponse.json();
        console.log("voici la liste des déchets :", trashes);

        for (const trash of trashes.data) {
            trashButtonsContainer.innerHTML += `
            <div class="trashButtons">
                <div>
                    <h3>${trash.emoji}</h3>
                </div>
                <div id="addANumber">
                    <div>
                        <button type="button" class="minus" data-item-number="${itemNumber}">-</button>
                    </div>
                    <div>
                        <span id="item-${itemNumber}">0</span> ${trash.trash_name}
                    </div>
                    <div>
                        <button type="button" class="plus" data-item-number="${itemNumber}">+</button>
                    </div>
                <div>
            </div>`;
            itemNumber++;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des types de déchets :', error);
        alert('Une erreur est survenue lors de la récupération des types de déchets. Veuillez réessayer.');
    }
});

const updateItemCount = (index, delta) => {
    const itemSpan = document.getElementById(`item-${index}`);
    let currentCount = parseInt(itemSpan.textContent);
    currentCount += delta;
    if (currentCount < 0) currentCount = 0;
    itemSpan.textContent = currentCount;
}

trashButtonsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('plus')) {
        const itemNumber = parseInt(event.target.dataset.itemNumber);
        updateItemCount(itemNumber, 1);
    } else if (event.target.classList.contains('minus')) {
        const itemNumber = parseInt(event.target.dataset.itemNumber);
        updateItemCount(itemNumber, -1);
    }
});

// Enregistrement d'une nouvelle collecte
newCollectFormElem.addEventListener('submit', async (event) => {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const collectCity = document.querySelector('#citySelector').value;
    const collectDate = document.querySelector('#collectDate').value;

    let trashes = [];
    for (let i = 0; i < itemNumber; i++) {
        const itemSpan = document.getElementById(`item-${i}`);
        const currentCount = parseInt(itemSpan.textContent);
        trashes.push(currentCount);
    }

    const collectData = {
        user_id: userId,
        city_id: collectCity,
        date: collectDate,
    };

    try {
        const response = await fetch(`${API_URL}/collects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(collectData),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success:', result);

        const collectId = result.id;
        console.log('New collect ID:', collectId);

        // Envoi des déchets collectés
        for (let i = 0; i < itemNumber; i++) {
            const itemSpan = document.getElementById(`item-${i}`);
            const currentCount = parseInt(itemSpan.textContent);

            if (currentCount > 0) {
                const trashId = i + 1;
                const collectedTrashData = {
                    collect_id: collectId,
                    trash_id: trashId,
                    quantity: currentCount
                };

                try {
                    const collectedTrashResponse = await fetch(`${API_URL}/collected_trashes`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(collectedTrashData),
                    });

                    if (!collectedTrashResponse.ok) {
                        throw new Error(`Erreur HTTP: ${collectedTrashResponse.status}`);
                    }

                    const collectedTrashResult = await collectedTrashResponse.json();
                    console.log(`Success for trash ${trashId}:`, collectedTrashResult);

                } catch (error) {
                    console.error(`Error for trash ${trashId}:`, error);
                    alert(`Une erreur est survenue lors de l'enregistrement des déchets collectés pour le type ${trashId}. Veuillez réessayer.`);
                }
            }
        }

        reloadPage();

    } catch (error) {
        console.error('Error:', error);
        alert('Une erreur est survenue lors de l\'enregistrement de la collecte. Veuillez réessayer.');
    }
});
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

    // Liste les collectes du bénévole dans le tableau
    try {
        const collectsResponse = await fetch(`http://localhost:3000/collects?user_id=${userId}`);
        if (!collectsResponse.ok) {
            throw new Error(`Erreur HTTP: ${collectsResponse.status}`);
        }
        const collects = await collectsResponse.json();

        // Populate the table with the collects data
        for (const collect of collects.data) {
            // Fetch collected trashes for the specific collect
            const collectedTrashesResponse = await fetch(`http://localhost:3000/collected_trashes?collect_id=${collect.id}`);
            if (!collectedTrashesResponse.ok) {
                throw new Error(`Erreur HTTP: ${collectedTrashesResponse.status}`);
            }
            const collectedTrashes = await collectedTrashesResponse.json();

            // Initialize trash counts
            let cigaretteButts = 0;
            let plasticPackages = 0;
            let glassBottles = 0;
            let fishingGear = 0;
            let metalObjects = 0;

            // Aggregate trash counts from collected_trashes
            for (const collectedTrash of collectedTrashes.data) {
                switch (collectedTrash.trash_id) {
                    case 1: // Cigarette butts
                        cigaretteButts = collectedTrash.quantity;
                        break;
                    case 2: // Plastic packages
                        plasticPackages = collectedTrash.quantity;
                        break;
                    case 3: // Glass bottles
                        glassBottles = collectedTrash.quantity;
                        break;
                    case 4: // Fishing gear
                        fishingGear = collectedTrash.quantity;
                        break;
                    case 5: // Metal objects
                        metalObjects = collectedTrash.quantity;
                        break;
                }
            }

            collectsTable.innerHTML += `<tr>
                    <td>${collect.city_id}</td>
                    <td>${collect.date.split('T')[0]}</td>
                    <td>${cigaretteButts}</td>
                    <td>${plasticPackages}</td>
                    <td>${glassBottles}</td>
                    <td>${fishingGear}</td>
                    <td>${metalObjects}</td>
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
            trashButtonsContainer.innerHTML += `<div class="trashButtons"><div><h3>${trash.emoji}</h3></div><div><button type="button" class="minus" data-item-number="${itemNumber}">-</button></div>
            <div><span id="item-${itemNumber}"> 0</span> ${trash.trash_name} </br>(${trash.trash_score} points)</div><div><button type="button" class="plus" data-item-number="${itemNumber}">+</button></div></div>`;
            itemNumber++;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des types de déchets :', error);
        alert('Une erreur est survenue lors de la récupération des types de déchets. Veuillez réessayer.');
    };
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
        const response = await fetch('http://localhost:3000/collects', {
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


        const collectId = result.id; // Assuming the response includes the new collect's ID
        console.log('New collect ID:', collectId);

        // Send the collected trash data to the server
        for (let i = 0; i < itemNumber; i++) {
            const itemSpan = document.getElementById(`item-${i}`);
            const currentCount = parseInt(itemSpan.textContent);

            if (currentCount > 0) {
                const trashId = i + 1; // Assuming trash ID is the index + 1
                const collectedTrashData = {
                    collect_id: collectId,
                    trash_id: trashId,
                    quantity: currentCount
                };

                try {
                    const collectedTrashResponse = await fetch('http://localhost:3000/collected_trashes', {
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
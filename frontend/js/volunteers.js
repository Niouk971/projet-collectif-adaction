const userSpan = document.querySelector('#userSpan');
const collectsTable = document.querySelector('#collectsTable');

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
        }
    } else {
        userSpan.textContent = defaultUserName;
    };
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/collects');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const collects = await response.json();
        for (const collect of collects) {
            collectsTable.innerHTML += `<tr>
                <td>${collect.user_id}</td>
                <td>${collect.city_id}</td>
                <td>${collect.date}</td>
            </tr>`;
        };

    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    };
});
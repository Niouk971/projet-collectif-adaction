import { fetchFromAPI } from "../functions/fetchFromAPI.js";

const userSelector = document.querySelector('#userSelector');
const userForm = document.querySelector('#userForm');


// 🧑‍🤝‍🧑 Pour remplir le <select> avec les usagers
async function fetchUsers(order = 'asc', sort = 'first_name') {
    try {
        const users = await fetchFromAPI(`users?sort=${sort}&order=${order}`);

        // 🔍 Vérifie que les données sont bien reçues
        if (!users || !users.data) {
            alert("Aucune donnée reçue pour les usagers.");
            console.warn("Réponse vide ou mal formée :", users);
            return;
        }

        console.log("voici la liste des usagers :", users);

        // 🧱 Réinitialise le <select>
        userSelector.innerHTML = `<option value="0">-- Choisissez votre nom dans la liste --</option>`;

        // 🧑‍💼 Ajoute chaque usager dans la liste déroulante
        for (const user of users.data) {
            const adminTag = user.is_admin ? " (admin)" : "";
            const displayName = `${user.first_name} ${user.last_name}${adminTag}`;
            userSelector.innerHTML += `<option value="${user.id}">${displayName}</option>`;
        }
    } catch (err) {
        console.error("Erreur lors du chargement des usagers :", err.message);
        alert("Impossible de charger la liste des usagers. Veuillez réessayer plus tard.");
    }
}

fetchUsers();


//pour rediriger vers la bonne page selon le type d'usager
userForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const userId = document.getElementById('userSelector').value;

    if (userId === "0" || userId === "") {
        alert("Veuillez choisir votre nom dans la liste avant de continuer.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/users/${userId}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const user = await response.json();
        if (user.is_admin) {
            window.location.href = `admin.html?userId=${user.id}`;
        } else {
            window.location.href = `volunteers.html?userId=${user.id}`;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    }
});
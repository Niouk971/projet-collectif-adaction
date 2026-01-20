import { fetchFromAPI } from "../functions/fetchFromAPI.js";

const API_URL = "https://projet-collectif-adaction.onrender.com"; // ← remplace par ton URL Render

const userSelector = document.querySelector('#userSelector');
const userForm = document.querySelector('#userForm');

// 🧑‍🤝‍🧑 Pour remplir le <select> avec les usagers
async function fetchUsers(order = 'asc', sort = 'first_name') {
    try {
        const users = await fetchFromAPI(`users?sort=${sort}&order=${order}`);

        if (!users || !users.data) {
            alert("Aucune donnée reçue pour les usagers.");
            console.warn("Réponse vide ou mal formée :", users);
            return;
        }

        console.log("voici la liste des usagers :", users);

        if (userSelector) {
            userSelector.innerHTML = `<option value="0">-- Choisissez votre nom dans la liste --</option>`;

            for (const user of users.data) {
                const adminTag = user.is_admin ? " (admin)" : "";
                const displayName = `${user.first_name} ${user.last_name}${adminTag}`;
                userSelector.innerHTML += `<option value="${user.id}">${displayName}</option>`;
            }
        } else {
            console.error("L'élément #userSelector n'a pas été trouvé dans le DOM.");
        }
    } catch (err) {
        console.error("Erreur lors du chargement des usagers :", err.message);
        alert("Impossible de charger la liste des usagers. Veuillez réessayer plus tard.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    if (userForm) {
        userForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const userId = document.getElementById('userSelector').value;

            if (userId === "0" || userId === "") {
                alert("Veuillez choisir votre nom dans la liste avant de continuer.");
                return;
            }

            try {
                const response = await fetch(`${API_URL}/users/${userId}`);
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
    } else {
        console.error("L'élément #userForm n'a pas été trouvé dans le DOM.");
    }
});
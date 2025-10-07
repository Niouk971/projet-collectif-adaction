const userSpan = document.querySelector('#userSpan');
const adminTable = document.querySelector('#adminTable');

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
        const response = await fetch('http://localhost:3000/users');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const users = await response.json();
        for (const user of users.data) {
            adminTable.innerHTML += `<tr>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.city}</td>
                <td><a href="mailto:${user.email}">${user.email}</a></td>
                <td>${user.score}</td>
                <td>${user.created_at}</td>
                <td>${user.is_admin ? "⭐" : ""}</td>
                <td><button>✏️</button></td>
            </tr>`;
        };

    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    };
});
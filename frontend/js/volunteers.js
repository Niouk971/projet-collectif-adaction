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

        try {
            // Fetch collects for the specific user
            const collectsResponse = await fetch(`http://localhost:3000/collects?userId=${userId}`);
            if (!collectsResponse.ok) {
                throw new Error(`Erreur HTTP: ${collectsResponse.status}`);
            }
            const collects = await collectsResponse.json();
            // Populate the table with the collects data
            collects.forEach(collect => {
                collectsTable.innerHTML += `<tr>
                    <td>${collect.city_id}</td>
                    <td>${collect.date}</td>
                    <td>${collect.collected_trashes}</td>
                    <td><table>🔍</table></td>
                </tr>`;
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des données de collecte :', error);
            alert('Une erreur est survenue lors de la récupération des données de collecte. Veuillez réessayer.');
        }
    } else {
        userSpan.textContent = defaultUserName;
    };
});
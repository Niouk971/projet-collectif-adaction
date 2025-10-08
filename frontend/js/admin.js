const userSpan = document.querySelector('#userSpan');
const adminTable = document.querySelector('#adminTable');
const cancelButton = document.querySelector('#cancelButton');
const volunteerFirstName = document.querySelector('#volunteerFirstName');
const volunteerLastName = document.querySelector('#volunteerLastName');
const volunteerEmail = document.querySelector('#volunteerEmail');
const volunteerCity = document.querySelector('#citySelector');
const isAdminCheckbox = document.querySelector('#isAdminCheckbox');
const newVolunteerFormElem = document.querySelector('#newVolunteerFormElem');

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
        }
    } else {
        userSpan.textContent = defaultUserName;
    };

    // liste les usagers dans le tableau admin
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
                <td>${user.created_at.split('T')[0]}</td>
                <td>${user.is_admin ? "⭐" : ""}</td>
                <td><button>✏️</button></td>
            </tr>`;
        };

    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    };

    // liste les villes dans le select du formulaire de création de bénévole
    try {
        const citiesResponse = await fetch('http://localhost:3000/cities');
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

});

newVolunteerFormElem.addEventListener('submit', async (event) => {
    event.preventDefault();

    const volunteerData = {
        first_name: volunteerFirstName.value,
        last_name: volunteerLastName.value,
        email: volunteerEmail.value,
        city_id: volunteerCity.value,
        is_admin: isAdminCheckbox.checked
    };

    try {
        const response = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(volunteerData)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success:', result);
        reloadPage();

    } catch (error) {
        console.error('Error:', error);
        alert('Une erreur est survenue lors de l\'enregistrement du bénévole. Veuillez réessayer.');
    }
});
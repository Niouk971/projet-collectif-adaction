const userSelector = document.querySelector('#userSelector');

async function fetchUsers() {
    try {
        const res = await fetch(`http://localhost:3000/users`);
        const users = await res.json();


        console.log("voici la liste des usagers :", users);

        userSelector.innerHTML = `<option>-- Choisissez votre nom dans la liste --</option>`
        for (const user of users) {
            userSelector.innerHTML +=
                `<option value="${user.id}">${user.first_name} ${user.last_name}</option>`
        };
    }
    catch (err) {
        console.error("Erreur :", err);
    }
}

fetchUsers()

document.getElementById('userForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const userId = document.getElementById('userSelector').value;

        fetch(`URL_TO_YOUR_BACKEND/users/${userId}`)
            .then(response => response.json())
            .then(user => {
                if (user.is_admin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'volunteers.html';
                };
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                alert('An error occurred. Please try again.');
            });
    });
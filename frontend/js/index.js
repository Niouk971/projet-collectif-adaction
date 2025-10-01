const userSelector = document.querySelector('#userSelector');

console.log("coucou je suis syncro");

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
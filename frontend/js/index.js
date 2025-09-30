const userSelector = document.querySelector('#userSelector');

console.log("coucou je suis syncro");

async function fetchUsers() {
    try {
        const res = await fetch(`http://localhost:3000/users`);
        const users = await res.json();


        console.log("voici la liste des usagers :", users);

        for (let user of users) {
            console.log("je m'appelle", user.first_name, user.last_name)
        };
    }
    catch (err) {
        console.error("Erreur :", err);
    }
}

fetchUsers()
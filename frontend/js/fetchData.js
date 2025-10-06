async function fetchData(element) {
    try {
        const res = await fetch(`http://localhost:3000/${element}`);
        const data = await res.json();

        console.log("voici la liste de votre data :", data);

        userSelector.innerHTML = `<option value="0">-- Choisissez votre nom dans la liste --</option>`
        for (const user of users) {
            const adminTag = user.is_admin ? " (admin)" : "";
            const displayName = `${user.first_name} ${user.last_name}${adminTag}`;
            userSelector.innerHTML +=
                `<option value="${user.id}">${displayName}</option>`
        };
    } catch (err) {
        console.error("Erreur :", err);
    };
};
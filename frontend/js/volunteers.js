const userSpan = document.querySelector('#userSpan');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');

    if (userId) {
        fetch(`http://localhost:3000/user/${userId}`)
            .then(response => response.json())
            .then(user => {
                if (user) {
                    userSpan.textContent = user.firstname;
                };
            })
            .catch(error => {
                console.error("Error fetching user:", error);
                userSpan.textContent = "Invité";
            });
    } else {
        userSpan.textContent = "Invité";
    }
});
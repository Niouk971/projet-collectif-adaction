export async function fetchFromAPI(element, options = {}) {
    try {
        const res = await fetch(`http://localhost:3000/${element}`, options);

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Erreur ${res.status} : ${errorText}`);
        }

        const data = await res.json();
        return data;
    } catch (err) {
        console.error("Erreur lors du fetch :", err.message);
        return null;
    }
}
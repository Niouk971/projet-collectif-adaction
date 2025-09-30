// npm init
// npm install express
// npm install nodemon
// npm install cors
// npm install pg

import express from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://127.0.0.1:5500/menu" }));

const frontendPath = path.join(process.cwd(), "../nodejs_frontend");
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.send("Accueil");
});

// Ajoutez cette fonction pour tester la connexion
const testDbConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Connexion à la base de données réussie !');
        client.release();
    } catch (err) {
        console.error('Erreur de connexion à la base de données:', err);
    }
};

// Appelez la fonction de test
testDbConnection();

// Exemple de requête pour récupérer les plats depuis la base de données
app.get("/menus", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menus');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.get("/menu/:id", (req, res) => {
    const id = Number(req.params.id);
    const plat = data.find(p => p.id === id);
    if (!plat) return res.status(404).json({ error: `Plat id=${id} non trouvé` });
    res.json(plat);
});

app.listen(3000, () => { console.log("Serveur lancé sur http://localhost:3000"); });
// npm init
// npm install express
// npm install nodemon
// npm install cors
// npm install pg
// npm install dotenv

// Pour les logs des requêtes dans le terminal
// npm install morgan


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import path from "path";
import morgan from 'morgan';


dotenv.config();


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        require: true,
    },
});

const app = express();


// const PORT = process.env.PORT || 3000;
app.use(express.json());

app.use(cors({ origin: "http://127.0.0.1:5500" }));


// Configuration du chemin statique
const frontendPath = path.join(process.cwd(), "../frontend");
app.use(express.static(frontendPath));

app.use(morgan('dev')); // Logs les requêtes HTTP
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


// Route pour servir index.html
app.get("/", (req, res) => {
    res.sendFile('html/index.html', { root: frontendPath });
});

// Route pour servir charity.html
app.get("/charity", (req, res) => {
    res.sendFile('html/charity.html', { root: frontendPath });
});

// Route pour servir volunteers.html
app.get("/volunteers", (req, res) => {
    res.sendFile('html/volunteers.html', { root: frontendPath });
});


// Tester la connexion
const testDbConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Connexion à la base de données réussie !');
        client.release();
    } catch (err) {
        console.error('Erreur de connexion à la base de données:', err);
    }
};

testDbConnection();


// Récupérer les utilisateurs depuis la base de données
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY first_name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


app.get("/user/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Utilisateur id=${id} non trouvé` });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


app.post("/orders", (req, res) => {
    const { id, plate, clientName } = req.body;
    if (!id || !plate || !clientName) {
        return res.status(400).json({ error: "Champs manquants ou invalides" });
    };

    console.log(`[COMMANDE REÇUE] id=${id} | plat="${plate}" | client="${clientName}"`);
    // remplacer par insert into (sql)
    return res.status(201).json({ ok: true, message: `Commande reçue ${plate} pour ${clientName}` });
});

app.listen(3000, () => { console.log("Serveur lancé sur http://localhost:3000"); });
// ========================== INSTALL PACKAGES  ==========================


// npm init
// npm install express
// npm install nodemon
// npm install cors
// npm install pg
// npm install dotenv

// Pour les logs des requêtes dans le terminal
// npm install morgan



// ========================== IMPORTS & CONFIG  ==========================


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import morgan from 'morgan';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        require: true,
    },
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://127.0.0.1:5500" }));

app.use(morgan('dev')); // Logs les requêtes HTTP
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
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



// ========================== ROUTES : USERS  ==========================


// Récupérer les utilisateurs depuis la base de données
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exemple de requête curl pour tester la récupération des utilisateurs

// curl -X GET "http://localhost:3000/users" \
// -H "Content-Type: application/json"


// Récupérer un utilisateur par ID
app.get("/users/:id", async (req, res) => {
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

// Exemple de requête curl pour tester la récupération d'un utilisateur par ID

// curl -X GET "http://localhost:3000/user/1" \
// -H "Content-Type: application/json"


// Récupérer le nombre total d'utilisateurs
app.get("/users/count", async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exemple de requête curl pour tester la récupération du nombre d'utilisateurs

// curl -X GET "http://localhost:3000/users/count" \
// -H "Content-Type: application/json"


// Créer un nouvel utilisateur
app.post("/users", async (req, res) => {
    try {
        console.log('Received body:', req.body);
        
        const { first_name, last_name, email } = req.body;
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ 
                error: "Les champs first_name, last_name et email sont requis",
                received: req.body 
            });
        }
        
        const result = await pool.query(
            `INSERT INTO users (
                first_name, 
                last_name, 
                email,
                is_admin,
                score,
                created_at
            ) VALUES ($1, $2, $3, DEFAULT, DEFAULT, CURRENT_TIMESTAMP) RETURNING *`,
            [first_name, last_name, email]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Detailed error:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: "Cet email existe déjà" });
        }
        res.status(500).json({ 
            error: "Erreur serveur",
            details: err.message 
        });
    }
});

// Exemple de requête curl pour tester la création d'un utilisateur

// curl -X POST "http://localhost:3000/users" \
// -H "Content-Type: application/json" \
// -d '{
//     "first_name": "Marie",
//     "last_name": "Dupont",
//     "email": "marie.dupont@example.com"
// }'


// Modifier un utilisateur existant
app.put("/users/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { first_name, last_name, email } = req.body;

        const result = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4 RETURNING *',
            [first_name, last_name, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Utilisateur id=${id} non trouvé` });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exemple de requête curl pour tester la mise à jour d'un utilisateur

// curl -X PUT http://localhost:3000/users/22 \
//   -H "Content-Type: application/json" \
//   -d '{
//     "first_name": "Alice",
//     "last_name": "Dupont",
//     "email": "alice.dupont@example.com"
//   }'


// Supprimer un utilisateur
app.delete("/users/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Utilisateur id=${id} non trouvé` });
        }

        res.json({ message: `Utilisateur id=${id} supprimé` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Exemple de requête curl pour tester la suppression d'un utilisateur

// curl -X DELETE "http://localhost:3000/users/1"



// ========================== ROUTES : TRASHES  ==========================


// Récupérer les déchets depuis la base de données
app.get("/trashes", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM trashes');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 🔍 Récupérer un déchet par son ID
app.get("/trashes/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await pool.query(
            'SELECT * FROM trashes WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Déchet id=${id} non trouvé` });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération du déchet :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});



// ========================== LANCEMENT SERVEUR  ==========================


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

// ========================== INSTALL PACKAGES  ==========================


// npm init
// npm install express nodemon cors pg dotenv morgan



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



// ========================== ROUTES : GET  ==========================


// GET générique pour n'importe quelle table
// app.get("/:table", async (req, res) => {
//     const { table } = req.params;

//     // Vérification simple pour éviter l'injection SQL
//     const validTables = ["users", "trashes", "cities", "collects"];
//     if (!validTables.includes(table)) {
//         return res.status(400).json({ error: "Table non autorisée" });
//     }

//     try {
//         const result = await pool.query(`SELECT * FROM ${table} ORDER BY 1`);
//         res.json(result.rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Erreur serveur" });
//     }
// });


app.get("/:table", async (req, res) => {
    const { table } = req.params;
    const filters = req.query;

    // 🔒 Liste blanche pour éviter l'injection SQL
    const validTables = ["users", "trashes", "cities", "collects"];
    if (!validTables.includes(table)) {
        return res.status(400).json({ error: "Table non autorisée" });
    }

    const whereClauses = []; // Liste des conditions WHERE
    const values = [];       // Valeurs associées aux paramètres SQL ($1, $2, ...)
    let i = 1;               // Compteur pour les placeholders SQL

    // 🔍 Construction dynamique des filtres
    for (const [key, value] of Object.entries(filters)) {
        // ⏩ Ignorer les paramètres de tri/pagination
        if (["sort", "order", "limit", "offset"].includes(key)) continue;

        // 🔧 Si le filtre contient un opérateur (ex: price[gt]=10)
        if (typeof value === "object") {
            for (const [op, val] of Object.entries(value)) {
                let sqlOp;
                switch (op) {
                    case "gt": sqlOp = ">"; break;
                    case "lt": sqlOp = "<"; break;
                    case "gte": sqlOp = ">="; break;
                    case "lte": sqlOp = "<="; break;
                    case "like": sqlOp = "LIKE"; break;
                    default:
                        return res.status(400).json({ error: `Opérateur non supporté: ${op}` });
                }
                whereClauses.push(`${key} ${sqlOp} $${i}`);
                values.push(op === "like" ? `%${val}%` : val);
                i++;
            }
        } else {
            // 🔧 Filtre simple (ex: status=pending)
            whereClauses.push(`${key} = $${i}`);
            values.push(value);
            i++;
        }
    }

    // 🧱 Construction de la clause WHERE
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 🔃 Tri des résultats
    const sort = filters.sort || "id";
    const order = (filters.order || "asc").toUpperCase();
    const orderSQL = `ORDER BY ${sort} ${["ASC", "DESC"].includes(order) ? order : "ASC"}`;

    // 📄 Pagination
    const limit = parseInt(filters.limit) || 10;
    const offset = parseInt(filters.offset) || 0;
    const paginationSQL = `LIMIT ${limit} OFFSET ${offset}`;

    // 📦 Requête principale + requête de comptage
    const query = `SELECT * FROM ${table} ${whereSQL} ${orderSQL} ${paginationSQL}`;
    const countQuery = `SELECT COUNT(*) FROM ${table} ${whereSQL}`;

    try {
        // 🧠 Exécuter les deux requêtes en parallèle
        const [dataResult, countResult] = await Promise.all([
            pool.query(query, values),
            pool.query(countQuery, values)
        ]);

        const totalCount = parseInt(countResult.rows[0].count); // 🔢 Nombre total d'éléments
        const hasNextPage = offset + limit < totalCount;        // ➕ Y a-t-il une page suivante ?
        const currentPage = Math.floor(offset / limit) + 1;     // 📍 Page actuelle

        // ✅ Réponse structurée
        res.json({
            total_count: totalCount,
            current_page: currentPage,
            has_next_page: hasNextPage,
            data: dataResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


app.get("/:table/:id", async (req, res) => {
    const { table, id } = req.params;
    const numericId = Number(id);

    // Liste blanche pour éviter l'injection SQL
    const validTables = ["users", "products", "orders", "categories"];
    if (!validTables.includes(table)) {
        return res.status(400).json({ error: "Table non autorisée" });
    }

    if (isNaN(numericId)) {
        return res.status(400).json({ error: "ID invalide" });
    }

    try {
        const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [numericId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `${table} id=${id} non trouvé` });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// Récupérer un utilisateur par ID
// app.get("/users/:id", async (req, res) => {
//     try {
//         const id = Number(req.params.id);
//         const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: `Utilisateur id=${id} non trouvé` });
//         }

//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Erreur serveur" });
//     }
// });




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

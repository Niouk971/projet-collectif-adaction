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



// ========================== ROUTE : POST  ==========================


app.post("/:table", async (req, res) => {
    const { table } = req.params;
    const data = req.body;

    const validTables = ["users", "trashes", "cities", "collects"];
    if (!validTables.includes(table)) {
        return res.status(400).json({ error: "Table non autorisée" });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;

    try {
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la création" });
    }
});



// ========================== ROUTE : PUT  ==========================


app.put("/:table/:id", async (req, res) => {
    const { table, id } = req.params;
    const data = req.body;

    const validTables = ["users", "trashes", "cities", "collects"];
    if (!validTables.includes(table)) {
        return res.status(400).json({ error: "Table non autorisée" });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const updates = keys.map((key, i) => `${key} = $${i + 1}`);

    const query = `UPDATE ${table} SET ${updates.join(", ")} WHERE id = $${keys.length + 1} RETURNING *`;

    try {
        const result = await pool.query(query, [...values, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `id=${id} non trouvé` });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
});



// ========================== ROUTE : PATCH  ==========================


app.patch("/:table/:id", async (req, res) => {
    const { table, id } = req.params;
    const data = req.body;

    const validTables = ["users", "trashes", "cities", "collects"];
    if (!validTables.includes(table)) {
        return res.status(400).json({ error: "Table non autorisée" });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const updates = keys.map((key, i) => `${key} = $${i + 1}`);

    const query = `UPDATE ${table} SET ${updates.join(", ")} WHERE id = $${keys.length + 1} RETURNING *`;

    try {
        const result = await pool.query(query, [...values, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `id=${id} non trouvé` });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors du patch" });
    }
});



// ========================== ROUTE : DELETE  ==========================


app.delete("/:table/:id", async (req, res) => {
    const { table, id } = req.params;

    const validTables = ["users", "trashes", "cities", "collects"];
    if (!validTables.includes(table)) {
        return res.status(400).json({ error: "Table non autorisée" });
    }

    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;

    try {
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `id=${id} non trouvé` });
        }
        res.json({ deleted: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
});



// ========================== LANCEMENT SERVEUR  ==========================


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

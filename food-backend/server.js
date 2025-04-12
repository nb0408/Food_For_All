require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Replaces bodyParser.json()

// PostgreSQL Connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Verify Database Connection
pool.connect()
    .then(() => console.log("Connected to PostgreSQL Database"))
    .catch((err) => console.error("Database Connection Error:", err));

// Handle Donate Form Submission
app.post("/donate", async (req, res) => {
    try {
        const { name, fooditem, foodQuantity, foodShelfLife, email, mobno, addr } = req.body;

        const query = `
            INSERT INTO food_donations 
            (ngo_name, food_item, quantity, shelf_life, email, contact_no, address) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await pool.query(query, [name, fooditem, foodQuantity, foodShelfLife, email, mobno, addr]);

        res.status(200).json({ message: "Food donation request submitted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

// Handle Contact Messages
app.post("/contact", async (req, res) => {
    try {
        console.log("Incoming request body:", req.body); // Debugging log
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const query = "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *";
        const values = [name, email, message];

        console.log("Executing Query:", query, values); // Debugging log

        const result = await pool.query(query, values);

        res.status(201).json({ message: "Message submitted successfully!", data: result.rows[0] });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/food", async (req, res) => {
    try {
        const foodName = req.query.name;
        if (!foodName) {
            return res.status(400).json({ error: "Food name is required" });
        }

        const query = `
            SELECT id, quantity, shelf_life, ngo_name, address
            FROM food_donations
            WHERE food_item = $1
            LIMIT 1
        `;

        const { rows } = await pool.query(query, [foodName]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Food details not found!" });
        }
        console.log("Fetched Data:", rows[0]);  // ✅ Debugging Step
        res.json(rows[0]); // Send the first matching result including ID
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/confirm-order", async (req, res) => {
    try {
        const { cart } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty!" });
        }

        const client = await pool.connect(); 

        try {
            await client.query("BEGIN");

            for (const item of cart) {
                const foodId = item.foodId;
                const deleteQuery = "DELETE FROM food_donations WHERE id = $1 RETURNING *";
                const deleteResult = await client.query(deleteQuery, [foodId]);

                if (deleteResult.rowCount === 0) {
                    throw new Error(`Item with ID ${foodId} not found. It may have already been taken.`);
                }
            }

            await client.query("COMMIT");

            res.json({ success: true, message: "✅ Order placed successfully!" });

        } catch (error) {
            await client.query("ROLLBACK");
            res.status(400).json({ success: false, message: error.message });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("❌ Error processing order:", error);
        res.status(500).json({ success: false, message: "Server error!" });
    }
});



// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increase body size limit to handle large Base64 images

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "test",
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL");

  // Create users table if not exists
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            banner TEXT
        )
    `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating table:", err);
    } else {
      console.log("Users table is ready");
    }
  });
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// API route to handle file upload
app.post("/upload", (req, res) => {
  const { name, banner } = req.body; // 'banner' is the Base64 string

  if (!name || !banner) {
    return res.status(400).json({ message: "Name and file are required" });
  }

  // Extract the Base64 string without the data URL prefix
  const base64Data = banner.replace(/^data:image\/\w+;base64,/, "");

  // Decode the Base64 string and save the file
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `${Date.now()}_image.png`; // Save as PNG (adjust if needed)
  const filePath = path.join(uploadDir, fileName);

  // Save the file
  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).json({ message: "Error saving file" });
    }

    // Insert user data into the database
    const query = "INSERT INTO users (name, banner) VALUES (?, ?)";
    db.query(query, [name, filePath], (err, result) => {
      if (err) {
        console.error("Error saving data to DB:", err);
        return res
          .status(500)
          .json({ message: "Error saving file metadata to DB" });
      }

      res.status(200).json({ message: "File uploaded successfully", filePath });
    });
  });
});

// Basic route
app.get("/backend_app", (req, res) => {
  return res.json("Hello, it's Tuma from backend");
});

// Start the server
app.listen(8001, () => {
  console.log("Hello Tuma, server is listening on port 8001");
});

app.get("/users", (req, res) => {
  const userQuery = "SELECT * FROM users";

  db.query(userQuery, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Database query failed", details: err.message });
    }
    return res.json(data);
  });
});


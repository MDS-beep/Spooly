const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, "..", "filaments.json");

// Read filaments data from file
function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, "[]", "utf-8");
  }
  const data = fs.readFileSync(DATA_PATH, "utf-8");
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write filaments data to file
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// API to get all filaments
app.get("/api/filaments", (req, res) => {
  const filaments = readData();
  res.json(filaments);
});

// API to add new filament
app.post("/api/filaments", (req, res) => {
  const filaments = readData();
  const newFilament = { ...req.body, id: Date.now() };
  filaments.unshift(newFilament);
  writeData(filaments);
  res.status(201).json(newFilament);
});

// API to update filament by id
app.put("/api/filaments/:id", (req, res) => {
  const filaments = readData();
  const id = parseInt(req.params.id);
  const idx = filaments.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "Filament not found" });
  filaments[idx] = { ...filaments[idx], ...req.body };
  writeData(filaments);
  res.json(filaments[idx]);
});

// API to delete filament by id
app.delete("/api/filaments/:id", (req, res) => {
  const filaments = readData();
  const id = parseInt(req.params.id);
  const idx = filaments.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "Filament not found" });
  filaments.splice(idx, 1);
  writeData(filaments);
  res.json({ success: true });
});


// API to import filaments (replace all)
app.post("/api/filaments/import", (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "Invalid data" });
  writeData(req.body);
  res.json({ success: true });
});

// SPA fallback to serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Spooly backend running on port ${PORT}`);
});



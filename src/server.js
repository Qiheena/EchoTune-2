// src/server.js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("✅ EchoTune bot is running on Render!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running at http://localhost:${PORT}`);
});
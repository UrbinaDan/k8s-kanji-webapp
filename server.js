const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const kanji = JSON.parse(fs.readFileSync("./kanji.json", "utf-8"));

app.get("/api/kanji", (req, res) => {
  res.json(kanji);
});

app.listen(PORT, () => {
  console.log(`Kanji Trainer running on port ${PORT}`);
});
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./src/routes/auth");
const i18n = require("i18n");

const app = express();

// Ajout du middleware i18n
app.use(i18n.init);

app.use(express.json());
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Authentification pour Taxi Chrono");
});

mongoose
  .connect(`${process.env.DB_CONNECTION_STRING}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connecté à la Base de données Mongodb");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Serveur en écoute sur le port: ${PORT}`));
  })
  .catch((err) => console.log(err));

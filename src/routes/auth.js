const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../model/Users");
const { generateOTP, sendSMS,validateEmail,validatePhone } = require("../util/otp");
const Nexmo = require("nexmo");
const i18n = require("i18n");

//configuration de i18n
i18n.configure({
  locales: ["en", "fr"], // Liste des langues prises en charge
  defaultLocale: "en", // Langue par défaut
  directory: __dirname + "/locales", // Répertoire contenant les fichiers de traduction
  objectNotation: true, // Utiliser la notation d'objet pour accéder aux traductions
});

// Liste noire des tokens
let blacklist = [];

// Configurer Nexmo avec vos clés d'API
const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
});

// Supprimer les tokens expirés de la liste noire
function cleanBlacklist() {
  const currentTime = Math.floor(Date.now() / 1000);
  blacklist = blacklist.filter(token => {
    const decodedToken = jwt.decode(token);
    if (decodedToken.exp > currentTime) {
      return true;
    }
    return false;
  });
}

// Appeler la fonction cleanBlacklist toutes les heures (3600000 millisecondes)
setInterval(cleanBlacklist, 3600000);

//Définition de la langue qui sera utilisée par le user
router.use((req, res, next) => {
  // Récupérer la langue à partir de la demande de l'utilisateur
  const lang = req.headers["accept-language"] || "en";

  // Définir la langue à utiliser pour la traduction
  i18n.setLocale(lang);

  next();
});

router.post("/register", async (req, res) => {
  const email = req.body.email;
  const phone = req.body.phone;

  // Valider l'adresse e-mail et le numéro de téléphone
  if (!validateEmail(email)) {
    return res.status(400).json({
      code: i18n.__("INVALID_EMAIL_FORMAT"),
      status: res.statusCode,
    });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      code: i18n.__("INVALID_PHONE_FORMAT"),
      status: res.statusCode,
    });
  }

  try {
    let user = await User.findOne({ phone: phone });

    // Si l'utilisateur n'existe pas, créer un nouvel utilisateur
    if (!user) {
      user = new User({ email: email, phone: phone });
    } else {
      return res.status(400).json({
        code: i18n.__("ALREADY_REGISTERED"),
        status: res.statusCode
      });
    }

    // Si l'utilisateur est bloqué, renvoyer une erreur
    if (user.isBlocked) {
      const currentTime = new Date();
      if (currentTime < user.blockUntil) {
        return res.status(403).json({
          code:i18n.__("ACCOUNT_BLOCKED"),
          status: res.statusCode
        });
      } else {
        user.isBlocked = false;
        user.OTPAttempts = 0;
      }
    }

    // Vérifier qu'il y a au moins 1 minute d'écart entre les demandes de code OTP
    const lastOTPTime = user.OTPCreatedTime;
    const currentTime = new Date();

    if (lastOTPTime && currentTime - lastOTPTime < 60000) {
      return res.status(403).json({
        code:i18n.__("OTP_REQUEST_LIMIT"),
        status: res.statusCode
      });
    }

    const OTP = generateOTP();
    user.OTP = OTP;
    user.OTPCreatedTime = currentTime;

    await user.save();

    // Envoyer le code OTP par SMS
    sendSMS(user.phone, OTP, nexmo);

    res.status(200).json({ code:i18n.__("SUCCESS"),status: res.statusCode });
  } catch (err) {
    console.log(err);
    if (res.statusCode === 500) {
      res.status(404).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: 404
      });
    } else {
      res.status(500).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: res.statusCode
      });
    }
  }
});

router.post("/verify-otp", async (req, res) => {
  const OTP = req.body.OTP;

  try {
    const user = await User.findOne({ OTP: OTP });

    if (!user) {
      return res.status(404).json({
        code:i18n.__("USER_NOT_FOUND"),
        status: res.statusCode
      });
    }

    // Vérifier si le compte de l'utilisateur est bloqué
    if (user.isBlocked) {
      const currentTime = new Date();
      if (currentTime < user.blockUntil) {
        return res.status(403).json({
          code:i18n.__("ACCOUNT_BLOCKED"),
          status: res.statusCode
        });
      } else {
        user.isBlocked = false;
        user.OTPAttempts = 0;
      }
    }

    // Vérifier si le code OTP est valide (moins de 5 minutes écoulées depuis sa création)
    const OTPCreatedTime = user.OTPCreatedTime;
    const currentTime = new Date();

    if (currentTime - OTPCreatedTime > 5 * 60 * 1000) {
      return res.status(403).json({
        code: i18n.__("OTP_EXPIRED"),
        status: res.statusCode
      });
    }

    // Réinitialiser le code OTP de l'utilisateur
    user.OTP = undefined;
    user.OTPCreatedTime = undefined;
    user.OTPAttempts = 0;
    user.isOTPVerified = true; // Mettre à jour la propriété isOTPVerified

    await user.save();
    res.status(200).json({ code: i18n.__("SUCCESS"), status: res.statusCode });
  } catch (err) {
    console.log(err);
    if (res.statusCode === 500) {
      res.status(404).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: 404
      });
    } else {
      res.status(500).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: res.statusCode
      });
    }
  }
});

router.post("/login", async (req, res) => {
  const phone = req.body.phone;

  try {
    const user = await User.findOne({ phone: phone });

    if (!user) {
      return res.status(404).json({
        code: i18n.__("USER_NOT_FOUND"),
        status: res.statusCode
      });
    }

    // Vérifier si le compte de l'utilisateur est bloqué
    if (user.isBlocked) {
      const currentTime = new Date();
      if (currentTime < user.blockUntil) {
        return res.status(403).json({
          code: i18n.__("ACCOUNT_BLOCKED"),
          status: res.statusCode
        });
      } else {
        user.isBlocked = false;
        user.OTPAttempts = 0;
      }
    }

    // Vérifier si l'OTP a été vérifié
    if (!user.isOTPVerified) {
      return res.status(403).json({
        code: i18n.__("OTP_NOT_VERIFIED"),
        status: res.statusCode
      });
    }

    // Générer le jeton d'accès
    const accessToken = jwt.sign({ phone: user.phone }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    // Générer un nouveau refresh token
    const refreshToken = jwt.sign({ phone: user.phone }, process.env.REFRESH_TOKEN_SECRET);

    // Sauvegarder le refresh token dans la base de données
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ code: i18n.__("SUCCESS"), status: res.statusCode, accessToken, refreshToken, user: { email: user.email, phone: user.phone } });
    console.log("Utilisateur connecté avec succès");
  } catch (err) {
    console.log(err);
    if (res.statusCode === 500) {
      res.status(404).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: 404
      });
    } else {
      res.status(500).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: res.statusCode
      });
    }
  }
});

router.post("/new-otp", async (req, res) => {
  const phone = req.body.phone;

  try {
    const user = await User.findOne({ phone: phone });

    if (!user) {
      return res.status(404).json({
        code: i18n.__("USER_NOT_FOUND"),
        status: res.statusCode
      });
    }

    // Vérifier si le compte de l'utilisateur est bloqué
    if (user.isBlocked) {
      const currentTime = new Date();
      if (currentTime < user.blockUntil) {
        return res.status(403).json({
          code: i18n.__("ACCOUNT_BLOCKED"),
          status: res.statusCode
        });
      } else {
        user.isBlocked = false;
        user.OTPAttempts = 0;
      }
    }

    // Vérifier si l'OTP a été vérifié
    if (user.isOTPVerified) {
      return res.status(403).json({
        code: i18n.__("OTP_ALREADY_VERIFIED"),
        status: res.statusCode
      });
    }

    // Vérifier si le code OTP a expiré
    const OTPCreatedTime = user.OTPCreatedTime;
    const currentTime = new Date();

    if (currentTime - OTPCreatedTime <= 5 * 60 * 1000) {
      return res.status(403).json({
        code: i18n.__("OTP_NOT_EXPIRED"),
        status: res.statusCode
      });
    }

    // Générer un nouveau code OTP
    const newOTP = generateOTP();
    user.OTP = newOTP;
    user.OTPCreatedTime = currentTime;
    user.OTPAttempts = 0;

    await user.save();

    // Envoyer le nouveau code OTP par SMS
    sendSMS(user.phone, newOTP, nexmo);

    res.status(200).json({ code: i18n.__("SUCCESS"), status: res.statusCode });
  } catch (err) {
    console.log(err);
    if (res.statusCode === 500) {
      res.status(404).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: 404
      });
    } else {
      res.status(500).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: res.statusCode
      });
    }
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.body.refreshToken;

  try {
    const user = await User.findOne({ refreshToken: refreshToken });

    if (!user) {
      return res.status(404).json({
        code: i18n.__("USER_NOT_FOUND"),
        status: res.statusCode
      });
    }

    // Supprimer le refresh token de l'utilisateur
    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({ code: i18n.__("SUCCESS"), status: res.statusCode });
  } catch (err) {
    console.log(err);
    if (res.statusCode === 500) {
      res.status(404).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: 404
      });
    } else {
      res.status(500).json({
        message: i18n.__("Quelque chose s'est mal passé"),
        status: res.statusCode
      });
    }
  }
});

module.exports = router;
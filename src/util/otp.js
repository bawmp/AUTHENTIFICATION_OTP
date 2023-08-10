const crypto = require("crypto");
const nexmo = require("nexmo");

// Fonction pour générer un code OTP aléatoire
const generateOTP = () => {
  const length = 4;
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

// Fonction pour envoyer un SMS contenant le code OTP
const sendSMS = (phone, OTP, nexmo) => {
  const from = process.env.YOUR_PHONE_NUMBER;
  const to = phone;
  const text = `Votre code OTP est : ${OTP}`;

  const options = {
    type: "unicode",
  };

  nexmo.message.sendSms(from, to, text,options, (err, responseData) => {
    if (err) {
      console.log(err);
    } else {
      console.log("SMS envoyé avec succès");
    }
  });
};
// Validation de l'adresse e-mail
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation du numéro de téléphone
function validatePhone(phone) {
  const phoneRegex = /^\+?[1-9]{1}[0-9]{3,14}$/;
  return phoneRegex.test(phone)
}

module.exports = { generateOTP, sendSMS, validateEmail,
  validatePhone};
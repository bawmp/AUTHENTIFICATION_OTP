Ce document décrit les différentes routes et fonctionnalités de l'API OTP. L'API permet d'enregistrer un utilisateur, de vérifier un code OTP, de se connecter, de générer un nouveau code OTP, et de se déconnecter.

## Installation

Pour utiliser l'API OTP, vous devez d'abord installer les dépendances nécessaires. Assurez-vous d'avoir [Node.js](https://nodejs.org) installé sur votre machine.

1. Clonez le dépôt de l'API OTP :

bash
git clone https://github.com/votre_utilisateur/api-otp.git
2. Accédez au répertoire du projet :

bash
cd api-otp
3. Installez les dépendances :

bash
npm install
4. Configurez les variables d'environnement :

Créez un fichier `.env` à la racine du projet et définissez les variables d'environnement suivantes :

NEXMO_API_KEY=YOUR_NEXMO_API_KEY
NEXMO_API_SECRET=YOUR_NEXMO_API_SECRET
ACCESS_TOKEN_SECRET=YOUR_ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET=YOUR_REFRESH_TOKEN_SECRET

Assurez-vous de remplacer `YOUR_NEXMO_API_KEY`, `YOUR_NEXMO_API_SECRET`, `YOUR_ACCESS_TOKEN_SECRET` et `YOUR_REFRESH_TOKEN_SECRET` par vos propres clés/secrets.

5. Démarrez le serveur :

bash
npm start
L'API OTP sera accessible à l'adresse `http://localhost:3000`.

## Routes

### POST /register

Cette route permet d'enregistrer un nouvel utilisateur avec son adresse e-mail et son numéro de téléphone.

**Paramètres de la requête :**

- `email` : l'adresse e-mail de l'utilisateur (chaîne de caractères)
- `phone` : le numéro de téléphone de l'utilisateur (chaîne de caractères)

**Réponses :**

- 200 OK : L'utilisateur a été enregistré avec succès.
- 400 Bad Request : L'adresse e-mail ou le numéro de téléphone est invalide.
- 403 Forbidden : L'utilisateur est bloqué ou a dépassé la limite de demandes de code OTP.

### POST /verify-otp

Cette route permet de vérifier un code OTP pour un utilisateur donné.

**Paramètres de la requête :**

- `OTP` : le code OTP à vérifier (chaîne de caractères)

**Réponses :**

- 200 OK : Le code OTP a été vérifié avec succès.
- 403 Forbidden : Le code OTP est expiré ou l'utilisateur est bloqué.

### POST /login

Cette route permet de se connecter en utilisant un numéro de téléphone.

**Paramètres de la requête :**

- `phone` : le numéro de téléphone de l'utilisateur (chaîne de caractères)

**Réponses :**
- 200 OK : L'utilisateur a été connecté avec succès. Le jeton d'accès et le jeton de rafraîchissement sont renvoyés dans la réponse.
- 403 Forbidden : L'utilisateur est bloqué ou le code OTP n'a pas été vérifié.

### POST /new-otp

Cette route permet de générer un nouveau code OTP pour un utilisateur donné.

**Paramètres de la requête :**

- `phone` : le numéro de téléphone de l'utilisateur (chaîne de caractères)

**Réponses :**

- 200 OK : Un nouveau code OTP a été généré et envoyé avec succès.
- 403 Forbidden : L'utilisateur est bloqué ou le code OTP n'a pas expiré.
### POST /logout

Cette route permet de se déconnecter en utilisant un jeton de rafraîchissement.

**Paramètres de la requête :**

- `refreshToken` : le jeton de rafraîchissement de l'utilisateur (chaîne de caractères)

**Réponses :**

- 200 OK : L'utilisateur a été déconnecté avec succès.
- 404 Not Found : Le jeton de rafraîchissement n'est pas valide.

## Fonctions utilitaires

L'API OTP utilise également des fonctions utilitaires pour générer et envoyer des codes OTP, ainsi que pour valider les adresses e-mail et les numéros de téléphone.

Les fonctions utilitaires suivantes sont utilisées :

- `generateOTP()` : Cette fonction génère un code OTP aléatoire à 6 chiffres.
- `sendSMS(phone, OTP, nexmo)` : Cette fonction envoie un SMS contenant le code OTP à un numéro de téléphone donné en utilisant le service Nexmo.
- `validateEmail(email)` : Cette fonction valide le format d'une adresse e-mail.
- `validatePhone(phone)` : Cette fonction valide le format d'un numéro de téléphone camerounais.

## Configuration

L'API OTP utilise les modules suivants :

- `express` : Un framework web pour Node.js.
- `jsonwebtoken` : Un module pour générer et vérifier les jetons d'accès et de rafraîchissement.
- `mongoose` : Un module pour interagir avec la base de données MongoDB.
- `nexmo` : Un module pour envoyer des SMS en utilisant l'API Nexmo.
-`i18n` : Un module de gestion de la traduction pour prendre en charge plusieurs langues dans l'API.

L'API OTP est configurée pour prendre en charge les langues "en" (anglais) et "fr" (français) par défaut. Les fichiers de traduction sont stockés dans le répertoire "locales".

## Liste noire des tokens

L'API OTP utilise une liste noire pour stocker les jetons expirés. La fonction `cleanBlacklist()` est appelée toutes les heures pour supprimer les jetons expirés de la liste noire.

## Utilisation de la langue

Avant de traiter chaque requête, la langue de l'utilisateur est extraite de l'en-tête "accept-language" de la demande et utilisée pour définir la langue à utiliser pour la traduction à l'aide du module `i18n`.

## Conclusion

Cette documentation décrit les différentes routes et fonctionnalités de l'API OTP.
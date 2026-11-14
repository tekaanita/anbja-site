// netlify/functions/webhook.js
// MoneyFusion appelle cette adresse (POST) quand un paiement change d'état.
// Les notifications apparaissent dans Netlify → Logs → Functions.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }
  try {
    console.log("Notification MoneyFusion :", event.body);
  } catch (e) {
    console.error(e);
  }
  return { statusCode: 200, body: "OK" };
};

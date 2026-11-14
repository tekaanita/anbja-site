// netlify/functions/create-payment.js
// Crée un paiement MoneyFusion. La clé reste secrète dans Netlify (MONEYFUSION_API).

const reponse = (statut, corps) => ({
  statusCode: statut,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(corps),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return reponse(405, { message: "Méthode non autorisée." });
  }

  const apiUrl = process.env.MONEYFUSION_API;
  if (!apiUrl) {
    return reponse(500, { message: "Le paiement n'est pas encore configuré." });
  }

  let donnees;
  try {
    donnees = JSON.parse(event.body || "{}");
  } catch {
    return reponse(400, { message: "Demande invalide." });
  }

  const montant = Math.round(Number(donnees.amount));
  const nom = String(donnees.name || "").trim().slice(0, 60) || "Donateur";
  const telephone = String(donnees.phone || "").replace(/\D/g, "");

  if (!Number.isFinite(montant) || montant < 100 || montant > 5000000) {
    return reponse(400, { message: "Entre un montant valide (minimum 100)." });
  }
  if (telephone.length < 8 || telephone.length > 15) {
    return reponse(400, { message: "Entre un numéro Orange Money valide." });
  }

  const site = process.env.URL || "https://anbja-site-albinos.netlify.app";

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalPrice: montant,
        article: [{ don_NBJA: montant }],
        personal_Info: [{ type: "don", association: "NBJA" }],
        numeroSend: telephone,
        nomclient: nom,
        return_url: `${site}/merci.html`,
        webhook_url: `${site}/.netlify/functions/webhook`,
      }),
    });

    const resultat = await res.json().catch(() => ({}));

    if (!res.ok || !resultat.url) {
      console.error("MoneyFusion a refusé la demande :", res.status, resultat);
      return reponse(502, {
        message: "Le paiement n'a pas pu démarrer. Réessaie dans un instant.",
      });
    }

    return reponse(200, { url: resultat.url });
  } catch (erreur) {
    console.error("Erreur réseau MoneyFusion :", erreur);
    return reponse(502, {
      message: "Impossible de joindre le service de paiement.",
    });
  }
};

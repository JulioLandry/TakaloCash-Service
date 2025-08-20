// Configuration EmailJS séparée pour plus de sécurité
const EMAILJS_CONFIG = {
  publicKey: "your-public-key-here",
  serviceId: "your-service-id",
  templateId: "your-template-id"
};

// Initialisation
if (typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_CONFIG.publicKey);
}

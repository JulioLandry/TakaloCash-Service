/* ===== TAKALOCASH - SCRIPT COMPLET ===== */
/*** 1. CONFIGURATION ***/
const CONFIG = {
  // EmailJS
  emailjs: {
    publicKey: "DEMO_PUBLIC_KEY_REPLACE_ME",
    serviceId: "DEMO_SERVICE_ID",
    templateId: "DEMO_TEMPLATE_ID"
  },

  // Contacts
  contact: {
    email: "contact@takalocash.mg",
    phone: "+261347451051",
    social: {
      facebook: "https://facebook.com/takalocash",
      whatsapp: "https://wa.me/261347451051"
    }
  },

  // Portefeuilles
  wallets: {
    mobile: {
      mvola: { num: "0347451051", name: "Julio Landry", logo: "Mvola" },
      orange: { num: "0324923117", name: "Julio Landry", logo: "Orange" },
      airtel: { num: "0331483290", name: "Julio R.", logo: "Airtel" }
    },
    ewallets: {
      wise: { addr: "WISE-ACCOUNT", logo: "$" },
      paypal: { addr: "paypal@takalocash.mg", logo: "$" },
      skrill: { addr: "skrill@takalocash.mg", logo: "€" }
    }
  },

  // Cryptomonnaies
  cryptos: {
    primary: ["BTC", "ETH", "USDT", "LTC", "BCH"],
    secondary: ["USDC", "BUSD", "ADA", "SOL", "XRP"],
    addresses: {
      BTC: "bc1qexemplebtcaddress12345", 
      ETH: "0xExempleEthAddress123456789",
      USDT: "TExempleUsdtAddress123456789",
      LTC: "ltc1qexempleltcaddress123456",
      BCH: "qqexemplebchaddress123456789"
    },
    rates: {
      BTC: 150000000,
      ETH: 9000000,
      USDT: 4500,
      LTC: 350000,
      BCH: 2800000
    }
  },

  // Frais
  fees: {
    depot: 0.003,    // 0.3%
    retrait: 0.005,  // 0.5%
    transfert: 0.004 // 0.4%
  }
};

/*** 2. ÉTAT GLOBAL ***/
const state = {
  lang: "fr",
  currentTab: "depot",
  crypto: {
    selected: "BTC",
    showAll: false
  },
  payment: {
    method: "mvola",
    target: "USDT"
  }
};

/*** 3. FONCTIONS UTILITAIRES ***/
// Sélecteurs DOM
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

// Affichage des notifications
function showToast(message, duration = 3000) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// Copie dans le presse-papier
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copié !");
  } catch (error) {
    console.error("Erreur copie:", error);
    showToast("Échec de la copie");
  }
}

/*** 4. GESTION DE L'INTERFACE ***/
function initUI() {
  // Onglets
  $$(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      state.currentTab = tab.dataset.tab;
      updateActiveTab();
      refreshUI();
    });
  });

  // Langues
  $("#lang-fr").addEventListener("click", () => setLanguage("fr"));
  $("#lang-mg").addEventListener("click", () => setLanguage("mg"));

  // Boutons d'action
  $("#dep-copy").addEventListener("click", () => copyToClipboard($("#dep-addr").value));
  $("#toggleMoreCryptos").addEventListener("click", toggleCryptoList);
  
  // Options de paiement
  $$("#dep-pay-opts .paybtn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.payment.method = btn.dataset.pay;
      updatePaymentSelection();
      refreshUI();
    });
  });
}

function updateActiveTab() {
  $$(".tab").forEach(tab => {
    tab.setAttribute("aria-selected", tab.dataset.tab === state.currentTab);
  });
  $$("[role=tabpanel]").forEach(panel => {
    panel.hidden = panel.id !== `panel-${state.currentTab}`;
  });
}

function setLanguage(lang) {
  state.lang = lang;
  $("#lang-fr").classList.toggle("lang-active", lang === "fr");
  $("#lang-mg").classList.toggle("lang-active", lang === "mg");
  // Ici vous pourriez ajouter des traductions dynamiques
  showToast(`Langue changée: ${lang === "fr" ? "Français" : "Malagasy"}`);
}

/*** 5. GESTION DES CRYPTO ***/
async function fetchCryptoRates() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    const data = await response.json();
    
    // Mise à jour des taux (1 USD = 4500 MGA)
    CONFIG.cryptos.rates.BTC = Math.round(data.bitcoin.usd * 4500);
    CONFIG.cryptos.rates.ETH = Math.round(data.ethereum.usd * 4500);
    
    updateRateDisplay();
  } catch (error) {
    console.error("Erreur API:", error);
    showToast("Taux non actualisés (mode hors-ligne)");
  }
}

function toggleCryptoList() {
  state.crypto.showAll = !state.crypto.showAll;
  renderCryptoOptions();
  $("#toggleMoreCryptos").innerHTML = state.crypto.showAll 
    ? "<svg viewBox='0 0 24 24' fill='none'><path d='M5 12h14' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg> Réduire" 
    : "<svg viewBox='0 0 24 24' fill='none'><path d='M12 5v14M5 12h14' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg> Plus de cryptos";
}

function renderCryptoOptions() {
  const cryptos = state.crypto.showAll 
    ? [...CONFIG.cryptos.primary, ...CONFIG.cryptos.secondary]
    : CONFIG.cryptos.primary;

  $("#cryptoStrip").innerHTML = cryptos.map(crypto => `
    <button class="chip" aria-pressed="${crypto === state.crypto.selected}"
            onclick="state.crypto.selected='${crypto}'; refreshUI()">
      ${crypto}
    </button>
  `).join("");
}

function updateRateDisplay() {
  const rate = CONFIG.cryptos.rates[state.crypto.selected];
  if (rate) {
    $("#current-rate-display").textContent = `1 ${state.crypto.selected} = ${rate.toLocaleString()} MGA`;
  }
}

/*** 6. OPÉRATIONS PRINCIPALES ***/
function refreshDepot() {
  const amount = parseFloat($("#dep-amount-ariary").value) || 0;
  const rate = CONFIG.cryptos.rates[state.crypto.selected];
  if (rate && amount > 0) {
    const received = (amount / rate * (1 - CONFIG.fees.depot)).toFixed(8);
    $("#dep-amount-crypto").value = received;
    $("#dep-crypto-suffix").textContent = state.crypto.selected;
    $("#dep-rate-note").textContent = `1 ${state.crypto.selected} = ${rate.toLocaleString()} MGA`;
    updatePaymentDetails();
  }
}

function refreshRetrait() {
  const amount = parseFloat($("#ret-amount-crypto").value) || 0;
  const rate = CONFIG.cryptos.rates[state.crypto.selected];
  if (rate && amount > 0) {
    const received = Math.floor(amount * rate * (1 - CONFIG.fees.retrait));
    $("#ret-amount-ariary").value = received.toLocaleString();
    $("#ret-our-addr").value = CONFIG.cryptos.addresses[state.crypto.selected] || "";
    $("#ret-rate-note").textContent = `1 ${state.crypto.selected} = ${rate.toLocaleString()} MGA`;
  }
}

function refreshTransfer() {
  const amount = parseFloat($("#trf-amount-top").value) || 0;
  const rate = CONFIG.cryptos.rates[state.crypto.selected] / CONFIG.cryptos.rates[state.payment.target];
  if (rate && amount > 0) {
    const received = (amount * rate * (1 - CONFIG.fees.transfert)).toFixed(8);
    $("#trf-amount-bot").value = received;
    $("#trf-rate-note").textContent = `1 ${state.crypto.selected} = ${rate.toFixed(4)} ${state.payment.target}`;
  }
}

function updatePaymentDetails() {
  const wallet = CONFIG.wallets.mobile[state.payment.method] || CONFIG.wallets.ewallets[state.payment.method];
  if (wallet) {
    $("#dep-pay-dest").textContent = wallet.num || wallet.addr || "";
    $("#dep-pay-name").textContent = wallet.name || "TakaloCash";
    $("#dep-pay-logo").textContent = wallet.logo;
    $("#dep-addr").value = wallet.num || wallet.addr || "";
  }
}

function updatePaymentSelection() {
  $$("#dep-pay-opts .paybtn").forEach(btn => {
    btn.setAttribute("aria-pressed", btn.dataset.pay === state.payment.method);
  });
}

/*** 7. VALIDATION & ENVOI ***/
function validateForm() {
  const fields = {
    depot: [
      $("#dep-amount-ariary").value,
      $("#dep-addr").value,
      $("#dep-holder").value,
      $("#dep-accept").checked
    ],
    retrait: [
      $("#ret-amount-crypto").value,
      $("#ret-phone").value,
      $("#ret-name").value,
      $("#ret-accept").checked
    ],
    transfert: [
      $("#trf-amount-top").value,
      $("#trf-dest-addr").value,
      $("#trf-accept").checked
    ]
  };
  
  return fields[state.currentTab].every(Boolean);
}

async function submitForm() {
  if (!validateForm()) {
    showToast("Vérifiez tous les champs requis et acceptez les conditions");
    return;
  }

  const formData = {
    service: state.currentTab.toUpperCase(),
    crypto: state.crypto.selected,
    amount: $(`#${state.currentTab}-amount-${state.currentTab === "depot" ? "ariary" : "crypto"}`).value,
    date: new Date().toLocaleString(state.lang),
    method: state.payment.method
  };

  await sendData(formData);
}

async function sendData(data) {
  // Mode démo si les clés ne sont pas configurées
  if (CONFIG.emailjs.publicKey.includes("DEMO")) {
    console.log("DEMO Submission:", data);
    showToast("DEMO: Demande enregistrée (simulation)");
    return;
  }

  try {
    await emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templateId,
      data,
      CONFIG.emailjs.publicKey
    );
    showToast("Demande envoyée! Vérifiez votre email.", 5000);
  } catch (error) {
    console.error("EmailJS Error:", error);
    showToast("Erreur d'envoi. Réessayez ou contactez-nous.");
  }
}

/*** 8. RAFRAÎCHISSEMENT GLOBAL ***/
function refreshUI() {
  updateRateDisplay();
  renderCryptoOptions();
  updatePaymentDetails();
  updatePaymentSelection();
  
  // Met à jour seulement le panneau actif
  if (state.currentTab === "depot") refreshDepot();
  if (state.currentTab === "retrait") refreshRetrait();
  if (state.currentTab === "transfert") refreshTransfer();
}

/*** 9. INITIALISATION ***/
function init() {
  initUI();
  fetchCryptoRates();
  setInterval(fetchCryptoRates, 60000); // Actualisation toutes les minutes
  refreshUI();
  
  // Initialisation EmailJS
  if (emailjs) {
    emailjs.init({
      publicKey: CONFIG.emailjs.publicKey
    });
  }
}

// Lancement
document.addEventListener("DOMContentLoaded", init);

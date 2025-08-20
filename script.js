/* ===== TAKALOCASH - SCRIPT COMPLET ===== */
/*** 1. CONFIGURATION ***/
const CONFIG = {
  // EmailJS
  emailjs: {
    publicKey: "VOTRE_CLE_PUBLIQUE",
    serviceId: "VOTRE_SERVICE_ID",
    templateId: "VOTRE_TEMPLATE_ID"
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
      BTC: "bc1q...", 
      ETH: "0x...",
      USDT: "T...",
      LTC: "ltc1q...",
      BCH: "qq..."
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
  $("#toggleCryptos").addEventListener("click", toggleCryptoList);
}

function updateActiveTab() {
  $$(".tab").forEach(tab => {
    tab.setAttribute("aria-selected", tab.dataset.tab === state.currentTab);
  });
  $$("[role=tabpanel]").forEach(panel => {
    panel.hidden = panel.id !== `panel-${state.currentTab}`;
  });
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
  $("#toggleCryptos").innerHTML = state.crypto.showAll 
    ? "<svg>...</svg> Réduire" 
    : "<svg>...</svg> Plus de cryptos";
}

/*** 6. OPÉRATIONS PRINCIPALES ***/
function refreshDepot() {
  const amount = parseFloat($("#dep-amount-ariary").value) || 0;
  const rate = CONFIG.cryptos.rates[state.crypto.selected];
  const received = (amount / rate * (1 - CONFIG.fees.depot)).toFixed(8);
  
  $("#dep-amount-crypto").value = received;
  $("#dep-crypto-suffix").textContent = state.crypto.selected;
  updatePaymentDetails();
}

function refreshRetrait() {
  const amount = parseFloat($("#ret-amount-crypto").value) || 0;
  const rate = CONFIG.cryptos.rates[state.crypto.selected];
  const received = Math.floor(amount * rate * (1 - CONFIG.fees.retrait));
  
  $("#ret-amount-ariary").value = received.toLocaleString();
  $("#ret-our-addr").value = CONFIG.cryptos.addresses[state.crypto.selected] || "";
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
      $("#ret-accept").checked
    ]
  };
  
  return fields[state.currentTab].every(Boolean);
}

async function submitForm() {
  if (!validateForm()) {
    showToast("Vérifiez tous les champs requis");
    return;
  }

  const formData = {
    service: state.currentTab.toUpperCase(),
    crypto: state.crypto.selected,
    amount: $(`#${state.currentTab}-amount`).value,
    date: new Date().toISOString()
  };

  await sendData(formData);
}

/*** 8. INITIALISATION ***/
function init() {
  initUI();
  fetchCryptoRates();
  setInterval(fetchCryptoRates, 60000); // Actualisation toutes les minutes
  refreshUI();
}

// Lancement
document.addEventListener("DOMContentLoaded", init);

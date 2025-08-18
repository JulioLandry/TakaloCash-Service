/* ===== 1. CONFIGURATION & INITIALISATION ===== */
const CONFIG = {
  // EmailJS (à remplacer avec vos vraies clés)
  emailjsPublicKey: "DEMO_PUBLIC_KEY_REPLACE_ME",
  emailjsServiceId: "DEMO_SERVICE_ID",
  emailjsTemplateId: "DEMO_TEMPLATE_ID",
  
  // Contacts
  emailTo: "contact@takalocash.mg",
  phoneCall: "+261347451051",
  facebook: "https://facebook.com/takalocash",
  whatsapp: "https://wa.me/261347451051",
  
  // Adresses
  wallets: {
    mvola: { label: "Mvola", num: "0347451051", name: "Julio Landry", logo: "Mvola" },
    orange: { label: "Orange Money", num: "0324923117", name: "Julio Landry", logo: "Orange" },
    airtel: { label: "Airtel Money", num: "0331483290", name: "Julio RANDRIANARIMANANA", logo: "Airtel" },
    wise: { label: "Wise", addr: "WISE-ACCOUNT-ID", name: "TakaloCash", logo: "$" },
    paypal: { label: "PayPal", addr: "paypal@takalocash.mg", name: "TakaloCash", logo: "$" }
  },
  
  cryptoAddrs: {
    BTC: "bc1-EXEMPLE-BTC-ADDRESS",
    ETH: "0xEXEMPLEETHADDRESS",
    USDT: "TEXEMPLEUSDT",
    LTC: "ltc1qEXEMPLE",
    BCH: "qzEXEMPLEBCH"
  },
  
  // Cryptos principales et secondaires
  cryptosPrimary: ["BTC", "ETH", "USDT", "LTC", "BCH"],
  cryptosExtra: ["USDC", "BUSD", "ADA", "SOL"],
  
  // Taux de change (exemple)
  ratesMGA: {
    BTC: 150000000,
    ETH: 9000000,
    USDT: 4500,
    LTC: 350000,
    BCH: 2800000
  },
  
  // Frais
  fees: {
    depot: 0.003,    // 0.3%
    retrait: 0.005,  // 0.5%
    transfert: 0.004 // 0.4%
  }
};

// State global
let currentLang = "fr";
let currentCrypto = "BTC";
let transferTarget = "USDT";
let payChoice = "mvola";
let showMoreCryptos = false;

/* ===== 2. FONCTIONS UTILITAIRES ===== */
// Sélecteurs DOM simplifiés
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Affichage des notifications
function toast(msg, duration = 3000) {
  const toastEl = $("#toast");
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), duration);
}

// Formatage des nombres
function formatNumber(num, decimals = 8) {
  return new Intl.NumberFormat(currentLang, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(num);
}

/* ===== 3. GESTION DE L'INTERFACE ===== */
function initUI() {
  // Initialisation des onglets
  $$(".tab").forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
  
  // Boutons de langue
  $("#lang-fr").addEventListener("click", () => setLang("fr"));
  $("#lang-mg").addEventListener("click", () => setLang("mg"));
  
  // Contact footer
  $("#cta-email").addEventListener("click", () => window.location.href = `mailto:${CONFIG.emailTo}`);
  $("#cta-call").addEventListener("click", () => window.location.href = `tel:${CONFIG.phoneCall}`);
  $("#cta-fb").addEventListener("click", () => window.open(CONFIG.facebook, "_blank"));
  $("#cta-wa").addEventListener("click", () => window.open(CONFIG.whatsapp, "_blank"));
  
  // Modales légales
  $$("[data-modal]").forEach(el => {
    el.addEventListener("click", () => $(`#dlg-${el.dataset.modal}`).showModal());
  });
}

function switchTab(tabName) {
  $$(".tab").forEach(t => t.setAttribute("aria-selected", "false"));
  $(`#tab-${tabName}`).setAttribute("aria-selected", "true");
  
  // Afficher seulement le panel actif
  $("#panel-depot").hidden = tabName !== "depot";
  $("#panel-retrait").hidden = tabName !== "retrait";
  $("#panel-transfert").hidden = tabName !== "transfert";
  
  refreshUI();
}

function setLang(lang) {
  currentLang = lang;
  $("#lang-fr").classList.toggle("lang-active", lang === "fr");
  $("#lang-mg").classList.toggle("lang-active", lang === "mg");
  // Ici vous pourriez ajouter des traductions dynamiques
}

/* ===== 4. GESTION DES CRYPTO & TAUX ===== */
async function fetchRates() {
  try {
    // Récupération des taux depuis une API (exemple avec CoinGecko)
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,litecoin,bitcoin-cash&vs_currencies=usd");
    const rates = await response.json();
    
    // Mise à jour des taux MGA basés sur USD (taux fictif 1 USD = 4500 MGA)
    CONFIG.ratesMGA.BTC = Math.round(rates.bitcoin.usd * 4500);
    CONFIG.ratesMGA.ETH = Math.round(rates.ethereum.usd * 4500);
    CONFIG.ratesMGA.USDT = Math.round(rates.tether.usd * 4500);
    CONFIG.ratesMGA.LTC = Math.round(rates.litecoin.usd * 4500);
    CONFIG.ratesMGA.BCH = Math.round(rates["bitcoin-cash"].usd * 4500);
    
    updateRateDisplay();
  } catch (error) {
    console.error("Erreur de récupération des taux:", error);
    toast("Impossible de mettre à jour les taux. Utilisation des taux par défaut.");
  }
}

function updateRateDisplay() {
  const rateDisplay = $("#current-rate-display");
  if (currentCrypto && CONFIG.ratesMGA[currentCrypto]) {
    rateDisplay.textContent = `1 ${currentCrypto} = ${formatNumber(CONFIG.ratesMGA[currentCrypto])} MGA`;
  }
}

/* ===== 5. LOGIQUE DES OPERATIONS ===== */
function refreshDepot() {
  const amountMGA = parseFloat($("#dep-amount-ariary").value) || 0;
  const rate = CONFIG.ratesMGA[currentCrypto] || 1;
  const amountCrypto = amountMGA / rate * (1 - CONFIG.fees.depot);
  
  $("#dep-amount-crypto").value = amountCrypto.toFixed(8);
  $("#dep-crypto-suffix").textContent = currentCrypto;
  $("#dep-rate-note").textContent = `1 ${currentCrypto} = ${formatNumber(rate)} MGA`;
  
  updateDepotDest();
}

function refreshRetrait() {
  const amountCrypto = parseFloat($("#ret-amount-crypto").value) || 0;
  const rate = CONFIG.ratesMGA[currentCrypto] || 1;
  const amountMGA = amountCrypto * rate * (1 - CONFIG.fees.retrait);
  
  $("#ret-amount-ariary").value = formatNumber(amountMGA);
  $("#ret-rate-note").textContent = `1 ${currentCrypto} = ${formatNumber(rate)} MGA`;
  $("#ret-our-addr").value = CONFIG.cryptoAddrs[currentCrypto] || "";
}

function refreshTransfer() {
  const amount = parseFloat($("#trf-amount-top").value) || 0;
  const isCrypto = CONFIG.cryptoAddrs[transferTarget];
  const rate = isCrypto ? (CONFIG.ratesMGA[currentCrypto] / CONFIG.ratesMGA[transferTarget]) : CONFIG.ratesMGA[currentCrypto] / CONFIG.ratesMGA.USDT;
  const amountOut = amount * rate * (1 - CONFIG.fees.transfert);
  
  $("#trf-amount-bot").value = amountOut.toFixed(8);
  $("#trf-rate-note").textContent = `1 ${currentCrypto} = ${rate.toFixed(8)} ${isCrypto ? transferTarget : "USDT"}`;
}

function updateDepotDest() {
  const wallet = CONFIG.wallets[payChoice];
  if (wallet) {
    $("#dep-pay-dest").textContent = wallet.num || wallet.addr || "";
    $("#dep-pay-name").textContent = wallet.name;
    $("#dep-pay-logo").textContent = wallet.logo;
    $("#dep-addr").value = wallet.num || wallet.addr || "";
  }
}

/* ===== 6. GESTION DES FORMULAIRES ===== */
function setupFormHandlers() {
  // Dépôt
  $("#dep-amount-ariary").addEventListener("input", refreshDepot);
  $("#dep-preview").addEventListener("click", submitDepot);
  
  // Retrait
  $("#ret-amount-crypto").addEventListener("input", refreshRetrait);
  $("#ret-preview").addEventListener("click", submitRetrait);
  
  // Transfert
  $("#trf-amount-top").addEventListener("input", refreshTransfer);
  $("#trf-preview").addEventListener("click", submitTransfer);
}

async function submitDepot() {
  if (!validateForm("dep")) return;
  
  const formData = {
    service: "DEPOT",
    crypto: currentCrypto,
    amount: $("#dep-amount-ariary").value,
    wallet: payChoice,
    address: $("#dep-addr").value,
    name: $("#dep-holder").value
  };
  
  await sendEmail(formData);
}

/* ===== 7. INITIALISATION ===== */
function init() {
  initUI();
  setupFormHandlers();
  fetchRates();
  setInterval(fetchRates, 60000); // Actualiser toutes les minutes
  refreshUI();
}

// Lancement de l'application
document.addEventListener("DOMContentLoaded", init);

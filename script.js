/* ===== TAKALOCASH - SCRIPT COMPLET POUR PAGES SÉPARÉES ===== */

/*** 1. CONFIGURATION ***/
const CONFIG = {
  // EmailJS (à remplacer avec vos vraies clés)
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
      wise: { addr: "WISE-ACCOUNT-ID", logo: "$" },
      paypal: { addr: "paypal@takalocash.mg", logo: "$" },
      skrill: { addr: "skrill@takalocash.mg", logo: "€" },
      payoneer: { addr: "PAYONEER-ID", logo: "$" }
    }
  },

  // Cryptomonnaies
  cryptos: {
    primary: ["BTC", "ETH", "USDT", "LTC", "BCH"],
    secondary: ["USDC", "BUSD", "ADA", "SOL", "XRP", "DOT", "LINK"],
    addresses: {
      BTC: "bc1qexemplebtcaddress12345", 
      ETH: "0xExempleEthAddress123456789",
      USDT: "TExempleUsdtAddress123456789",
      LTC: "ltc1qexempleltcaddress123456",
      BCH: "qqexemplebchaddress123456789",
      USDC: "0xExempleUsdcAddress123456789",
      ADA: "addr1exempleadaaddress123456"
    },
    rates: {
      BTC: 150000000,
      ETH: 9000000,
      USDT: 4500,
      LTC: 350000,
      BCH: 2800000,
      USDC: 4500,
      ADA: 1200
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
  currentPage: document.body.getAttribute('data-page') || 'depot',
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
  if (!toast) return;
  
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
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast("Copié !");
  }
}

/*** 4. FONCTIONS COMMUNES ***/
function initCommon() {
  // Initialisation EmailJS
  if (typeof emailjs !== 'undefined' && !CONFIG.emailjs.publicKey.includes("DEMO")) {
    emailjs.init({
      publicKey: CONFIG.emailjs.publicKey
    });
  }

  // Gestion de la langue
  $("#lang-fr")?.addEventListener("click", () => setLanguage("fr"));
  $("#lang-mg")?.addEventListener("click", () => setLanguage("mg"));

  // Contact footer
  $("#cta-email")?.addEventListener("click", () => window.location.href = `mailto:${CONFIG.contact.email}`);
  $("#cta-call")?.addEventListener("click", () => window.location.href = `tel:${CONFIG.contact.phone}`);
  $("#cta-fb")?.addEventListener("click", () => window.open(CONFIG.contact.social.facebook, "_blank"));
  $("#cta-wa")?.addEventListener("click", () => window.open(CONFIG.contact.social.whatsapp, "_blank"));

  // Modales légales
  $$("[data-modal]").forEach(el => {
    el.addEventListener("click", () => {
      const modalId = `dlg-${el.dataset.modal}`;
      const modal = $(`#${modalId}`);
      if (modal) modal.showModal();
    });
  });

  // Fermeture des modales
  $$("dialog").forEach(dialog => {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        dialog.close();
      }
    });
  });
}

function setLanguage(lang) {
  state.lang = lang;
  $("#lang-fr")?.classList.toggle("lang-active", lang === "fr");
  $("#lang-mg")?.classList.toggle("lang-active", lang === "mg");
  showToast(`Langue changée: ${lang === "fr" ? "Français" : "Malagasy"}`);
}

/*** 5. GESTION DES CRYPTO & TAUX ***/
async function fetchCryptoRates() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd");
    const data = await response.json();
    
    // Mise à jour des taux (1 USD = 4500 MGA)
    if (data.bitcoin) CONFIG.cryptos.rates.BTC = Math.round(data.bitcoin.usd * 4500);
    if (data.ethereum) CONFIG.cryptos.rates.ETH = Math.round(data.ethereum.usd * 4500);
    if (data.tether) CONFIG.cryptos.rates.USDT = Math.round(data.tether.usd * 4500);
    
    updateRateDisplay();
    updateCryptoDropdown();
  } catch (error) {
    console.error("Erreur API:", error);
    showToast("Taux non actualisés (mode hors-ligne)");
  }
}

function updateRateDisplay() {
  const rateDisplay = $("#current-rate-display");
  if (rateDisplay && state.crypto.selected && CONFIG.cryptos.rates[state.crypto.selected]) {
    const rate = CONFIG.cryptos.rates[state.crypto.selected];
    rateDisplay.textContent = `1 ${state.crypto.selected} = ${rate.toLocaleString()} MGA`;
  }
}

function setupCryptoSelector() {
  const selectorBtn = $("#crypto-selector-btn");
  const dropdown = $("#crypto-dropdown");
  
  if (!selectorBtn || !dropdown) return;
  
  selectorBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectorBtn.classList.toggle("open");
    dropdown.classList.toggle("open");
  });
  
  // Fermer le dropdown en cliquant ailleurs
  document.addEventListener("click", (e) => {
    if (!selectorBtn.contains(e.target) && !dropdown.contains(e.target)) {
      selectorBtn.classList.remove("open");
      dropdown.classList.remove("open");
    }
  });
}

function updateCryptoDropdown() {
  const dropdown = $("#crypto-dropdown");
  if (!dropdown) return;
  
  dropdown.innerHTML = "";
  
  const allCryptos = [...CONFIG.cryptos.primary, ...CONFIG.cryptos.secondary];
  allCryptos.forEach(sym => {
    const item = document.createElement("div");
    item.className = "crypto-item";
    if (sym === state.crypto.selected) item.classList.add("active");
    
    item.innerHTML = `
      <span>${sym}</span>
      <span class="crypto-rate">${CONFIG.cryptos.rates[sym]?.toLocaleString() || '...'} MGA</span>
    `;
    
    item.addEventListener("click", () => {
      state.crypto.selected = sym;
      $("#crypto-selector-btn").classList.remove("open");
      dropdown.classList.remove("open");
      refreshCurrentPage();
    });
    
    dropdown.appendChild(item);
  });
}

/*** 6. PAGES SPÉCIFIQUES ***/
function initPageSpecific() {
  switch(state.currentPage) {
    case 'depot':
      initDepotPage();
      break;
    case 'retrait':
      initRetraitPage();
      break;
    case 'transfert':
      initTransfertPage();
      break;
  }
}

// ===== PAGE DÉPÔT =====
function initDepotPage() {
  // Options de paiement
  $$("#dep-pay-opts .paybtn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.payment.method = btn.dataset.pay;
      updatePaymentSelection();
      refreshDepot();
    });
  });

  // Événements de saisie
  $("#dep-amount-ariary")?.addEventListener("input", refreshDepot);
  $("#dep-copy")?.addEventListener("click", () => copyToClipboard($("#dep-addr").value));
  $("#toggleMoreCryptos")?.addEventListener("click", toggleCryptoList);
  
  // Validation
  $("#dep-accept")?.addEventListener("change", () => {
    const btn = $("#dep-preview");
    if (btn) btn.disabled = !$("#dep-accept").checked;
  });
  
  // Soumission
  $("#dep-preview")?.addEventListener("click", submitDepot);

  // Initialisation
  updatePaymentDetails();
  refreshDepot();
}

function refreshDepot() {
  const amount = parseFloat($("#dep-amount-ariary")?.value) || 0;
  const rate = CONFIG.cryptos.rates[state.crypto.selected];
  
  if (rate && amount > 0) {
    const received = (amount / rate * (1 - CONFIG.fees.depot)).toFixed(8);
    $("#dep-amount-crypto").value = received;
    $("#dep-crypto-suffix").textContent = state.crypto.selected;
    $("#dep-rate-note").textContent = `1 ${state.crypto.selected} = ${rate.toLocaleString()} MGA`;
    $("#dep-fee-note").textContent = `Frais: ${(CONFIG.fees.depot * 100).toFixed(1)}%`;
  }
  
  updatePaymentDetails();
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

// ===== PAGE RETRAIT =====
function initRetraitPage() {
  // Événements de saisie
  $("#ret-amount-crypto")?.addEventListener("input", refreshRetrait);
  $("#ret-copy")?.addEventListener("click", () => copyToClipboard($("#ret-our-addr").value));
  $("#toggleMoreCryptos")?.addEventListener("click", toggleCryptoList);
  
  // Détection automatique du wallet
  $("#ret-phone")?.addEventListener("input", function() {
    const num = this.value.trim();
    let wallet = "mvola";
    if (num.startsWith("032") || num.startsWith("033")) wallet = "orange";
    if (num.startsWith("034")) wallet = "airtel";
    $("#ret-wallet-icon").textContent = CONFIG.wallets.mobile[wallet]?.logo || "";
  });

  // Validation
  $("#ret-accept")?.addEventListener("change", () => {
    const btn = $("#ret-preview");
    if (btn) btn.disabled = !$("#ret-accept").checked;
  });
  
  // Soumission
  $("#ret-preview")?.addEventListener("click", submitRetrait);

  // Initialisation
  refreshRetrait();
}

function refreshRetrait() {
  const amount = parseFloat($("#ret-amount-crypto")?.value) || 0;
  const rate = CONFIG.cryptos.rates[state.crypto.selected];
  
  if (rate && amount > 0) {
    const received = Math.floor(amount * rate * (1 - CONFIG.fees.retrait));
    $("#ret-amount-ariary").value = received.toLocaleString();
    $("#ret-our-addr").value = CONFIG.cryptos.addresses[state.crypto.selected] || "";
    $("#ret-rate-note").textContent = `1 ${state.crypto.selected} = ${rate.toLocaleString()} MGA`;
    $("#ret-fee-note").textContent = `Frais: ${(CONFIG.fees.retrait * 100).toFixed(1)}%`;
    $("#ret-crypto-suffix").textContent = state.crypto.selected;
    $("#ret-crypto-only").innerHTML = `Envoyer seulement en <b>${state.crypto.selected}</b>`;
  }
}

// ===== PAGE TRANSFERT =====
function initTransfertPage() {
  // Événements de saisie
  $("#trf-amount-top")?.addEventListener("input", refreshTransfer);
  $("#toggleMoreCryptos")?.addEventListener("click", toggleCryptoList);
  
  // Sélection de la cible
  $$("#cryptoStripTransfer .chip, #ewalletStripTransfer .ewbtn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("chip")) {
        state.payment.target = btn.textContent;
      } else {
        state.payment.target = btn.dataset.key;
      }
      refreshTransfer();
    });
  });

  // Validation
  $("#trf-accept")?.addEventListener("change", () => {
    const btn = $("#trf-preview");
    if (btn) btn.disabled = !$("#trf-accept").checked;
  });
  
  // Soumission
  $("#trf-preview")?.addEventListener("click", submitTransfer);

  // Initialisation
  refreshTransfer();
}

function refreshTransfer() {
  const amount = parseFloat($("#trf-amount-top")?.value) || 0;
  const isTargetCrypto = CONFIG.cryptos.addresses[state.payment.target];
  
  let rate, out;
  if (isTargetCrypto) {
    // Conversion crypto vers crypto
    const rateSource = CONFIG.cryptos.rates[state.crypto.selected];
    const rateTarget = CONFIG.cryptos.rates[state.payment.target];
    rate = rateSource / rateTarget;
    out = amount * rate * (1 - CONFIG.fees.transfert);
  } else {
    // Conversion crypto vers e-wallet (utilise USDT comme référence)
    const rateSource = CONFIG.cryptos.rates[state.crypto.selected];
    const rateTarget = CONFIG.cryptos.rates.USDT;
    rate = rateSource / rateTarget;
    out = amount * rate * (1 - CONFIG.fees.transfert);
  }
  
  if (amount > 0) {
    $("#trf-amount-bot").value = out.toFixed(8);
    $("#trf-top-suffix").textContent = state.crypto.selected;
    $("#trf-bot-suffix").textContent = isTargetCrypto ? state.payment.target : state.payment.target.toUpperCase();
    $("#trf-top-note").textContent = `Crypto source: ${state.crypto.selected}`;
    $("#trf-rate-note").textContent = `1 ${state.crypto.selected} = ${rate.toFixed(4)} ${isTargetCrypto ? state.payment.target : "USDT"}`;
  }
  
  // Mise à jour des sélections visuelles
  updateTransferSelections();
}

function updateTransferSelections() {
  // Crypto source
  $$("#cryptoStrip .chip").forEach(chip => {
    chip.setAttribute("aria-pressed", chip.textContent === state.crypto.selected);
  });
  
  // Cible
  $$("#cryptoStripTransfer .chip").forEach(chip => {
    chip.setAttribute("aria-pressed", chip.textContent === state.payment.target);
  });
  $$("#ewalletStripTransfer .ewbtn").forEach(btn => {
    btn.setAttribute("aria-pressed", btn.dataset.key === state.payment.target);
  });
}

/*** 7. FONCTIONS DE RENDU ***/
function toggleCryptoList() {
  state.crypto.showAll = !state.crypto.showAll;
  renderCryptoOptions();
  
  const btn = $("#toggleMoreCryptos");
  if (btn) {
    btn.innerHTML = state.crypto.showAll 
      ? `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Réduire`
      : `<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Plus de cryptos`;
  }
}

function renderCryptoOptions() {
  const cryptos = state.crypto.showAll 
    ? [...CONFIG.cryptos.primary, ...CONFIG.cryptos.secondary]
    : CONFIG.cryptos.primary;

  // Strip principale
  const mainStrip = $("#cryptoStrip");
  if (mainStrip) {
    mainStrip.innerHTML = cryptos.map(crypto => `
      <button class="chip" aria-pressed="${crypto === state.crypto.selected}"
              onclick="state.crypto.selected='${crypto}'; refreshCurrentPage()">
        ${crypto}
      </button>
    `).join("");
  }

  // Strip pour le transfert
  const transferStrip = $("#cryptoStripTransfer");
  if (transferStrip) {
    transferStrip.innerHTML = cryptos.map(crypto => `
      <button class="chip" aria-pressed="${crypto === state.payment.target}"
              onclick="state.payment.target='${crypto}'; refreshTransfer()">
        ${crypto}
      </button>
    `).join("");
  }
}

function renderEwalletOptions() {
  const ewalletStrip = $("#ewalletStrip, #ewalletStripTransfer");
  if (!ewalletStrip) return;

  const ewalletHTML = Object.keys(CONFIG.wallets.ewallets).map(key => {
    const wallet = CONFIG.wallets.ewallets[key];
    const isActive = key === state.payment.method || key === state.payment.target;
    return `
      <button class="ewbtn" data-key="${key}" aria-pressed="${isActive}"
              onclick="state.payment.${state.currentPage === 'depot' ? 'method' : 'target'}='${key}'; refreshCurrentPage()">
        ${wallet.logo} ${key.charAt(0).toUpperCase() + key.slice(1)}
      </button>
    `;
  }).join("");

  $$("#ewalletStrip, #ewalletStripTransfer").forEach(strip => {
    strip.innerHTML = ewalletHTML;
  });
}

function refreshCurrentPage() {
  updateRateDisplay();
  renderCryptoOptions();
  renderEwalletOptions();
  
  switch(state.currentPage) {
    case 'depot':
      refreshDepot();
      break;
    case 'retrait':
      refreshRetrait();
      break;
    case 'transfert':
      refreshTransfer();
      break;
  }
}

/*** 8. VALIDATION & ENVOI ***/
function validateForm() {
  switch(state.currentPage) {
    case 'depot':
      return validateDepotForm();
    case 'retrait':
      return validateRetraitForm();
    case 'transfert':
      return validateTransfertForm();
    default:
      return false;
  }
}

function validateDepotForm() {
  const amount = $("#dep-amount-ariary")?.value;
  const address = $("#dep-addr")?.value;
  const holder = $("#dep-holder")?.value;
  const accepted = $("#dep-accept")?.checked;
  
  return amount && parseFloat(amount) > 0 && address && holder && accepted;
}

function validateRetraitForm() {
  const amount = $("#ret-amount-crypto")?.value;
  const phone = $("#ret-phone")?.value;
  const name = $("#ret-name")?.value;
  const accepted = $("#ret-accept")?.checked;
  
  return amount && parseFloat(amount) > 0 && phone && name && accepted;
}

function validateTransfertForm() {
  const amount = $("#trf-amount-top")?.value;
  const address = $("#trf-dest-addr")?.value;
  const accepted = $("#trf-accept")?.checked;
  
  return amount && parseFloat(amount) > 0 && address && accepted;
}

async function submitDepot() {
  if (!validateDepotForm()) {
    showToast("Veuillez remplir tous les champs requis et accepter les conditions");
    return;
  }

  if (!confirm("Confirmez-vous cette opération de dépôt ?")) return;

  const formData = {
    service: "DÉPÔT",
    crypto: state.crypto.selected,
    montant_ariary: $("#dep-amount-ariary").value,
    montant_crypto: $("#dep-amount-crypto").value,
    moyen_paiement: state.payment.method,
    adresse_paiement: $("#dep-addr").value,
    nom_compte: $("#dep-holder").value,
    taux: `1 ${state.crypto.selected} = ${CONFIG.cryptos.rates[state.crypto.selected].toLocaleString()} MGA`,
    frais: `${(CONFIG.fees.depot * 100).toFixed(1)}%`,
    date: new Date().toLocaleString('fr-FR')
  };

  await sendData(formData);
}

async function submitRetrait() {
  if (!validateRetraitForm()) {
    showToast("Veuillez remplir tous les champs requis et accepter les conditions");
    return;
  }

  if (!confirm("Confirmez-vous cette opération de retrait ?")) return;

  const formData = {
    service: "RETRAIT",
    crypto: state.crypto.selected,
    montant_crypto: $("#ret-amount-crypto").value,
    montant_ariary: $("#ret-amount-ariary").value,
    adresse_envoi: $("#ret-our-addr").value,
    telephone: $("#ret-phone").value,
    nom_titulaire: $("#ret-name").value,
    taux: `1 ${state.crypto.selected} = ${CONFIG.cryptos.rates[state.crypto.selected].toLocaleString()} MGA`,
    frais: `${(CONFIG.fees.retrait * 100).toFixed(1)}%`,
    date: new Date().toLocaleString('fr-FR')
  };

  await sendData(formData);
}

async function submitTransfert() {
  if (!validateTransfertForm()) {
    showToast("Veuillez remplir tous les champs requis et accepter les conditions");
    return;
  }

  if (!confirm("Confirmez-vous cette opération de transfert ?")) return;

  const formData = {
    service: "TRANSFERT",
    crypto_source: state.crypto.selected,
    crypto_cible: state.payment.target,
    montant_source: $("#trf-amount-top").value,
    montant_cible: $("#trf-amount-bot").value,
    adresse_destination: $("#trf-dest-addr").value,
    taux: `1 ${state.crypto.selected} = ${$("#trf-rate-note").textContent.split('=')[1]?.trim()}`,
    frais: `${(CONFIG.fees.transfert * 100).toFixed(1)}%`,
    date: new Date().toLocaleString('fr-FR')
  };

  await sendData(formData);
}

async function sendData(data) {
  // Mode démo si les clés ne sont pas configurées
  if (CONFIG.emailjs.publicKey.includes("DEMO")) {
    console.log("DEMO Submission:", data);
    showToast("DEMO: Demande enregistrée avec succès. En production, un email serait envoyé.");
    return;
  }

  try {
    await emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templateId,
      data
    );
    showToast("Demande envoyée avec succès ! Vous recevrez un email de confirmation.");
  } catch (error) {
    console.error("EmailJS Error:", error);
    showToast("Erreur lors de l'envoi. Veuillez réessayer ou nous contacter directement.");
  }
}

/*** 9. INITIALISATION ***/
function init() {
  initCommon();
  setupCryptoSelector();
  initPageSpecific();
  renderCryptoOptions();
  renderEwalletOptions();
  fetchCryptoRates();
  
  // Actualisation périodique des taux
  setInterval(fetchCryptoRates, 60000); // Toutes les minutes
}

// Lancement de l'application
document.addEventListener("DOMContentLoaded", init);

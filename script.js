const TOTAL_NUMBERS = 75;
const DEFAULT_LANGUAGE = "pt-BR";
const LANGUAGE_STORAGE_KEY = "bingo-language";

const translations = {
  "pt-BR": {
    pageTitle: "Bingo",
    pageDescription: "Um painel simples para selecionar e acompanhar números de bingo.",
    languageSwitcher: "Selecionar idioma",
    gamePanel: "Painel de jogo",
    instructions: "Toque nos números para marcar ou desmarcar.",
    selectedCount: "selecionados",
    lastNumber: "Último número",
    drawNumber: "Sortear número",
    drawComplete: "Todos sorteados",
    numberBoard: "Cartela",
    chooseNumbers: "Escolha os números",
    clearAll: "Limpar tudo",
    numbersRange: "Números de 1 a 75",
    result: "Resultado",
    selectedNumbers: "Números escolhidos",
    emptySelection: "Nenhum número escolhido ainda.",
    numberLabel: (number) => `Número ${number}`,
    removeNumber: (number) => `Remover número ${number}`,
    removeHint: "Clique para remover",
    printableCards: "Cartelas para imprimir",
    pdfTitle: "Gerar cartelas em PDF",
    pdfDescription: "Configure as cartelas e baixe um PDF pronto para impressão.",
    numbersPerCard: "Números por cartela",
    cardCount: "Quantidade de cartelas",
    singleCardChance: "Acerto em uma cartela",
    anyCardChance: "Acerto em pelo menos uma",
    possibleCards: "Combinações possíveis",
    probabilityNote:
      "Estimativa para um único número sorteado, supondo cartelas independentes.",
    generatePdf: "Gerar e baixar PDF",
    downloadAgain: "Baixar PDF novamente",
    pdfReady: (count) =>
      `${count} ${count === 1 ? "cartela gerada" : "cartelas geradas"} com sucesso.`,
    impossibleCardCount:
      "Essa configuração não possui combinações únicas suficientes para a quantidade de cartelas.",
    pdfCard: "Cartela",
    pdfFooter: (count) => `${count} numeros nesta cartela`,
  },
  en: {
    pageTitle: "Bingo",
    pageDescription: "A simple board for selecting and tracking bingo numbers.",
    languageSwitcher: "Select language",
    gamePanel: "Game board",
    instructions: "Tap a number to select or deselect it.",
    selectedCount: "selected",
    lastNumber: "Latest number",
    drawNumber: "Draw number",
    drawComplete: "All numbers drawn",
    numberBoard: "Number board",
    chooseNumbers: "Choose the numbers",
    clearAll: "Clear all",
    numbersRange: "Numbers from 1 to 75",
    result: "Result",
    selectedNumbers: "Selected numbers",
    emptySelection: "No numbers selected yet.",
    numberLabel: (number) => `Number ${number}`,
    removeNumber: (number) => `Remove number ${number}`,
    removeHint: "Click to remove",
    printableCards: "Printable cards",
    pdfTitle: "Generate bingo cards as PDF",
    pdfDescription: "Configure the cards and download a print-ready PDF.",
    numbersPerCard: "Numbers per card",
    cardCount: "Number of cards",
    singleCardChance: "Hit on one card",
    anyCardChance: "Hit on at least one",
    possibleCards: "Possible combinations",
    probabilityNote:
      "Estimate for a single drawn number, assuming independent random cards.",
    generatePdf: "Generate and download PDF",
    downloadAgain: "Download again",
    pdfReady: (count) =>
      `${count} ${count === 1 ? "card generated" : "cards generated"} successfully.`,
    impossibleCardCount:
      "This configuration does not have enough unique combinations for that many cards.",
    pdfCard: "Card",
    pdfFooter: (count) => `${count} numbers on this card`,
  },
};

const numberGrid = document.querySelector("#number-grid");
const selectedNumbersContainer = document.querySelector("#selected-numbers");
const selectedCount = document.querySelector("#selected-count");
const lastNumber = document.querySelector("#last-number");
const emptyMessage = document.querySelector("#empty-message");
const clearButton = document.querySelector("#clear-button");
const drawButton = document.querySelector("#draw-button");
const languageSwitcher = document.querySelector(".language-switcher");
const languageButtons = document.querySelectorAll(".language-button");
const description = document.querySelector('meta[name="description"]');
const pdfForm = document.querySelector("#pdf-form");
const numbersPerCardInput = document.querySelector("#numbers-per-card");
const cardCountInput = document.querySelector("#card-count");
const singleCardChance = document.querySelector("#single-card-chance");
const anyCardChance = document.querySelector("#any-card-chance");
const possibleCards = document.querySelector("#possible-cards");
const pdfStatus = document.querySelector("#pdf-status");
const pdfDownloadLink = document.querySelector("#pdf-download-link");

const selectedNumbers = new Set();
const selectionHistory = [];
let currentLanguage = getInitialLanguage();
let pdfStatusState = null;
let currentPdfUrl = null;

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return translations[savedLanguage] ? savedLanguage : DEFAULT_LANGUAGE;
}

function translate(key) {
  return translations[currentLanguage][key];
}

function createNumberButton(number) {
  const button = document.createElement("button");
  button.className = "number-button";
  button.type = "button";
  button.textContent = number;
  button.dataset.number = number;
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => toggleNumber(number));
  return button;
}

function setLanguage(language) {
  if (!translations[language]) {
    return;
  }

  currentLanguage = language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;
  document.title = translate("pageTitle");
  description.content = translate("pageDescription");
  languageSwitcher.setAttribute("aria-label", translate("languageSwitcher"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === currentLanguage;
    button.setAttribute("aria-pressed", String(isActive));
  });

  updateProbability();
  renderPdfStatus();
  render();
}

function toggleNumber(number) {
  if (selectedNumbers.has(number)) {
    selectedNumbers.delete(number);
    const historyIndex = selectionHistory.lastIndexOf(number);

    if (historyIndex >= 0) {
      selectionHistory.splice(historyIndex, 1);
    }
  } else {
    selectedNumbers.add(number);
    selectionHistory.push(number);
  }

  render();
}

function drawNumber() {
  const availableNumbers = Array.from(
    { length: TOTAL_NUMBERS },
    (_, index) => index + 1,
  ).filter((number) => !selectedNumbers.has(number));

  if (availableNumbers.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableNumbers.length);
  const drawnNumber = availableNumbers[randomIndex];
  selectedNumbers.add(drawnNumber);
  selectionHistory.push(drawnNumber);
  render();
}

function renderSelectedNumbers() {
  selectedNumbersContainer.replaceChildren();

  [...selectedNumbers]
    .sort((first, second) => first - second)
    .forEach((number) => {
      const button = document.createElement("button");
      button.className = "selected-number";
      button.type = "button";
      button.textContent = number;
      button.setAttribute("aria-label", translate("removeNumber")(number));
      button.title = translate("removeHint");
      button.addEventListener("click", () => toggleNumber(number));
      selectedNumbersContainer.append(button);
    });
}

function render() {
  document.querySelectorAll(".number-button").forEach((button) => {
    const number = Number(button.dataset.number);
    button.setAttribute("aria-label", translate("numberLabel")(number));
    button.setAttribute("aria-pressed", String(selectedNumbers.has(number)));
  });

  selectedCount.textContent = selectedNumbers.size;
  lastNumber.textContent = selectionHistory.at(-1) ?? "—";
  emptyMessage.hidden = selectedNumbers.size > 0;
  clearButton.disabled = selectedNumbers.size === 0;
  drawButton.disabled = selectedNumbers.size === TOTAL_NUMBERS;
  drawButton.textContent = translate(
    selectedNumbers.size === TOTAL_NUMBERS ? "drawComplete" : "drawNumber",
  );
  renderSelectedNumbers();
}

function clearSelection() {
  selectedNumbers.clear();
  selectionHistory.length = 0;
  render();
}

function getPdfConfiguration() {
  const numbersPerCard = Math.min(
    TOTAL_NUMBERS,
    Math.max(1, Number.parseInt(numbersPerCardInput.value, 10) || 1),
  );
  const cardCount = Math.min(
    100,
    Math.max(1, Number.parseInt(cardCountInput.value, 10) || 1),
  );

  return { numbersPerCard, cardCount };
}

function combinationCount(total, selected) {
  const smallerSide = Math.min(selected, total - selected);
  let result = 1n;

  for (let index = 1; index <= smallerSide; index += 1) {
    result =
      (result * BigInt(total - smallerSide + index)) / BigInt(index);
  }

  return result;
}

function formatCombinationCount(value) {
  const digits = value.toString();

  if (digits.length <= 12) {
    return new Intl.NumberFormat(currentLanguage).format(value);
  }

  const mantissa = Number(`${digits[0]}.${digits.slice(1, 4)}`);
  const formattedMantissa = new Intl.NumberFormat(currentLanguage, {
    maximumFractionDigits: 3,
  }).format(mantissa);
  return `${formattedMantissa} × 10^${digits.length - 1}`;
}

function updateProbability() {
  const { numbersPerCard, cardCount } = getPdfConfiguration();
  const chanceForOneCard = numbersPerCard / TOTAL_NUMBERS;
  const chanceForAnyCard = 1 - (1 - chanceForOneCard) ** cardCount;
  const percentageFormatter = new Intl.NumberFormat(currentLanguage, {
    style: "percent",
    maximumFractionDigits: 1,
  });

  singleCardChance.textContent = percentageFormatter.format(chanceForOneCard);
  anyCardChance.textContent = percentageFormatter.format(chanceForAnyCard);
  possibleCards.textContent = formatCombinationCount(
    combinationCount(TOTAL_NUMBERS, numbersPerCard),
  );
}

function renderPdfStatus() {
  if (!pdfStatusState) {
    pdfStatus.textContent = "";
    pdfStatus.removeAttribute("data-status");
    return;
  }

  pdfStatus.dataset.status = pdfStatusState.type;
  pdfStatus.textContent =
    pdfStatusState.type === "success"
      ? translate("pdfReady")(pdfStatusState.cardCount)
      : translate("impossibleCardCount");
}

function randomIndex(maxExclusive) {
  const range = 2 ** 32;
  const limit = range - (range % maxExclusive);
  const randomValue = new Uint32Array(1);

  do {
    crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= limit);

  return randomValue[0] % maxExclusive;
}

function createRandomCard(numbersPerCard) {
  const pool = Array.from({ length: TOTAL_NUMBERS }, (_, index) => index + 1);

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const targetIndex = randomIndex(index + 1);
    [pool[index], pool[targetIndex]] = [pool[targetIndex], pool[index]];
  }

  return pool.slice(0, numbersPerCard).sort((first, second) => first - second);
}

function createRandomCards(numbersPerCard, cardCount) {
  const cards = [];
  const signatures = new Set();
  const maximumAttempts = Math.max(1000, cardCount * 500);
  let attempts = 0;

  while (cards.length < cardCount && attempts < maximumAttempts) {
    const card = createRandomCard(numbersPerCard);
    const signature = card.join("-");
    attempts += 1;

    if (!signatures.has(signature)) {
      signatures.add(signature);
      cards.push(card);
    }
  }

  if (cards.length !== cardCount) {
    throw new Error("Unable to generate the requested number of unique cards.");
  }

  return cards;
}

function pdfNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function escapePdfText(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function createCardPageContent(card, pageIndex, pageCount) {
  const pageWidth = 595.28;
  const gridX = 40;
  const gridWidth = pageWidth - gridX * 2;
  const gridTop = 720;
  const gridAvailableHeight = 610;
  const columnCount = Math.ceil(
    Math.sqrt((card.length * gridWidth) / gridAvailableHeight),
  );
  const rowCount = Math.ceil(card.length / columnCount);
  const cellWidth = gridWidth / columnCount;
  const cellHeight = Math.min(72, gridAvailableHeight / rowCount);
  const numberFontSize = card.length > 50 ? 14 : card.length > 30 ? 16 : 18;
  const cardLabel = `${translate("pdfCard")} ${pageIndex + 1} / ${pageCount}`;
  const footer = translate("pdfFooter")(card.length);
  const commands = [
    "q",
    "0.957 0.945 0.91 rg 0 0 595.28 841.89 re f",
    "0.094 0.239 0.169 rg 40 748 515.28 58 re f",
    `BT /F2 28 Tf 1 1 1 rg 58 776 Td (${escapePdfText("BINGO")}) Tj ET`,
    `BT /F1 11 Tf 1 1 1 rg 58 758 Td (${escapePdfText(cardLabel)}) Tj ET`,
  ];

  card.forEach((number, index) => {
    const row = Math.floor(index / columnCount);
    const column = index % columnCount;
    const x = gridX + column * cellWidth;
    const y = gridTop - (row + 1) * cellHeight;
    const numberText = number.toString();
    const textX = x + cellWidth / 2 - numberText.length * numberFontSize * 0.278;
    const textY = y + cellHeight / 2 - numberFontSize * 0.34;

    commands.push(
      `1 0.992 0.973 rg 0.094 0.239 0.169 RG 1 w ${pdfNumber(x + 2)} ${pdfNumber(y + 2)} ${pdfNumber(cellWidth - 4)} ${pdfNumber(cellHeight - 4)} re B`,
      `BT /F2 ${numberFontSize} Tf 0.094 0.239 0.169 rg ${pdfNumber(textX)} ${pdfNumber(textY)} Td (${numberText}) Tj ET`,
    );
  });

  commands.push(
    `BT /F1 10 Tf 0.345 0.392 0.357 rg 40 56 Td (${escapePdfText(footer)}) Tj ET`,
    `BT /F1 10 Tf 0.345 0.392 0.357 rg 510 56 Td (${pageIndex + 1}/${pageCount}) Tj ET`,
    "Q",
  );

  return commands.join("\n");
}

function createPdfDocument(cards) {
  const encoder = new TextEncoder();
  const objects = [];
  const pageIds = cards.map((_, index) => 5 + index * 2);

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${cards.length} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  cards.forEach((card, index) => {
    const pageId = 5 + index * 2;
    const contentId = pageId + 1;
    const content = createCardPageContent(card, index, cards.length);
    const contentLength = encoder.encode(content).length;

    objects[pageId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] =
      `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`;
  });

  let documentContent = "%PDF-1.4\n%BINGO\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = encoder.encode(documentContent).length;
    documentContent += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const crossReferenceOffset = encoder.encode(documentContent).length;
  documentContent += `xref\n0 ${objects.length + 1}\n`;
  documentContent += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    documentContent += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  documentContent +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${crossReferenceOffset}\n%%EOF`;

  return new Blob([encoder.encode(documentContent)], { type: "application/pdf" });
}

function downloadPdf(cards, numbersPerCard) {
  if (currentPdfUrl) {
    URL.revokeObjectURL(currentPdfUrl);
  }

  const pdf = createPdfDocument(cards);
  currentPdfUrl = URL.createObjectURL(pdf);
  pdfDownloadLink.href = currentPdfUrl;
  pdfDownloadLink.download = `bingo-cards-${cards.length}x${numbersPerCard}.pdf`;
  pdfDownloadLink.hidden = false;
  pdfDownloadLink.click();
}

function clearPdfDownload() {
  if (currentPdfUrl) {
    URL.revokeObjectURL(currentPdfUrl);
    currentPdfUrl = null;
  }

  pdfDownloadLink.hidden = true;
  pdfDownloadLink.removeAttribute("download");
  pdfDownloadLink.href = "#";
}

function generatePdf(event) {
  event.preventDefault();

  if (!pdfForm.reportValidity()) {
    return;
  }

  const { numbersPerCard, cardCount } = getPdfConfiguration();
  const availableCombinations = combinationCount(TOTAL_NUMBERS, numbersPerCard);

  if (BigInt(cardCount) > availableCombinations) {
    pdfStatusState = { type: "error" };
    renderPdfStatus();
    return;
  }

  const cards = createRandomCards(numbersPerCard, cardCount);
  downloadPdf(cards, numbersPerCard);
  pdfStatusState = { type: "success", cardCount };
  renderPdfStatus();
}

const numberButtons = Array.from(
  { length: TOTAL_NUMBERS },
  (_, index) => createNumberButton(index + 1),
);

numberGrid.append(...numberButtons);
drawButton.addEventListener("click", drawNumber);
clearButton.addEventListener("click", clearSelection);
pdfForm.addEventListener("submit", generatePdf);
[numbersPerCardInput, cardCountInput].forEach((input) => {
  input.addEventListener("input", () => {
    pdfStatusState = null;
    clearPdfDownload();
    updateProbability();
    renderPdfStatus();
  });
});
window.addEventListener("beforeunload", clearPdfDownload);
languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});
setLanguage(currentLanguage);

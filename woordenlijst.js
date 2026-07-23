const headers = [
  "woord_id",
  "zweeds",
  "nederlands",
  "woordsoort",
  "thema",
  "cefr",
  "level",
  "voorbeeld_zweeds",
  "voorbeeld_nederlands",
  "en_ett",
  "onbepaald_enkelvoud",
  "bepaald_enkelvoud",
  "onbepaald_meervoud",
  "bepaald_meervoud"
];

const labels = {
  woord_id: "ID",
  zweeds: "Zweeds",
  nederlands: "Nederlands",
  woordsoort: "Woordsoort",
  thema: "Thema",
  cefr: "CEFR",
  level: "Level",
  voorbeeld_zweeds: "Voorbeeld SV",
  voorbeeld_nederlands: "Voorbeeld NL",
  en_ett: "En/ett",
  onbepaald_enkelvoud: "Onbep. ev.",
  bepaald_enkelvoud: "Bep. ev.",
  onbepaald_meervoud: "Onbep. mv.",
  bepaald_meervoud: "Bep. mv."
};

const starterRows = [
  {
    woord_id: "1",
    zweeds: "en lärare",
    nederlands: "een leraar",
    woordsoort: "zelfstandig naamwoord",
    thema: "Eigen woorden",
    cefr: "A1",
    level: "1",
    voorbeeld_zweeds: "Min lärare talar svenska.",
    voorbeeld_nederlands: "Mijn leraar spreekt Zweeds.",
    en_ett: "en",
    onbepaald_enkelvoud: "lärare",
    bepaald_enkelvoud: "läraren",
    onbepaald_meervoud: "lärare",
    bepaald_meervoud: "lärarna"
  },
  {
    woord_id: "2",
    zweeds: "att öva",
    nederlands: "oefenen",
    woordsoort: "werkwoord",
    thema: "Eigen woorden",
    cefr: "A1",
    level: "1",
    voorbeeld_zweeds: "Jag övar varje dag.",
    voorbeeld_nederlands: "Ik oefen elke dag.",
    en_ett: "",
    onbepaald_enkelvoud: "",
    bepaald_enkelvoud: "",
    onbepaald_meervoud: "",
    bepaald_meervoud: ""
  }
];

const tableBody = document.querySelector("#word-table-body");
const statusBox = document.querySelector("#tool-status");
const counter = document.querySelector("#word-count");
const filenameInput = document.querySelector("#filename");
const fileInput = document.querySelector("#csv-import");

function csvField(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function setStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`.trim();
}

function emptyRow(index) {
  return {
    woord_id: String(index),
    zweeds: "",
    nederlands: "",
    woordsoort: "",
    thema: "Eigen woorden",
    cefr: "A1",
    level: "1",
    voorbeeld_zweeds: "",
    voorbeeld_nederlands: "",
    en_ett: "",
    onbepaald_enkelvoud: "",
    bepaald_enkelvoud: "",
    onbepaald_meervoud: "",
    bepaald_meervoud: ""
  };
}

function createCell(name, value) {
  const cell = document.createElement("td");
  let input;

  if (name === "cefr") {
    input = document.createElement("select");
    ["A1", "A2", "B1", "B2", "C1"].forEach((level) => {
      const option = document.createElement("option");
      option.value = level;
      option.textContent = level;
      input.append(option);
    });
  } else if (name === "en_ett") {
    input = document.createElement("select");
    ["", "en", "ett"].forEach((article) => {
      const option = document.createElement("option");
      option.value = article;
      option.textContent = article || "-";
      input.append(option);
    });
  } else {
    input = document.createElement("input");
    input.type = name === "level" ? "number" : "text";
    if (name === "level") {
      input.min = "1";
      input.max = "121";
      input.className = "compact";
    }
  }

  input.name = name;
  input.value = value ?? "";
  input.setAttribute("aria-label", labels[name]);
  cell.append(input);
  return cell;
}

function addRow(values = emptyRow(tableBody.children.length + 1)) {
  const row = document.createElement("tr");
  headers.forEach((name) => row.append(createCell(name, values[name])));

  const actionCell = document.createElement("td");
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-button";
  remove.setAttribute("aria-label", "Rij verwijderen");
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    row.remove();
    updateCount();
  });
  actionCell.append(remove);
  row.append(actionCell);
  tableBody.append(row);
  updateCount();
}

function getRows() {
  return [...tableBody.querySelectorAll("tr")].map((row) => {
    const values = {};
    headers.forEach((name) => {
      values[name] = row.querySelector(`[name="${name}"]`)?.value.trim() ?? "";
    });
    return values;
  });
}

function updateCount() {
  const filled = getRows().filter((row) => row.zweeds || row.nederlands).length;
  counter.textContent = `${filled} woord${filled === 1 ? "" : "en"}`;
}

function validateRows(rows) {
  const filled = rows.filter((row) => Object.values(row).some(Boolean));
  if (!filled.length) return "Vul minimaal één woord in.";
  if (filled.length > 10000) return "Een woordenlijst mag maximaal 10.000 woorden bevatten.";

  const ids = new Set();
  for (const [index, row] of filled.entries()) {
    const line = index + 2;
    if (!row.zweeds || !row.nederlands) return `Regel ${line}: Zweeds en Nederlands zijn verplicht.`;
    if (!["A1", "A2", "B1", "B2", "C1"].includes(row.cefr || "A1")) return `Regel ${line}: CEFR moet A1, A2, B1, B2 of C1 zijn.`;

    const level = Number(row.level || 1);
    if (!Number.isInteger(level) || level < 1 || level > 121) return `Regel ${line}: level moet tussen 1 en 121 liggen.`;
    if (row.en_ett && !["en", "ett"].includes(row.en_ett.toLowerCase())) return `Regel ${line}: en_ett mag alleen en of ett zijn.`;

    const forms = ["onbepaald_enkelvoud", "bepaald_enkelvoud", "onbepaald_meervoud", "bepaald_meervoud"].map((key) => row[key]);
    if (forms.some(Boolean) && (!row.en_ett || forms.some((value) => !value))) return `Regel ${line}: vul en/ett en alle vier naamwoordsvormen in.`;

    const id = row.woord_id || String(index + 1);
    if (ids.has(id)) return `Regel ${line}: woord_id '${id}' komt vaker voor.`;
    ids.add(id);
  }

  return "";
}

function exportCsv() {
  const rows = getRows().filter((row) => Object.values(row).some(Boolean));
  const error = validateRows(rows);
  if (error) {
    setStatus(error, "error");
    return;
  }

  const csv = "\uFEFF" + [headers, ...rows.map((row, index) => headers.map((name) => row[name] || (name === "woord_id" ? String(index + 1) : "")))]
    .map((row) => row.map(csvField).join(";"))
    .join("\r\n") + "\r\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const cleanName = (filenameInput.value || "svenskacoach-eigen-woorden")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "svenskacoach-eigen-woorden";

  link.href = URL.createObjectURL(blob);
  link.download = `${cleanName}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus(`CSV geëxporteerd met ${rows.length} woord${rows.length === 1 ? "" : "en"}.`, "success");
}

function parseCsv(text) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = normalized.split("\n")[0] || "";
  const delimiters = [";", ",", "\t"];
  const delimiter = delimiters.sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (char === '"' && quoted && normalized[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if (char === "\n" && !quoted) {
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("Een aanhalingsteken in de CSV is niet afgesloten.");
  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
}

function importCsv(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const rows = parseCsv(String(reader.result || ""));
      const header = rows.shift()?.map((value) => value.trim().toLowerCase()) || [];
      if (!header.includes("zweeds") || !header.includes("nederlands")) throw new Error("De kolommen 'zweeds' en 'nederlands' ontbreken.");
      tableBody.textContent = "";
      rows.forEach((row, index) => {
        const values = emptyRow(index + 1);
        header.forEach((name, columnIndex) => {
          if (headers.includes(name)) values[name] = row[columnIndex]?.trim() || "";
        });
        addRow(values);
      });
      setStatus(`${rows.length} rij${rows.length === 1 ? "" : "en"} geïmporteerd.`, "success");
    } catch (error) {
      setStatus(error.message || "De CSV kon niet worden gelezen.", "error");
    }
  });
  reader.readAsText(file, "utf-8");
}

document.querySelector("#add-row").addEventListener("click", () => addRow());
document.querySelector("#download-csv").addEventListener("click", exportCsv);
document.querySelector("#clear-rows").addEventListener("click", () => {
  tableBody.textContent = "";
  addRow();
  setStatus("De tabel is leeggemaakt.");
});
document.querySelector("#load-example").addEventListener("click", () => {
  tableBody.textContent = "";
  starterRows.forEach(addRow);
  setStatus("Voorbeeldwoorden geladen.");
});
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) importCsv(file);
});
tableBody.addEventListener("input", updateCount);
tableBody.addEventListener("change", updateCount);

starterRows.forEach(addRow);

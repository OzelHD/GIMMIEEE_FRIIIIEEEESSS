// Global state variables
let loading = false;
let results = [];
let error = null;
let currentLang = "de";

let query = "pommes";

/**
 * Button for language
 */
document.getElementById("langToggle").addEventListener("click", () => {
  currentLang = currentLang === "de" ? "en" : "de";
  query = query === "pommes" ? "french fries" : "pommes";
  document.getElementById("langToggle").textContent = ` ${currentLang === "de" ? "Sprache: Deutsch" : "Language: English"}`;
});

/**
 * Highlights the word "pommes" (case-insensitive) by wrapping it with a span
 * that uses Tailwind CSS classes.
 * @param {string} text
 * @returns {string}
 */

function highlightPommes(text) {
  if (!text) return "";

  //replace Fries with French fries
  let replacementWord = query;
  if (query.toLowerCase() === "french fries") {
    replacementWord = "French fries";
  }

  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
  const regex = new RegExp(`(${safeQuery})`, "gi");

  // Replace matching words with highlighted <strong> version
  return text.replace(regex, `<strong class="text-yellow-500 font-bold">${replacementWord}</strong>`);
}

async function fetchPommes() {
  console.log("🍟 Pommes Fetch Triggered!");
  loading = true;
  error = null;
  results = [];
  updateUI();
//still not done! try https://ethz.ch/de/campus/erleben/gastronomie-und-einkaufen/gastronomie/menueplaene.html
  const FACILITY_ID_TO_NAME = {
    3:  "Clausius-Bar",
    5:  "Dozentenfoyer",
    7:  "Food&Lab",
    8:  "Archimedes",
    9:  "Polyterasse",
    10: "Polysnack",
    11: "Tannenbar",
    14: "Alumni quattro Lounge",
    16: "Bistro HPI",
    17: "Food market - green day",
    18: "Food market - grill bbQ",
    19: "Food market - pizza pasta day",
    20: "Fusion meal",
    21: "Mendokoro",
    22: "Rice-UP",
    23: "Octavo",
    27: "Science Lounge (Basel)",
    28: "Flavour Kitchen (Basel)"
  };

  try {
    const today = new Date();

    // Calculate Monday of the current week (make Monday index 0)
    const weekday = today.getDay(); // Sunday = 0, Monday = 1, etc.
    const offset = (weekday + 6) % 7; // Adjust so that Monday becomes 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    const mondayStr = monday.toISOString().split("T")[0];

    // Monday after next (current Monday + 14 days)
    const mondayPlus14 = new Date(monday);
    mondayPlus14.setDate(monday.getDate() + 14);
    const mondayPlus14Str = mondayPlus14.toISOString().split("T")[0];

    // Build API URL with required query parameters
    const url = `https://idapps.ethz.ch/cookpit-pub-services/v1/weeklyrotas?client-id=ethz-wcms&lang=${currentLang}&rs-first=0&rs-size=50&valid-after=${mondayStr}&valid-before=${mondayPlus14Str}`;
    //FIX FOR OLD BROWSERS and/or samsung
    const res = await fetch(url);
    const data = await res.json();

    // Compute today's code: if Sunday (0) then use 7, otherwise use day number
    const todayCode = today.getDay() === 0 ? 7 : today.getDay();
    const matches = [];

    for (const rota of data["weekly-rota-array"] || []) {
      const mensa =
        FACILITY_ID_TO_NAME[rota["facility-id"]] ||
        `Mensa-ID ${rota["facility-id"]}`;

      for (const day of rota["day-of-week-array"] || []) {
        if (day["day-of-week-code"] !== todayCode) continue;

        for (const open of day["opening-hour-array"] || []) {
          for (const mealTime of open["meal-time-array"] || []) {
            for (const line of mealTime["line-array"] || []) {
              const meal = line["meal"] || {};
              const name = (meal["name"] || "").toLowerCase();
              const description = (meal["description"] || "").toLowerCase();
              const image = meal["image-url"] ? `${meal["image-url"]}?client-id=ethz-wcms` : ["./images/placeholder_pommes02_noBG.png"];
              if (name.includes(query) || description.includes(query)) {
                matches.push({
                  mensa,
                  name: meal["name"] || "",
                  description: meal["description"] || "",
                  studentPrice: meal["meal-price-array"]?.[0]?.price || null,
                  image,
                });
              }
            }
          }
        }
      }
    }

    results = matches;
  } catch (err) {
    console.error(err);
    error = "Verbindung fehlgeschlagen";
  } finally {
    loading = false;
    updateUI();
  }
}


function updateUI() {
  const messageContainer = document.getElementById("messageContainer");
  const resultsList = document.getElementById("resultsList");

  // Clear previous messages and results
  messageContainer.innerHTML = "";
  resultsList.innerHTML = "";

  if (loading) {
    messageContainer.innerHTML =
      '<p class="text-xl text-gray-600">Suche nach <strong class="text-yellow-500 font-bold">Pommes</strong>...</p>';
  } else if (error) {
    messageContainer.innerHTML =
      `<p class="text-xl text-red-600">${error}</p><h2 class="mt-6 text-2xl font-semibold">🍟 Error...</h2>`;
  } else if (!loading && results.length === 0) {
    messageContainer.innerHTML =
      '<h2 class="text-2xl font-semibold">🍟 nix <strong class="text-yellow-500 font-bold">Pommes</strong> gefunden... 🍟</h2>';
  } else if (results.length > 0) {
    messageContainer.innerHTML =
      '<h2 class="text-2xl font-semibold">🍟 Gefunden in diesen Mensas:</h2>';

    // Render each result as a list item
    results.forEach((item) => {
      
      const li = document.createElement("li");
      //li.className = "group bg-gray-50 hover:shadow-md rounded-lg p-4 text-left transition-all duration-200";
      li.className = `
      group-hover:opacity-50
      hover:!opacity-100
      group 
      bg-gray-50
      hover:shadow-md 
      rounded-lg
      p-4 
      text-left 
      transition-all 
      duration-200
    `;


      li.innerHTML = `
        <div class="font-bold text-lg transition-colors">${item.mensa}</div>
        <div class="text-md font-semibold text-gray-800 mt-1 hover:text-black-900 transition-colors">${highlightPommes(item.name)}</div>
        <div class="text-gray-600 text-sm mt-1 hover:text-gray-900 transition-colors">${highlightPommes(item.description)}</div>
        ${
          item.studentPrice !== null
          ? `<div class="text-sm text-gray-800 mt-2 hover:text-green-600 transition-colors">💰 Preis (Studierende): CHF ${Number(item.studentPrice).toFixed(2)}</div>`
          : ""
        }
        ${
          item.image
          ? `<img src="${item.image}" alt="Bild" class="mt-3 rounded-md w-full max-h-60 object-cover hover:scale-[1.02] transition-transform duration-200" />`
          : ""
        }
      `;
      resultsList.appendChild(li);
    });
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const pommesBtn = document.getElementById("pommesBtn");
  pommesBtn.addEventListener("click", fetchPommes);
});

const STORAGE_KEY = "odpApiKey";
const ENABLED_KEY = "odpEnabled";
const LAST_MATCH_KEY = "odpLastMatch";

const injectionStatusEl = document.getElementById("injection-status");
const keyStatusEl = document.getElementById("key-status");
const lastMatchRow = document.getElementById("last-match-row");
const lastMatchEl = document.getElementById("last-match");
const lastMatchUrlEl = document.getElementById("last-match-url");
const openOptionsButton = document.getElementById("open-options");
const hasDnrDebug = Boolean(chrome.declarativeNetRequest?.onRuleMatchedDebug);

function setPill(el, text, isError) {
  if (!el) {
    return;
  }
  el.textContent = text;
  el.classList.toggle("error", isError);
}

function updateStatus() {
  if (!hasDnrDebug) {
    if (lastMatchRow) {
      lastMatchRow.hidden = true;
    }
    if (lastMatchUrlEl) {
      lastMatchUrlEl.textContent = "";
      lastMatchUrlEl.hidden = true;
    }
  } else {
    if (lastMatchRow) {
      lastMatchRow.hidden = false;
    }
    if (lastMatchUrlEl) {
      lastMatchUrlEl.hidden = false;
    }
  }

  chrome.storage.local.get([STORAGE_KEY, ENABLED_KEY, LAST_MATCH_KEY], (result) => {
    if (chrome.runtime.lastError) {
      setPill(injectionStatusEl, "Error", true);
      setPill(keyStatusEl, "Error", true);
      setPill(lastMatchEl, "Error", true);
      return;
    }

    const apiKey = result[STORAGE_KEY] || "";
    const enabled = result[ENABLED_KEY] !== false;
    const hasKey = Boolean(apiKey);

    if (!enabled) {
      setPill(injectionStatusEl, "Paused", true);
    } else if (!hasKey) {
      setPill(injectionStatusEl, "Key missing", true);
    } else {
      setPill(injectionStatusEl, "Active", false);
    }

    setPill(keyStatusEl, hasKey ? "Set" : "Missing", !hasKey);

    const match = result[LAST_MATCH_KEY];
    if (!match || !match.time) {
      setPill(lastMatchEl, "None", false);
      if (lastMatchUrlEl) {
        lastMatchUrlEl.textContent = "";
      }
    } else {
      const time = new Date(match.time);
      setPill(lastMatchEl, Number.isNaN(time.getTime()) ? match.time : time.toISOString(), false);
      if (lastMatchUrlEl) {
        lastMatchUrlEl.textContent = match.url || "";
      }
    }
  });
}

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.addEventListener("DOMContentLoaded", () => {
  updateStatus();
});

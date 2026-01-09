const STORAGE_KEY = "odpApiKey";
const ENABLED_KEY = "odpEnabled";
const PDF_INLINE_KEY = "odpPdfInlineEnabled";
const PDF_CONTENT_TYPE_KEY = "odpPdfContentTypeEnabled";
const LAST_MATCH_KEY = "odpLastMatch";

const apiKeyInput = document.getElementById("api-key");
const enableToggle = document.getElementById("enable-injection");
const pdfInlineToggle = document.getElementById("pdf-inline");
const pdfContentTypeToggle = document.getElementById("pdf-content-type");
const showKeyToggle = document.getElementById("show-key");
const saveButton = document.getElementById("save");
const validateButton = document.getElementById("validate");
const removeButton = document.getElementById("remove");
const statusEl = document.getElementById("status");
const validateStatusEl = document.getElementById("validate-status");
const ruleStatusEl = document.getElementById("rule-status");
const refreshStatusButton = document.getElementById("refresh-status");
const lastMatchRow = document.getElementById("last-match-row");
const lastMatchEl = document.getElementById("last-match");
const lastMatchUrlEl = document.getElementById("last-match-url");
const hasDnrDebug = Boolean(chrome.declarativeNetRequest?.onRuleMatchedDebug);

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function setValidateStatus(message, isError = false) {
  if (!validateStatusEl) {
    return;
  }
  validateStatusEl.textContent = message;
  validateStatusEl.classList.toggle("error", isError);
}

function refreshRuleStatus() {
  if (!ruleStatusEl) {
    return;
  }

  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    if (chrome.runtime.lastError) {
      ruleStatusEl.textContent = "Error";
      ruleStatusEl.classList.add("error");
      return;
    }

    const hasRule = rules.some((rule) => rule.id === 1);
    ruleStatusEl.textContent = hasRule ? "Active" : "Missing";
    ruleStatusEl.classList.toggle("error", !hasRule);
  });
}

function refreshLastMatch() {
  if (!lastMatchEl) {
    return;
  }

  if (!hasDnrDebug) {
    if (lastMatchRow) {
      lastMatchRow.hidden = true;
    }
    if (lastMatchUrlEl) {
      lastMatchUrlEl.textContent = "";
      lastMatchUrlEl.hidden = true;
    }
    return;
  }

  if (lastMatchRow) {
    lastMatchRow.hidden = false;
  }
  if (lastMatchUrlEl) {
    lastMatchUrlEl.hidden = false;
  }

  chrome.storage.local.get([LAST_MATCH_KEY], (result) => {
    if (chrome.runtime.lastError) {
      lastMatchEl.textContent = "Error";
      lastMatchEl.classList.add("error");
      if (lastMatchUrlEl) {
        lastMatchUrlEl.textContent = "";
      }
      return;
    }

    const match = result[LAST_MATCH_KEY];
    if (!match || !match.time) {
      lastMatchEl.textContent = "None";
      lastMatchEl.classList.remove("error");
      if (lastMatchUrlEl) {
        lastMatchUrlEl.textContent = "";
      }
      return;
    }

    const time = new Date(match.time);
    lastMatchEl.textContent = Number.isNaN(time.getTime())
      ? match.time
      : time.toISOString();
    lastMatchEl.classList.remove("error");
    if (lastMatchUrlEl) {
      lastMatchUrlEl.textContent = match.url || "";
    }
  });
}

function refreshDiagnostics() {
  refreshRuleStatus();
  refreshLastMatch();
}

function notifyRuleUpdate(apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled) {
  chrome.runtime.sendMessage(
    { type: "odpKeyUpdated", apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled },
    () => {
      if (chrome.runtime.lastError) {
        console.warn("Rule update message failed:", chrome.runtime.lastError.message);
      }
    }
  );
}

function loadSettings() {
  chrome.storage.local.get(
    [STORAGE_KEY, ENABLED_KEY, PDF_INLINE_KEY, PDF_CONTENT_TYPE_KEY],
    (result) => {
    if (chrome.runtime.lastError) {
      setStatus("Unable to read stored key.", true);
      return;
    }

    const apiKey = result[STORAGE_KEY] || "";
    apiKeyInput.value = apiKey;
    if (enableToggle) {
      enableToggle.checked = result[ENABLED_KEY] !== false;
    }
    if (pdfInlineToggle) {
      pdfInlineToggle.checked = result[PDF_INLINE_KEY] !== false;
    }
    if (pdfContentTypeToggle) {
      pdfContentTypeToggle.checked = result[PDF_CONTENT_TYPE_KEY] !== false;
    }
  });
}

function saveKey() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setStatus("Enter a key before saving.", true);
    return;
  }

  chrome.storage.local.set({ [STORAGE_KEY]: apiKey }, () => {
    if (chrome.runtime.lastError) {
      setStatus("Unable to save key.", true);
      return;
    }

    notifyRuleUpdate(
      apiKey,
      enableToggle ? enableToggle.checked : true,
      pdfInlineToggle ? pdfInlineToggle.checked : true,
      pdfContentTypeToggle ? pdfContentTypeToggle.checked : true
    );
    setStatus("Key saved and applied.");
    setValidateStatus("");
    refreshDiagnostics();
  });
}

function removeKey() {
  chrome.storage.local.remove([STORAGE_KEY], () => {
    if (chrome.runtime.lastError) {
      setStatus("Unable to remove key.", true);
      return;
    }

    apiKeyInput.value = "";
    notifyRuleUpdate(
      "",
      enableToggle ? enableToggle.checked : true,
      pdfInlineToggle ? pdfInlineToggle.checked : true,
      pdfContentTypeToggle ? pdfContentTypeToggle.checked : true
    );
    setStatus("Key removed.");
    setValidateStatus("");
    refreshDiagnostics();
  });
}

function updateEnabled() {
  if (!enableToggle) {
    return;
  }

  const enabled = enableToggle.checked;
  chrome.storage.local.set({ [ENABLED_KEY]: enabled }, () => {
    if (chrome.runtime.lastError) {
      setStatus("Unable to update toggle.", true);
      return;
    }

    chrome.storage.local.get([STORAGE_KEY, PDF_INLINE_KEY, PDF_CONTENT_TYPE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        setStatus("Toggle updated, but key read failed.", true);
        return;
      }

      const apiKey = result[STORAGE_KEY] || "";
      const pdfInlineEnabled = result[PDF_INLINE_KEY] !== false;
      const pdfContentTypeEnabled = result[PDF_CONTENT_TYPE_KEY] !== false;
      notifyRuleUpdate(apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled);
      setStatus(enabled ? "Header injection enabled." : "Header injection paused.");
      refreshDiagnostics();
    });
  });
}

function updatePdfInline() {
  if (!pdfInlineToggle) {
    return;
  }

  const pdfInlineEnabled = pdfInlineToggle.checked;
  chrome.storage.local.set({ [PDF_INLINE_KEY]: pdfInlineEnabled }, () => {
    if (chrome.runtime.lastError) {
      setStatus("Unable to update PDF setting.", true);
      return;
    }

    chrome.storage.local.get(
      [STORAGE_KEY, ENABLED_KEY, PDF_CONTENT_TYPE_KEY],
      (result) => {
        if (chrome.runtime.lastError) {
          setStatus("PDF setting updated, but key read failed.", true);
          return;
        }

        const apiKey = result[STORAGE_KEY] || "";
        const enabled = result[ENABLED_KEY];
        const pdfContentTypeEnabled = result[PDF_CONTENT_TYPE_KEY] !== false;
        notifyRuleUpdate(apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled);
        setStatus(
          pdfInlineEnabled
            ? "PDFs will open inline."
            : "PDFs will download."
        );
        refreshDiagnostics();
      }
    );
  });
}

function updatePdfContentType() {
  if (!pdfContentTypeToggle) {
    return;
  }

  const pdfContentTypeEnabled = pdfContentTypeToggle.checked;
  chrome.storage.local.set({ [PDF_CONTENT_TYPE_KEY]: pdfContentTypeEnabled }, () => {
    if (chrome.runtime.lastError) {
      setStatus("Unable to update PDF content type.", true);
      return;
    }

    chrome.storage.local.get(
      [STORAGE_KEY, ENABLED_KEY, PDF_INLINE_KEY],
      (result) => {
        if (chrome.runtime.lastError) {
          setStatus("PDF content type updated, but key read failed.", true);
          return;
        }

        const apiKey = result[STORAGE_KEY] || "";
        const enabled = result[ENABLED_KEY];
        const pdfInlineEnabled = result[PDF_INLINE_KEY] !== false;
        notifyRuleUpdate(apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled);
        setStatus(
          pdfContentTypeEnabled
            ? "PDF content type forced to application/pdf."
            : "PDF content type left unchanged."
        );
        refreshDiagnostics();
      }
    );
  });
}

function validateKey() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setValidateStatus("Enter a key before validating.", true);
    return;
  }

  setValidateStatus("Validating...");
  chrome.runtime.sendMessage({ type: "validateKey", apiKey }, (response) => {
    if (chrome.runtime.lastError || !response) {
      setValidateStatus("Validation failed.", true);
      return;
    }

    if (response.ok) {
      setValidateStatus(`Key valid (HTTP ${response.status}).`);
      return;
    }

    if (response.error === "timeout") {
      setValidateStatus("Validation timed out.", true);
      return;
    }

    if (response.error === "missing_key") {
      setValidateStatus("Enter a key before validating.", true);
      return;
    }

    if (response.status === 401 || response.status === 403) {
      setValidateStatus(`Key rejected (HTTP ${response.status}).`, true);
      return;
    }

    setValidateStatus("Validation failed.", true);
  });
}

showKeyToggle.addEventListener("change", () => {
  apiKeyInput.type = showKeyToggle.checked ? "text" : "password";
});

saveButton.addEventListener("click", saveKey);
validateButton.addEventListener("click", () => {
  validateKey();
});
removeButton.addEventListener("click", removeKey);
refreshStatusButton.addEventListener("click", refreshDiagnostics);
if (enableToggle) {
  enableToggle.addEventListener("change", updateEnabled);
}
if (pdfInlineToggle) {
  pdfInlineToggle.addEventListener("change", updatePdfInline);
}
if (pdfContentTypeToggle) {
  pdfContentTypeToggle.addEventListener("change", updatePdfContentType);
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  refreshDiagnostics();
});

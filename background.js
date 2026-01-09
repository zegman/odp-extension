const STORAGE_KEY = "odpApiKey";
const ENABLED_KEY = "odpEnabled";
const PDF_INLINE_KEY = "odpPdfInlineEnabled";
const PDF_CONTENT_TYPE_KEY = "odpPdfContentTypeEnabled";
const RULE_ID = 1;
const PDF_RULE_ID = 2;
const PDF_TYPE_RULE_ID = 3;
const LAST_MATCH_KEY = "odpLastMatch";
const VALIDATE_ENDPOINT = "https://api.uspto.gov/api/v1/patent/applications/search";

function buildRule(apiKey) {
  return {
    id: RULE_ID,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        {
          header: "X-API-KEY",
          operation: "set",
          value: apiKey
        }
      ]
    },
    condition: {
      urlFilter: "||api.uspto.gov/api/",
      resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "other", "object", "media"]
    }
  };
}

function buildPdfRule() {
  return {
    id: PDF_RULE_ID,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        {
          header: "Content-Disposition",
          operation: "set",
          value: "inline"
        }
      ]
    },
    condition: {
      regexFilter: "https://(api|data-documents|data)\\.uspto\\.gov/.*\\.pdf(\\?.*)?$",
      resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "other", "object", "media"]
    }
  };
}

function buildPdfContentTypeRule() {
  return {
    id: PDF_TYPE_RULE_ID,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        {
          header: "Content-Type",
          operation: "set",
          value: "application/pdf"
        }
      ]
    },
    condition: {
      regexFilter: "https://(api|data-documents|data)\\.uspto\\.gov/.*\\.pdf(\\?.*)?$",
      resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "other", "object", "media"]
    }
  };
}

function updateRules(apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled) {
  const isEnabled = enabled !== false;
  const isPdfInlineEnabled = pdfInlineEnabled !== false;
  const isPdfContentTypeEnabled = pdfContentTypeEnabled !== false;
  const removeRuleIds = [RULE_ID, PDF_RULE_ID, PDF_TYPE_RULE_ID];
  const addRules = [];

  if (apiKey && isEnabled) {
    addRules.push(buildRule(apiKey));
  }
  if (isPdfInlineEnabled) {
    addRules.push(buildPdfRule());
  }
  if (isPdfContentTypeEnabled) {
    addRules.push(buildPdfContentTypeRule());
  }

  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds,
      addRules
    },
    () => {
      if (chrome.runtime.lastError) {
        console.warn("Failed to update DNR rule:", chrome.runtime.lastError.message);
      }
    }
  );
}

function getDynamicRules() {
  return new Promise((resolve, reject) => {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(rules || []);
    });
  });
}

function applyDynamicRules(params) {
  return new Promise((resolve, reject) => {
    chrome.declarativeNetRequest.updateDynamicRules(params, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function withRuleDisabled(callback) {
  let hadRule = false;
  try {
    const rules = await getDynamicRules();
    hadRule = rules.some((rule) => rule.id === RULE_ID);
    if (hadRule) {
      await applyDynamicRules({ removeRuleIds: [RULE_ID], addRules: [] });
    }
  } catch (error) {
    console.warn("Failed to disable DNR rule:", error.message);
  }

  try {
    return await callback();
  } finally {
    if (hadRule) {
      syncRuleFromStorage();
    }
  }
}

async function validateApiKey(apiKey) {
  if (!apiKey) {
    return { ok: false, error: "missing_key" };
  }

  return await withRuleDisabled(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(VALIDATE_ENDPOINT, {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          "Accept": "application/json"
        },
        cache: "no-store",
        signal: controller.signal
      });

      return { ok: response.ok, status: response.status };
    } catch (error) {
      const errorType = error && error.name === "AbortError" ? "timeout" : "network";
      return { ok: false, error: errorType };
    } finally {
      clearTimeout(timeoutId);
    }
  });
}

function syncRuleFromStorage() {
  chrome.storage.local.get(
    [STORAGE_KEY, ENABLED_KEY, PDF_INLINE_KEY, PDF_CONTENT_TYPE_KEY],
    (result) => {
    if (chrome.runtime.lastError) {
      console.warn("Failed to read storage:", chrome.runtime.lastError.message);
      return;
    }

    const apiKey = result[STORAGE_KEY] || "";
    const enabled = result[ENABLED_KEY];
    const pdfInlineEnabled = result[PDF_INLINE_KEY];
    const pdfContentTypeEnabled = result[PDF_CONTENT_TYPE_KEY];
    updateRules(apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled);
  });
}

chrome.runtime.onInstalled.addListener(syncRuleFromStorage);
chrome.runtime.onStartup.addListener(syncRuleFromStorage);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  if (message.type === "odpKeyUpdated") {
    const apiKey = message.apiKey || "";
    const enabled = message.enabled;
    const pdfInlineEnabled = message.pdfInlineEnabled;
    const pdfContentTypeEnabled = message.pdfContentTypeEnabled;
    updateRules(apiKey, enabled, pdfInlineEnabled, pdfContentTypeEnabled);
    if (sendResponse) {
      sendResponse({ ok: true });
    }
    return;
  }

  if (message.type === "validateKey") {
    validateApiKey(message.apiKey || "").then((result) => {
      if (sendResponse) {
        sendResponse(result);
      }
    });
    return true;
  }
});

const ruleMatchedDebug = chrome.declarativeNetRequest?.onRuleMatchedDebug;
if (ruleMatchedDebug && typeof ruleMatchedDebug.addListener === "function") {
  ruleMatchedDebug.addListener((details) => {
    const request = details.request || {};
    const rule = details.rule || {};
    const entry = {
      time: new Date().toISOString(),
      ruleId: rule.ruleId || details.ruleId || RULE_ID,
      url: request.url || "",
      type: request.type || "",
      tabId: typeof request.tabId === "number" ? request.tabId : null
    };

    chrome.storage.local.set({ [LAST_MATCH_KEY]: entry });
    console.log("DNR rule matched:", entry);
  });
} else {
  console.warn("DNR debug events unavailable; last match tracking disabled.");
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (
    !changes[STORAGE_KEY]
    && !changes[ENABLED_KEY]
    && !changes[PDF_INLINE_KEY]
    && !changes[PDF_CONTENT_TYPE_KEY]
  ) {
    return;
  }

  syncRuleFromStorage();
});

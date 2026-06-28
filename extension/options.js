// BriefFill Browser Extension — Options Script

document.addEventListener("DOMContentLoaded", () => {
  const apiKey = document.getElementById("apiKey");
  const serverUrl = document.getElementById("serverUrl");
  const testBtn = document.getElementById("testBtn");
  const saveBtn = document.getElementById("saveBtn");
  const testResult = document.getElementById("testResult");

  // Load saved config
  chrome.storage.sync.get("brieffill_config", (result) => {
    if (result.brieffill_config) {
      apiKey.value = result.brieffill_config.apiKey || "";
      serverUrl.value = result.brieffill_config.serverUrl || "https://brieffill.com";
    }
  });

  // Test connection
  testBtn.addEventListener("click", async () => {
    const key = apiKey.value.trim();
    const url = serverUrl.value;

    if (!key) {
      showTestResult("Enter an API key first", "err");
      return;
    }

    testBtn.textContent = "Testing...";
    testBtn.disabled = true;
    showTestResult("", "");

    try {
      // Test server connectivity first
      const healthRes = await fetch(`${url}/api/health`);
      if (!healthRes.ok) {
        showTestResult("Server is not responding. Check the URL.", "err");
        return;
      }
      // Test API key by making an authenticated request
      const authRes = await fetch(`${url}/api/briefs/fields`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (authRes.ok) {
        showTestResult("Connected! API key is valid.", "ok");
      } else if (authRes.status === 401 || authRes.status === 403) {
        showTestResult("Invalid API key. Check your key and try again.", "err");
      } else {
        showTestResult(`Server responded with status ${authRes.status}`, "err");
      }
    } catch {
      showTestResult("Cannot connect to server. Check the URL.", "err");
    }

    testBtn.textContent = "Test Connection";
    testBtn.disabled = false;
  });

  // Save
  saveBtn.addEventListener("click", () => {
    const config = {
      apiKey: apiKey.value.trim(),
      serverUrl: serverUrl.value,
    };

    chrome.storage.sync.set({ brieffill_config: config }, () => {
      saveBtn.textContent = "Saved!";
      saveBtn.classList.add("btn-success");
      setTimeout(() => {
        saveBtn.textContent = "Save";
        saveBtn.classList.remove("btn-success");
      }, 2000);
    });
  });

  function showTestResult(msg, type) {
    testResult.textContent = msg;
    testResult.className = `status ${type === "ok" ? "status-ok" : type === "err" ? "status-err" : "hidden"}`;
    if (!msg) testResult.classList.add("hidden");
  }
});

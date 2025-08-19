// Popup script for FC Block extension

document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggle");
  const statusText = document.getElementById("status");
  let countdownTimer = null;
  let isCountingDown = false;

  // Load current state
  const result = await chrome.storage.sync.get(["fcBlockEnabled"]);
  const isEnabled = result.fcBlockEnabled !== false; // Default to true

  // Update UI
  updateToggleState(isEnabled);
  
  // Enable animations after initial load
  setTimeout(() => {
    toggle.classList.add('animated');
  }, 100);

  // Add click handler
  toggle.addEventListener("click", async () => {
    // Ignore clicks during countdown
    if (isCountingDown) return;

    const currentState = toggle.classList.contains("active");
    const newState = !currentState;

    // If disabling (going from true to false), show countdown
    if (currentState && !newState) {
      isCountingDown = true;
      toggle.style.pointerEvents = "none";
      toggle.style.opacity = "0.7";

      let countdown = 3;

      statusText.textContent = `Disabling in ${countdown}...`;

      countdownTimer = setInterval(() => {
        countdown--;

        if (countdown > 0) {
          statusText.textContent = `Disabling in ${countdown}...`;
        } else {
          statusText.textContent = `Disabled`;
          clearInterval(countdownTimer);
          toggle.style.pointerEvents = "";
          toggle.style.opacity = "";
          isCountingDown = false;

          // Apply the state change
          applyStateChange(newState);
        }
      }, 1000);
    } else {
      // If enabling, apply immediately
      applyStateChange(newState);
    }
  });

  async function applyStateChange(newState) {
    // Save state
    await chrome.storage.sync.set({ fcBlockEnabled: newState });

    // Update UI
    updateToggleState(newState);

    // Notify content script of state change
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.url && tab.url.includes("farcaster.xyz")) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "toggleBlock",
            enabled: newState,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log("Error sending message:", chrome.runtime.lastError);
              // If content script isn't ready, reload the tab
              chrome.tabs.reload(tab.id);
            } else {
              console.log("Message sent successfully:", response);
            }
          }
        );
      }
    } catch (error) {
      console.log("Could not send message to content script:", error);
    }
  }

  function updateToggleState(enabled) {
    if (enabled) {
      toggle.classList.add("active");
      statusText.textContent = "Enabled";
    } else {
      toggle.classList.remove("active");
      statusText.textContent = "Disabled";
    }
  }
});

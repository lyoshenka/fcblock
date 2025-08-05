// Farcaster Feed Blocker Content Script

let isBlocking = true; // Default state
let originalContent = null; // Store original content when blocking is disabled

// Check initial state from storage
chrome.storage.sync.get(["fcBlockEnabled"], (result) => {
  isBlocking = result.fcBlockEnabled !== false; // Default to true
  if (isBlocking) {
    document.body.classList.add("fc-block-enabled");
    updateDOM();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleBlock") {
    console.log("Received toggle message:", request.enabled);
    isBlocking = request.enabled;

    if (isBlocking) {
      console.log("Enabling feed blocking");
      document.body.classList.add("fc-block-enabled");
    } else {
      console.log("Disabling feed blocking");
      document.body.classList.remove("fc-block-enabled");
    }

    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

function updateDOM() {
  const doUpdate = () => {
    setBlockAttributeOnMainFeed();
    setBlockAttributeOnNotifications();
    addBlockedMessageToMainFeed();
  };

  // Wait for the page to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      doUpdate();
    });
  } else {
    doUpdate();
  }
}

function setBlockAttributeOnMainFeed() {
  // Look for any nav element that contains both "Home" and "Following" text
  const allNavs = document.querySelectorAll("nav");
  let homeNav = null;

  for (const nav of allNavs) {
    const navText = nav.textContent || "";
    if (navText.includes("Home") && navText.includes("Following")) {
      homeNav = nav;
      console.log("Found home feed nav element with Home and Following");
      break;
    }
  }

  if (!homeNav) {
    console.log("No nav with Home and Following found - not on home feed page");
    return;
  }

  // Get the parent container of the nav
  const navParent = homeNav.parentElement;
  if (!navParent) {
    console.log("No nav parent found");
    return;
  }

  // Hide all sibling divs of the nav (but not the nav itself)
  const siblings = Array.from(navParent.children);
  let hiddenCount = 0;

  siblings.forEach((sibling) => {
    if (sibling !== homeNav && sibling.tagName.toLowerCase() === "div") {
      // Check if we already blocked this element
      if (
        !sibling.classList.contains("farcaster-feed-blocked") &&
        !sibling.hasAttribute("data-fc-block-hide")
      ) {
        sibling.setAttribute("data-fc-block-hide", "true");
        hiddenCount++;
      }
    }
  });

  console.log(`Hidden ${hiddenCount} sibling divs of home nav`);
}

function addBlockedMessageToMainFeed() {
  // Look for any nav element that contains both "Home" and "Following" text
  const allNavs = document.querySelectorAll("nav");
  let homeNav = null;

  for (const nav of allNavs) {
    const navText = nav.textContent || "";
    if (navText.includes("Home") && navText.includes("Following")) {
      homeNav = nav;
      break;
    }
  }

  if (!homeNav) {
    return;
  }

  // Get the parent container of the nav
  const navParent = homeNav.parentElement;
  if (!navParent) {
    return;
  }

  // Add our blocking message if we haven't already
  if (!navParent.querySelector(".farcaster-feed-blocked")) {
    const blockedMessage = document.createElement("div");
    blockedMessage.className = "farcaster-feed-blocked";
    blockedMessage.innerHTML = `
      <div>
        <h2>Nothing to see here</h2>
        <p>The Farcaster feed has been blocked by <a href="https://github.com/lyoshenka/fcblock">FC Block extension</a>.</p>
      </div>
    `;
    navParent.appendChild(blockedMessage);
  }
}

function setBlockAttributeOnNotifications() {
  // Target the specific notification badge within the notifications link
  const notificationLinks = document.querySelectorAll(
    'a[href="/~/notifications"]'
  );

  if (notificationLinks.length > 0) {
    notificationLinks[0].setAttribute("data-fc-block-hide", "true");
  }
}

// Observer to handle dynamic content loading
function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if new content was added that might be the feed or notifications
        setTimeout(() => {
          updateDOM();
        }, 100);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize the blocker
updateDOM();
setupObserver();

// Also run the blocker when the URL changes (for SPA navigation)
let currentUrl = location.href;
const urlCheckInterval = setInterval(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(() => {
      updateDOM();
    }, 100); // Give the new page time to load
  }
}, 1000);

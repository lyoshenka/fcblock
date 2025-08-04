// Farcaster Feed Blocker Content Script

let isBlocking = true; // Default state
let originalContent = null; // Store original content when blocking is disabled

// Check initial state from storage
chrome.storage.sync.get(['fcBlockEnabled'], (result) => {
  isBlocking = result.fcBlockEnabled !== false; // Default to true
  if (isBlocking) {
    blockFarcasterFeed();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleBlock') {
    console.log('Received toggle message:', request.enabled);
    isBlocking = request.enabled;
    
    if (isBlocking) {
      console.log('Enabling feed blocking');
      blockFeed();
    } else {
      console.log('Disabling feed blocking');
      unblockFeed();
    }
    
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

function blockFarcasterFeed() {
  // Wait for the page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isBlocking) blockFeed();
    });
  } else {
    if (isBlocking) blockFeed();
  }
}

function blockFeed() {
  if (!isBlocking) return;
  
  // Block the main feed
  blockMainFeed();
  
  // Hide notification counts
  hideNotificationCounts();
}

function blockMainFeed() {
  // Common selectors for feed content on Farcaster
  const feedSelectors = [
    '[data-testid="feed"]',
    '[data-testid="home-feed"]',
    '.feed',
    '.home-feed',
    '[role="main"]',
    'main',
    // More specific selectors for Farcaster's structure
    'div[class*="feed"]',
    'div[class*="timeline"]',
    'div[class*="posts"]'
  ];

  // Try to find the feed container
  let feedContainer = null;
  
  for (const selector of feedSelectors) {
    feedContainer = document.querySelector(selector);
    if (feedContainer) {
      console.log('Found feed container with selector:', selector);
      break;
    }
  }

  // If we can't find a specific feed container, look for the main content area
  if (!feedContainer) {
    // Look for the main content area that likely contains the feed
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]') ||
                       document.querySelector('div[class*="main"]') ||
                       document.querySelector('div[class*="content"]');
    
    if (mainContent) {
      feedContainer = mainContent;
      console.log('Using main content area as feed container');
    }
  }

  if (feedContainer && !feedContainer.querySelector('.farcaster-feed-blocked')) {
    // Store original content if we haven't already
    if (!originalContent) {
      originalContent = feedContainer.innerHTML;
    }
    
    // Create the replacement message
    const blockedMessage = document.createElement('div');
    blockedMessage.className = 'farcaster-feed-blocked';
    blockedMessage.innerHTML = `
      <div class="blocked-content">
        <h2>Nothing to see here</h2>
        <p>The Farcaster feed has been blocked by FC Block extension.</p>
      </div>
    `;

    // Replace the feed content
    feedContainer.innerHTML = '';
    feedContainer.appendChild(blockedMessage);
    
    console.log('Farcaster feed has been blocked and replaced');
  }
}

function hideNotificationCounts() {
  // Common selectors for notification badges/counts
  const notificationSelectors = [
    // Generic notification badge selectors
    '[data-testid*="notification"]',
    '[data-testid*="badge"]',
    '.notification-badge',
    '.badge',
    '.notification-count',
    '.unread-count',
    // Bell icon related selectors
    '[data-testid*="bell"] .badge',
    '[data-testid*="bell"] .count',
    '[data-testid*="notification"] .count',
    // CSS class patterns for badges
    'div[class*="badge"]',
    'span[class*="badge"]',
    'div[class*="count"]',
    'span[class*="count"]',
    'div[class*="notification"]',
    'span[class*="notification"]',
    // Common badge styling patterns
    '[style*="background-color: red"]',
    '[style*="background-color: #"]'
  ];

  notificationSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Check if this looks like a notification count (contains numbers or is small)
      const text = element.textContent?.trim();
      const isNumeric = text && /^\d+$/.test(text);
      const isSmallElement = element.offsetWidth < 50 && element.offsetHeight < 50;
      
      if (isNumeric || (isSmallElement && element.offsetWidth > 0)) {
        element.style.display = 'none';
        element.setAttribute('data-fc-block-notification-hidden', 'true');
        console.log('Hidden notification element:', selector, text);
      }
    });
  });
}

function unblockFeed() {
  const blockedElement = document.querySelector('.farcaster-feed-blocked');
  if (blockedElement) {
    // Remove the blocked message
    blockedElement.remove();
    console.log('Farcaster feed has been unblocked');
  }
  
  // Show previously hidden notification elements
  const hiddenNotifications = document.querySelectorAll('[data-fc-block-notification-hidden="true"]');
  hiddenNotifications.forEach(element => {
    element.style.display = '';
    element.removeAttribute('data-fc-block-notification-hidden');
  });
  
  // Clear the original content cache so the page can load normally
  originalContent = null;
  
  // For better user experience, reload the page to restore original content
  // This ensures the feed loads properly
  setTimeout(() => {
    location.reload();
  }, 100);
}

// Observer to handle dynamic content loading
function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && isBlocking) {
        // Check if new content was added that might be the feed or notifications
        setTimeout(() => {
          blockMainFeed();
          hideNotificationCounts();
        }, 100);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize the blocker
blockFarcasterFeed();
setupObserver();

// Also run the blocker when the URL changes (for SPA navigation)
let currentUrl = location.href;
const urlCheckInterval = setInterval(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    if (isBlocking) {
      setTimeout(() => {
        blockMainFeed();
        hideNotificationCounts();
      }, 500); // Give the new page time to load
    }
  }
}, 1000);
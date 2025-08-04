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
  // Look for any nav element that contains both "Home" and "Following" text
  const allNavs = document.querySelectorAll('nav');
  let homeNav = null;
  
  for (const nav of allNavs) {
    const navText = nav.textContent || '';
    if (navText.includes('Home') && navText.includes('Following')) {
      homeNav = nav;
      console.log('Found home feed nav element with Home and Following');
      break;
    }
  }
  
  if (!homeNav) {
    console.log('No nav with Home and Following found - not on home feed page');
    return;
  }

  // Get the parent container of the nav
  const navParent = homeNav.parentElement;
  if (!navParent) {
    console.log('No nav parent found');
    return;
  }

  // Hide all sibling divs of the nav (but not the nav itself)
  const siblings = Array.from(navParent.children);
  let hiddenCount = 0;
  
  siblings.forEach(sibling => {
    if (sibling !== homeNav && sibling.tagName.toLowerCase() === 'div') {
      // Check if we already blocked this element
      if (!sibling.classList.contains('farcaster-feed-blocked') && 
          !sibling.hasAttribute('data-fc-block-hidden')) {
        sibling.style.display = 'none';
        sibling.setAttribute('data-fc-block-hidden', 'true');
        hiddenCount++;
      }
    }
  });

  // Add our blocking message if we haven't already
  if (!navParent.querySelector('.farcaster-feed-blocked')) {
    const blockedMessage = document.createElement('div');
    blockedMessage.className = 'farcaster-feed-blocked';
    blockedMessage.innerHTML = `
      <div class="blocked-content">
        <h2>Nothing to see here</h2>
        <p>The Farcaster feed has been blocked by FC Block extension.</p>
      </div>
    `;
    navParent.appendChild(blockedMessage);
  }

  console.log(`Hidden ${hiddenCount} sibling divs of home nav`);
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
  
  // Show previously hidden sibling divs
  const hiddenElements = document.querySelectorAll('[data-fc-block-hidden="true"]');
  hiddenElements.forEach(element => {
    element.style.display = '';
    element.removeAttribute('data-fc-block-hidden');
  });
  
  // Show previously hidden notification elements
  const hiddenNotifications = document.querySelectorAll('[data-fc-block-notification-hidden="true"]');
  hiddenNotifications.forEach(element => {
    element.style.display = '';
    element.removeAttribute('data-fc-block-notification-hidden');
  });
  
  console.log('All blocked elements have been restored');
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
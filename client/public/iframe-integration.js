/**
 * SparrowX iframe integration script
 * 
 * This script should be included on the parent website that embeds the SparrowX iframe
 * to handle iOS authentication and navigation events.
 * 
 * Usage:
 * <script src="https://your-sparrow-domain.com/iframe-integration.js"></script>
 */

(function() {
  'use strict';

  // Listen for messages from the SparrowX iframe
  window.addEventListener('message', function(event) {
    // Verify the origin for security (replace with your actual domain)
    // You should replace this with your actual SparrowX domain
    if (event.origin !== 'https://sparrow-new-client.vercel.app') {
      return;
    }

    // Handle authentication success
    if (event.data && event.data.type === 'SPARROW_AUTH_SUCCESS') {
      console.log('SparrowX: Authentication successful');
      
      // Optional: You can perform additional actions here
      // For example, refresh other parts of your page, show notifications, etc.
      
      // The iframe will handle its own navigation automatically
      // but you can add custom logic here if needed
      
      // Example: Show a success message
      if (typeof window.showSparrowAuthSuccess === 'function') {
        window.showSparrowAuthSuccess();
      }
    }

    // Handle token removal/logout
    if (event.data && event.data.type === 'SPARROW_TOKEN_REMOVED') {
      console.log('SparrowX: User logged out');
      
      // Optional: Handle logout actions
      if (typeof window.showSparrowLogout === 'function') {
        window.showSparrowLogout();
      }
    }
  });

  // Optional: Provide a method to communicate with the iframe
  window.SparrowX = {
    // Method to send messages to the iframe
    sendMessage: function(message) {
      var iframe = document.getElementById('sparrowx-iframe') || 
                   document.querySelector('iframe[src*="sparrow"]');
      
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
      }
    },
    
    // Method to check if user is authenticated (placeholder)
    checkAuth: function() {
      this.sendMessage({
        type: 'CHECK_AUTH_STATUS',
        timestamp: Date.now()
      });
    }
  };

  console.log('SparrowX iframe integration loaded');
})();
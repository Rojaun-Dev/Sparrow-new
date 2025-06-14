# SparrowX Client Integration Guide

This document provides comprehensive instructions for integrating the SparrowX package forwarding service into your e-commerce platform or website.

## Table of Contents

1. [Integration Methods](#integration-methods)
2. [API Key Authentication](#api-key-authentication)
3. [Redirect Integration](#redirect-integration)
4. [Iframe Integration](#iframe-integration)
5. [Configuration Options](#configuration-options)
6. [Troubleshooting](#troubleshooting)

## Integration Methods

SparrowX offers two primary methods for integration:

### 1. Redirect Integration

Redirect integration allows you to send your customers to the SparrowX platform while maintaining your company's branding. This is ideal when you want to provide a seamless experience without embedding the entire application in your website.

### 2. Iframe Integration

Iframe integration enables you to embed the SparrowX platform directly within your website. This provides a fully integrated experience where customers never leave your site.

## API Key Authentication

All integrations require an API key for authentication and company identification.

### Generating an API Key

1. Log in to your SparrowX admin dashboard
2. Navigate to Settings > Integration
3. Click the "Generate API Key" button
4. Copy and securely store your API key

**Important Security Notes:**
- API keys grant access to your company's data on the SparrowX platform
- Store API keys securely and never expose them in client-side code
- If your API key is compromised, generate a new one immediately (this will invalidate the old key)

## Redirect Integration

### Configuration

In your SparrowX admin dashboard:

1. Navigate to Settings > Integration
2. Enable "Redirect Integration"
3. Configure your company subdomain (e.g., `yourcompany.sparrowx.com`)
4. Save your settings

### Implementation

To redirect users to your SparrowX portal:

```javascript
// Example redirect code
function redirectToSparrowX(userId) {
  const apiKey = 'YOUR_API_KEY';
  const subdomain = 'yourcompany';
  
  // Optional: Include user identification for automatic login
  const userIdentifier = encodeURIComponent(userId);
  
  window.location.href = `https://${subdomain}.sparrowx.com?apiKey=${apiKey}&userId=${userIdentifier}`;
}
```

### URL Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| apiKey    | Yes      | Your SparrowX API key |
| userId    | No       | Your internal user identifier for automatic login |
| returnUrl | No       | URL to return to after completing actions |

## Iframe Integration

### Configuration

In your SparrowX admin dashboard:

1. Navigate to Settings > Integration
2. Enable "Iframe Integration"
3. Add your website domain(s) to the allowed origins list
4. Save your settings

### Implementation

```html
<!-- Example iframe integration -->
<iframe 
  id="sparrowx-frame"
  src="https://embed.sparrowx.com?apiKey=YOUR_API_KEY" 
  width="100%" 
  height="800px"
  style="border: none;"
></iframe>
```

### Advanced Implementation with Messaging

```javascript
// Example of two-way communication with the iframe
const frame = document.getElementById('sparrowx-frame');

// Listen for messages from SparrowX
window.addEventListener('message', (event) => {
  // Verify the origin for security
  if (event.origin !== 'https://embed.sparrowx.com') return;
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'READY':
      console.log('SparrowX frame is ready');
      break;
    case 'PACKAGE_CREATED':
      console.log('New package created:', data.packageId);
      break;
    // Handle other event types
  }
});

// Send messages to SparrowX
function sendMessageToSparrowX(message) {
  frame.contentWindow.postMessage(message, 'https://embed.sparrowx.com');
}

// Example: Navigate to a specific section
sendMessageToSparrowX({ type: 'NAVIGATE', path: '/packages' });
```

## Configuration Options

### Branding Options

Customize the appearance of the SparrowX platform to match your brand:

| Setting | Description |
|---------|-------------|
| Company Name | Displayed in headers and emails |
| Logo | Your company logo (recommended size: 200x80px) |
| Primary Color | Main accent color (hex format) |
| Favicon | Browser tab icon (must be .ico format) |

### Integration Settings

| Setting | Description |
|---------|-------------|
| API Key | Authentication key for integration |
| Allowed Origins | Domains allowed to embed SparrowX (for iframe integration) |
| Redirect Integration | Enable/disable redirect method |
| Iframe Integration | Enable/disable iframe embedding |
| Custom CSS | Optional CSS overrides for deeper customization |

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Ensure you're using the most recently generated API key
   - Check that the key is being sent correctly (no extra spaces)

2. **X-Frame-Options Error**
   - Verify your domain is added to the allowed origins list
   - Allow up to 5 minutes for changes to propagate

3. **Authentication Failures**
   - Ensure your API key has not been revoked
   - Check that your integration settings are saved

### Support

For technical assistance with your integration:

- Email: integration-support@sparrowx.com
- Developer Documentation: https://docs.sparrowx.com
- API Reference: https://api.sparrowx.com/docs

---

© SparrowX 2023 | [Terms of Service](https://sparrowx.com/terms) | [Privacy Policy](https://sparrowx.com/privacy) 
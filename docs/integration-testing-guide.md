# SparrowX Integration Testing Guide

This document provides instructions for testing the integration features of the SparrowX platform, including both redirect and iframe integration methods.

## Prerequisites

Before testing, ensure you have:

1. Access to a SparrowX admin account with admin_l2 privileges
2. A running instance of the SparrowX application (backend and frontend)
3. A test company configured in the system
4. A simple HTML page for testing iframe embedding

## Testing API Key Generation

1. **Generate an API Key**:
   - Log in to the SparrowX admin dashboard
   - Navigate to Settings > Integration
   - Click "Generate API Key"
   - Verify that a new API key is displayed
   - Copy the API key for testing

2. **Verify API Key Security**:
   - Generate a new API key
   - Confirm that the previous API key is no longer valid

## Testing Redirect Integration

1. **Configure Redirect Integration**:
   - In the SparrowX admin dashboard, navigate to Settings > Integration
   - Enable "Redirect Integration"
   - Add your test domain (e.g., `localhost`) to the allowed domains list
   - Save the settings

2. **Test Basic Redirect**:
   - Create a test HTML file with the following content:

```html
<!DOCTYPE html>
<html>
<head>
  <title>SparrowX Redirect Test</title>
</head>
<body>
  <h1>SparrowX Redirect Test</h1>
  <button id="redirectButton">Redirect to SparrowX</button>

  <script>
    document.getElementById('redirectButton').addEventListener('click', function() {
      const apiKey = 'YOUR_API_KEY'; // Replace with your generated API key
      const subdomain = 'YOUR_SUBDOMAIN'; // Replace with your company subdomain
      
      window.location.href = `http://localhost:3000?apiKey=${apiKey}&companySubdomain=${subdomain}`;
    });
  </script>
</body>
</html>
```

3. **Verify Redirect Functionality**:
   - Open the test HTML file in a browser
   - Click the "Redirect to SparrowX" button
   - Verify that you are redirected to the SparrowX application
   - Confirm that the company branding is applied correctly

## Testing Iframe Integration

1. **Configure Iframe Integration**:
   - In the SparrowX admin dashboard, navigate to Settings > Integration
   - Enable "Iframe Integration"
   - Add your test domain (e.g., `localhost`) to the allowed domains list
   - Save the settings

2. **Create a Test HTML Page**:
   - Create a test HTML file with the following content:

```html
<!DOCTYPE html>
<html>
<head>
  <title>SparrowX Iframe Test</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    iframe { border: 1px solid #ddd; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SparrowX Iframe Integration Test</h1>
    <p>This page demonstrates embedding SparrowX in an iframe.</p>
    
    <iframe 
      id="sparrowx-frame"
      src="http://localhost:3000/embed?apiKey=YOUR_API_KEY" 
      width="100%" 
      height="600px"
      style="border: none;"
    ></iframe>
    
    <div class="controls">
      <h3>Test Controls</h3>
      <button id="testMessageBtn">Send Test Message</button>
      <pre id="messageLog"></pre>
    </div>
  </div>

  <script>
    // Replace with your actual API key
    const apiKey = 'YOUR_API_KEY';
    const frame = document.getElementById('sparrowx-frame');
    const messageLog = document.getElementById('messageLog');
    
    // Update iframe src with API key
    frame.src = `http://localhost:3000/embed?apiKey=${apiKey}`;
    
    // Listen for messages from the iframe
    window.addEventListener('message', function(event) {
      if (event.origin !== 'http://localhost:3000') return;
      
      console.log('Received message:', event.data);
      messageLog.textContent += JSON.stringify(event.data, null, 2) + '\n\n';
    });
    
    // Send a test message to the iframe
    document.getElementById('testMessageBtn').addEventListener('click', function() {
      const message = {
        type: 'TEST_MESSAGE',
        data: { timestamp: new Date().toISOString() }
      };
      
      frame.contentWindow.postMessage(message, 'http://localhost:3000');
      console.log('Sent message:', message);
    });
  </script>
</body>
</html>
```

3. **Test the Iframe Integration**:
   - Replace `YOUR_API_KEY` with your generated API key
   - Open the HTML file in a browser
   - Verify that the SparrowX application loads in the iframe
   - Confirm that company branding is applied correctly
   - Test the message passing by clicking the "Send Test Message" button

## Testing API Authentication

1. **Test API Key Validation**:
   - Use cURL or Postman to make a request to the API key validation endpoint:

```bash
curl -X GET "http://localhost:3001/api/company-by-api-key?apiKey=YOUR_API_KEY"
```

2. **Verify Response**:
   - The response should include company information:
   ```json
   {
     "id": "company-uuid",
     "name": "Company Name",
     "subdomain": "company-subdomain",
     "logo": "logo-url-or-null"
   }
   ```

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check that the domain you're testing from is included in the allowed origins
   - Verify that the CORS middleware is properly configured in the backend

2. **X-Frame-Options Issues**:
   - If the iframe doesn't load, check browser console for X-Frame-Options errors
   - Verify that X-Frame-Options headers are properly set for iframe integration

3. **API Key Not Working**:
   - Confirm the API key is correctly copied without extra spaces
   - Check if the API key has been regenerated or invalidated
   - Verify the API key is being sent in the correct parameter

### Server-Side Debugging

To debug server-side issues, check the backend logs:

```bash
# View backend logs
cd backend
npm run dev -- --debug
```

Look for error messages related to:
- API key validation
- Company lookup by subdomain
- CORS or X-Frame-Options headers

## Automated Testing

For automated testing, you can use the following script to verify the API endpoints:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3001/api"
API_KEY="your-api-key"
SUBDOMAIN="your-subdomain"

# Test company by API key
echo "Testing company by API key..."
curl -s "$API_URL/company-by-api-key?apiKey=$API_KEY" | jq

# Test company by subdomain
echo "Testing company by subdomain..."
curl -s "$API_URL/companies/by-subdomain/$SUBDOMAIN" | jq

echo "Tests completed."
```

Save this as `test-integration.sh` and run it with:

```bash
chmod +x test-integration.sh
./test-integration.sh
```

---

## Next Steps

After successful testing, you can:

1. Configure your production environment with the appropriate settings
2. Implement the integration in your actual website or application
3. Set up monitoring to ensure the integration continues to function properly

For any issues or questions, contact the development team. 
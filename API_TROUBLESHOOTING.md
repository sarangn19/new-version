# Gemini API Troubleshooting Guide

## 🚨 Current Issue: 404 Error

The API is returning a 404 error, which typically means:

### Most Likely Causes:

1. **API Key Issues**
   - The API key might be invalid or expired
   - The Generative AI API is not enabled in Google Cloud Console
   - Billing is not set up (required for Gemini API)

2. **Model Name Issues**
   - The model name has changed
   - The model is not available in your region

## 🔧 Quick Fixes to Try:

### Step 1: Verify Your API Key
1. Open `verify-api-key.html` in your browser
2. Click "Verify API Key" to test the key
3. Check the results for specific error messages

### Step 2: Check Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Enabled APIs"
3. Make sure "Generative Language API" is enabled
4. Check if billing is set up under "Billing"

### Step 3: Try Different Model Names
The API might be using different model names. Common ones:
- `gemini-pro`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### Step 4: Regenerate API Key
If the key is old or restricted:
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" > "Credentials"
3. Create a new API key
4. Update `js/ai-config.js` with the new key

## 🛠️ Manual Testing

### Test 1: Direct API Call
```javascript
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Test 2: Content Generation
```javascript
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "Hello" }] }]
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔄 Alternative Solutions

### Option 1: Use a Different API Key
If you have another Google Cloud project:
1. Create a new API key in that project
2. Enable the Generative Language API
3. Update the configuration

### Option 2: Mock Responses (Temporary)
While fixing the API, you can enable mock responses:
1. Edit `js/ai-service-manager.js`
2. Add a fallback mock response system

### Option 3: Use a Proxy Server
If CORS is an issue:
1. Set up a simple proxy server
2. Route API calls through the proxy

## 📋 Checklist

- [ ] API key is valid and not expired
- [ ] Generative Language API is enabled
- [ ] Billing is set up in Google Cloud
- [ ] Model name is correct
- [ ] No CORS restrictions
- [ ] Network connectivity is working

## 🆘 If Nothing Works

1. **Check API Status**: Visit [Google Cloud Status](https://status.cloud.google.com/)
2. **Review Quotas**: Check if you've hit usage limits
3. **Contact Support**: Google Cloud Support for API issues
4. **Use Alternative**: Consider OpenAI API as a backup

## 🔧 Current Configuration

The system is currently configured with:
- **API Key**: `AIzaSyA4BG79A4QsdyA20NFVF9YVVvgt4wTJh8A`
- **Model**: `gemini-pro`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models`

Update these in `js/ai-config.js` if needed.
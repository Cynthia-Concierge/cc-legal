# Gemini Live API Setup Guide

## Quick Setup

1. **Get Your Gemini API Key**
   - Go to https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy the key

2. **Add to Environment Variables**
   - Create a `.env` file in the root directory (if it doesn't exist)
   - Add this line:
     ```
     VITE_GEMINI_API_KEY=your-actual-api-key-here
     ```
   - **Important**: The variable MUST be prefixed with `VITE_` to be accessible in the browser

3. **Restart Dev Server**
   - Stop your current dev server (Ctrl+C)
   - Restart with `npm run dev`
   - Vite will pick up the new environment variable

## Verification

1. **Check API Key Status**
   - Open the Template Widget tab
   - Open the widget (click the chat button)
   - If API key is missing, you'll see a red warning
   - If API key is found, the status indicator will be green when connected

2. **Test Connection**
   - Click "Start Conversation"
   - Grant microphone permissions when prompted
   - You should see "Connecting..." then the connection state should change to "Connected"
   - The visualizer bars should animate when you speak

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Look for logs starting with `[VoiceWidget]`
   - You should see:
     - `[VoiceWidget] API key found`
     - `[VoiceWidget] Connecting to Gemini Live...`
     - `[VoiceWidget] Gemini Live connection opened successfully!`

## Troubleshooting

### "API Key not found" Error
- Make sure `.env` file is in the root directory (same level as `package.json`)
- Make sure the variable is named `VITE_GEMINI_API_KEY` (not `GEMINI_API_KEY`)
- Restart the dev server after adding the key
- Check that there are no spaces around the `=` sign

### Connection Fails
- Check browser console for detailed error messages
- Verify your API key is valid at https://aistudio.google.com/app/apikey
- Make sure you have internet connection
- Check if your API key has the necessary permissions

### Audio Not Working
- Grant microphone permissions when prompted
- Check browser settings for microphone access
- Try refreshing the page and granting permissions again

### Model Not Found Error
- The model name is: `gemini-2.5-flash-native-audio-preview-09-2025`
- If this model is not available, check Google's documentation for the latest model name
- Update the model name in `src/components/VoiceWidget.tsx` line ~352

## Testing the Widget

1. **Template Widget Tab**
   - Go to the "Template Widget" tab
   - The widget appears in the bottom right corner
   - Click the chat button to open
   - Click "Start Conversation"
   - Try saying: "What services do you offer?"

2. **Voice Features**
   - Speak naturally - the AI will transcribe and respond
   - You'll see your words appear in real-time
   - The AI will respond with voice

3. **Camera Features**
   - Ask: "Can you analyze my skin?"
   - The AI will request camera access
   - Grant access to test visual analysis

4. **Booking Features**
   - Try: "I'd like to book a consultation"
   - The AI will guide you through booking
   - Appointments are saved to the database

## Environment Variables Reference

```env
# Required for Voice Widget
VITE_GEMINI_API_KEY=your-gemini-api-key

# Backend API (optional, defaults to localhost:3001)
VITE_API_URL=http://localhost:3001

# Other backend variables (server-side only, no VITE_ prefix)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
FIRECRAWL_API_KEY=your-firecrawl-key
OPENAI_API_KEY=your-openai-key
```

## Notes

- The API key is exposed to the browser (this is normal for client-side apps)
- For production, consider using a proxy endpoint to keep the key server-side
- The widget uses Gemini Live API which requires real-time WebSocket connections
- Make sure your network allows WebSocket connections


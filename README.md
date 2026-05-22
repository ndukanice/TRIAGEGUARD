<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/005d2ed5-b153-4234-aec2-6703e62caabb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` (or copy `.env.example`) and set:
   - `OPENROUTER_API_KEY=your_openrouter_key`
   - Optional fallback: `HUGGINGFACE_API_KEY=your_huggingface_key`
3. Run the app:
   `npm run dev`

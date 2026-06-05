# Netlify Pro Deployment Setup Guide

## 🚀 **Netlify Pro Setup (Recommended)**

Since you're using Netlify Pro, you get unlimited environment variables and better Next.js support!

### **Step 1: Deploy to Netlify**
1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`

### **Step 2: Add Environment Variables**
In your Netlify Pro dashboard, go to:
1. Site settings → Environment variables
2. Add the following variables:

```
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_token
```

### **Step 3: Deploy**
Your app will automatically deploy with the environment variables!

## ✅ **What's Different with Netlify Pro:**

- ✅ **Unlimited environment variables**
- ✅ **Better Next.js support**
- ✅ **No need for Netlify Functions**
- ✅ **Standard Next.js API routes work**
- ✅ **Clean, simple configuration**

## 🔧 **Current Setup:**

Your app now uses:
- **Next.js API routes** (original working setup)
- **Standard Next.js deployment**
- **Clean configuration**
- **Environment variables in Netlify Pro dashboard**

## 🧪 **Testing:**

### **Local Development:**
```bash
npm run dev
```

### **Build Test:**
```bash
npm run build
```

### **Deploy:**
```bash
git add .
git commit -m "Clean setup for Netlify Pro"
git push
```

## 🎉 **Benefits of Netlify Pro:**

1. **Environment Variables** - Unlimited
2. **Build Minutes** - More build time
3. **Bandwidth** - Higher limits
4. **Support** - Priority support
5. **Features** - Advanced features

Your app is now clean and ready for Netlify Pro deployment!

## Alternative Solutions

### Option 1: Use Netlify Pro (Recommended)
- Upgrade to Netlify Pro ($19/month) to get unlimited environment variables
- This is the cleanest solution for production use

### Option 2: Use Vercel (Free Alternative)
- Vercel offers free environment variables on their free plan
- Deploy using: `vercel --prod`

### Option 3: Use Railway (Free Alternative)
- Railway offers free environment variables
- Deploy using: `railway up`

### Option 4: Use Render (Free Alternative)
- Render offers free environment variables
- Deploy using their dashboard

## Current Setup

Your app now uses Netlify Functions instead of Next.js API routes:
- `/api/fetch-rate` → `/.netlify/functions/fetch-rate`
- `/api/submit-transaction` → `/.netlify/functions/submit-transaction`

This allows environment variables to work on Netlify's free plan.

## Testing Locally

To test the Netlify Functions locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local development
netlify dev
```

This will start both your Next.js app and the Netlify Functions locally. 
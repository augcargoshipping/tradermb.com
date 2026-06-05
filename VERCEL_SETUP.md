# Vercel Deployment Setup Guide

## 🚀 **Vercel Setup (Recommended for Next.js)**

Vercel is the best platform for Next.js apps and offers free environment variables!

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Deploy to Vercel**
```bash
# Deploy to Vercel
vercel --prod
```

### **Step 3: Add Environment Variables**
After deployment, add environment variables in Vercel dashboard:

1. Go to your project in [vercel.com](https://vercel.com)
2. Go to Settings → Environment Variables
3. Add these variables:

```
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_token
```

### **Step 4: Redeploy with Environment Variables**
```bash
vercel --prod
```

## ✅ **Why Vercel is Better:**

- ✅ **Free environment variables** (unlimited)
- ✅ **Perfect Next.js support**
- ✅ **Automatic deployments**
- ✅ **Better performance**
- ✅ **Global CDN**
- ✅ **Serverless functions**
- ✅ **No build issues**

## 🔧 **Current Setup:**

Your app now uses:
- **Next.js API routes** (original working setup)
- **Vercel deployment**
- **Clean configuration**
- **Environment variables in Vercel dashboard**

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
vercel --prod
```

## 🎉 **Vercel Benefits:**

1. **Environment Variables** - Free and unlimited
2. **Build Speed** - Very fast builds
3. **Performance** - Global edge network
4. **Next.js Support** - Native support
5. **Deployments** - Automatic from Git
6. **Analytics** - Built-in analytics
7. **Functions** - Serverless API routes

## 📝 **Deployment Commands:**

```bash
# First time setup
vercel

# Production deployment
vercel --prod

# View deployment status
vercel ls

# View logs
vercel logs
```

## 🔍 **Environment Variables Setup:**

### **Via Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Add each variable with production environment
3. Redeploy automatically

### **Via Vercel CLI:**
```bash
vercel env add AIRTABLE_BASE_ID
vercel env add AIRTABLE_PERSONAL_ACCESS_TOKEN
```

Your app is now optimized for Vercel deployment! 
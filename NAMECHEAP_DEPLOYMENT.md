# Namecheap Hosting Deployment Guide

## 🏠 **Namecheap Hosting Setup**

### **Step 1: Purchase Hosting**
1. Go to [namecheap.com](https://namecheap.com)
2. Choose a hosting plan (Stellar or higher recommended)
3. Select your domain or use a subdomain

### **Step 2: Build Your App**
```bash
# Build static files
npm run build:static
```

This will create an `out` folder with static files.

### **Step 3: Upload to Namecheap**
1. **Access cPanel** in your Namecheap hosting
2. **Go to File Manager**
3. **Navigate to public_html** folder
4. **Upload all files** from the `out` folder
5. **Set permissions** to 644 for files, 755 for folders

### **Step 4: Set Up API Backend**
Since Namecheap doesn't support Node.js, you need external APIs:

#### **Option A: Vercel Functions (Free)**
1. Create a new Vercel project for API only
2. Deploy your API routes there
3. Update `NEXT_PUBLIC_API_BASE_URL` to point to your Vercel functions

#### **Option B: Netlify Functions (Free)**
1. Create a Netlify project for API only
2. Deploy your API routes there
3. Update `NEXT_PUBLIC_API_BASE_URL` to point to your Netlify functions

#### **Option C: Railway (Free)**
1. Create a Railway project for API only
2. Deploy your API routes there
3. Update `NEXT_PUBLIC_API_BASE_URL` to point to your Railway API

### **Step 5: Environment Variables**
In your Namecheap hosting, you can't set environment variables, so:
1. Update the API URLs in your code
2. Or use a `.env.local` file (but this is not secure for production)

### **Step 6: Test Your Site**
1. Visit your domain
2. Test all functionality
3. Check that API calls work

## 🔧 **Alternative: Use Railway Instead**

Railway is actually easier and more suitable for Next.js apps:

1. **Go to [railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Connect your repository**
4. **Deploy automatically**
5. **Set environment variables**
6. **Get a live URL**

Railway is free for small apps and handles everything automatically!

## 📝 **Recommendation**

**Use Railway instead of Namecheap** because:
- ✅ **Easier deployment**
- ✅ **Better for Next.js**
- ✅ **Free tier available**
- ✅ **Automatic builds**
- ✅ **Environment variables support**
- ✅ **No manual file uploads**

Would you like me to help you set up Railway instead? 
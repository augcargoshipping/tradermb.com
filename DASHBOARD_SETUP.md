# TRADE RMB Dashboard Setup Guide

## 🎯 Overview

The TRADE RMB Dashboard provides users with a comprehensive interface to manage their RMB transactions, view order history, and update their profile information. The dashboard is built with Next.js, uses Airtable for data storage, and integrates with Cloudinary for image uploads.

## 🚀 Features

### ✅ Implemented Features

1. **User Authentication**
   - Sign up with email/username and password
   - Sign in with email/username and password
   - Secure password hashing with bcrypt
   - Session management with NextAuth.js

2. **Dashboard Overview**
   - User profile display with avatar
   - Quick stats (total orders, total spent, monthly spending, last order)
   - Navigation between different sections

3. **Order Management**
   - View all user orders with status
   - Order details including amounts and dates
   - Filter orders by status

4. **Profile Management**
   - Update personal information (name, email, phone, address)
   - Upload and update profile picture
   - Change password securely

5. **Navigation**
   - Responsive design for mobile and desktop
   - Tabbed interface for easy navigation
   - Breadcrumb navigation

## 📁 File Structure

```
app/
├── dashboard/
│   ├── page.tsx              # Main dashboard page
│   └── profile/
│       └── page.tsx          # Profile edit page
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/
│   │   │   └── route.ts      # NextAuth configuration
│   │   └── register/
│   │       └── route.ts      # User registration
│   └── user/
│       ├── orders/
│       │   └── route.ts      # Fetch user orders
│       ├── update-profile/
│       │   └── route.ts      # Update user profile
│       └── change-password/
│           └── route.ts      # Change user password
└── auth/
    ├── signin/
    │   └── page.tsx          # Sign in page
    └── signup/
        └── page.tsx          # Sign up page
```

## 🔧 Setup Instructions

### 1. Environment Variables

Ensure these environment variables are set in your `.env.local`:

```env
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Airtable Setup

Create these tables in your Airtable base:

#### Users Table
- **Name** (Single line text)
- **Email** (Email)
- **Username** (Single line text)
- **Password** (Long text) - stores bcrypt hashed passwords
- **Phone** (Phone number)
- **Address** (Long text)
- **Profile_Image** (URL)

#### Transactions Table
- **Reference_Code** (Single line text)
- **User_ID** (Single line text) - links to Users table
- **RMB_Amount** (Number)
- **GHS_Amount** (Number)
- **Status** (Single select: Pending, Paid, Completed, Cancelled)
- **Submitted_At** (Date)
- **QR_Code_URL** (URL)

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

## 🧪 Testing

### Test Dashboard API Endpoints

```bash
node scripts/test-dashboard.js
```

This script will test:
- Server connectivity
- User orders endpoint
- Update profile endpoint
- Change password endpoint

### Manual Testing

1. **Visit the homepage**: http://localhost:3000
2. **Click "Sign In"** to access authentication
3. **Create an account** or sign in with existing credentials
4. **Click "Dashboard"** to access the main dashboard
5. **Test all features**:
   - View order history
   - Update profile information
   - Change password
   - Upload profile picture

## 🎨 UI Components

The dashboard uses a modern, responsive design with:

- **Color Scheme**: Blue and purple gradients with white backgrounds
- **Typography**: Inter font family
- **Icons**: Lucide React icons
- **Components**: Custom UI components built with Radix UI
- **Animations**: Framer Motion for smooth transitions

## 🔒 Security Features

1. **Password Security**
   - bcrypt hashing with 12 salt rounds
   - Secure password comparison
   - Password validation (minimum 6 characters)

2. **Authentication**
   - NextAuth.js session management
   - Protected routes
   - Secure token handling

3. **Data Protection**
   - Input validation
   - SQL injection prevention
   - XSS protection

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Ensure all environment variables are set in your production environment:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 🔧 Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check NextAuth configuration
   - Verify environment variables
   - Ensure Airtable API key is valid

2. **Profile image upload fails**
   - Check Cloudinary credentials
   - Verify file size limits
   - Check network connectivity

3. **Orders not loading**
   - Verify User_ID field in Transactions table
   - Check Airtable permissions
   - Ensure proper field names

4. **Password change fails**
   - Verify current password is correct
   - Check bcrypt implementation
   - Ensure proper error handling

### Debug Commands

```bash
# Check environment variables
node scripts/check-env.js

# Test Airtable connection
node scripts/test-airtable.js

# Test Cloudinary upload
node scripts/test-cloudinary.js

# Test dashboard endpoints
node scripts/test-dashboard.js
```

## 📈 Future Enhancements

Potential features to add:
- [ ] Order filtering and search
- [ ] Export order history to PDF/CSV
- [ ] Real-time order status updates
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Admin dashboard for managing users
- [ ] Analytics and reporting
- [ ] Mobile app version

## 🤝 Support

For support or questions:
1. Check the troubleshooting section
2. Review the code comments
3. Test with the provided scripts
4. Contact the development team

---

**Built with ❤️ for TRADE RMB** 
# Nuestras Artesanías

A modern eCommerce web application for selling handcrafted artisan products. Built with React and Vite, featuring a complete customer shopping experience and comprehensive admin dashboard for business management.

## Overview

Nuestras Artesanías is a full-featured eCommerce platform designed specifically for artisan product sellers. It provides customers with an intuitive shopping experience and business owners with powerful tools to manage their inventory, orders, and customers.

## ✨ Features

### Customer Features
- **Product Catalog** - Browse handcrafted items across multiple categories (Anklets, Bracelets, Earrings, Necklaces, Waistchains)
- **Product Details** - View detailed product information with image galleries
- **Shopping Cart** - Add/remove items, manage quantities, persistent cart storage
- **Checkout System** - Multi-step checkout process with order confirmation
- **User Accounts** - Create accounts, login, manage customer profile
- **Order History** - Track orders and view order status
- **Responsive Design** - Fully optimized for desktop, tablet, and mobile devices

### Admin/Owner Features
- **Dashboard** - Central hub for business management
- **Product Management** - Add, edit, delete products with bulk image upload
- **Inventory Management** - Track product availability and stock
- **Order Management** - View, process, and track all customer orders
- **Order Status Tracking** - Update order status and send notifications
- **Customer Management** - View customer information and order history
- **Analytics** - Track sales, revenue, and customer insights
- **Settings** - Configure store information and business details

### Technical Features
- **Real-time Database** - Supabase for instant data synchronization
- **Authentication** - Secure user login and role-based access (customer/admin)
- **Image Management** - Upload, store, and manage product images via Supabase Storage
- **Email Notifications** - Automated order confirmations and status updates via EmailJS
- **Performance Optimized** - React Query for efficient data fetching and caching
- **Smooth Animations** - Framer Motion for polished user interactions

## 🛠 Tech Stack

### Frontend
- **React** 19.2.4 - UI framework
- **Vite** 8.0.4 - Build tool and dev server
- **React Router DOM** 7.14.1 - Client-side routing
- **Framer Motion** 12.38.0 - Animation library

### Backend & Services
- **Supabase** - PostgreSQL database, authentication, and cloud storage
- **EmailJS** 4.4.1 - Email notification service

### State & Data Management
- **React Context API** - Application state management
- **React Query** 5.100.6 - Server state and data fetching
- **Axios** 1.15.2 - HTTP client

### UI & Utilities
- **Lucide React** 1.8.0 - Icon library
- **React Toastify** 11.1.0 - Toast notifications
- **Dotenv** 17.4.2 - Environment variable management

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- EmailJS account

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Nuestras_Artesanias
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env.local` file** in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## 🔐 Environment Variables
VITE_SUPABASE_URL=https://ehqyfcehyoofygcncuwp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_zvzGryS_oO4SJJoiFLXVfg_CzFTXSh3

#email 1 low stack and order
VITE_EMAILJS_PUBLIC_KEY=Za0hm2vI33mN4ziKZ
VITE_EMAILJS_SERVICE_ID=service_w28idsf
VITE_EMAILJS_ORDER_TEMPLATE_ID=template_sxz9upr
VITE_EMAILJS_LOW_STOCK_TEMPLATE_ID=template_vzej8ht
VITE_BUSINESS_EMAIL=adrianaban706@gmail.com

#email 2 processing and ready
VITE_EMAILJS_PUBLIC_KEY_2=vM__BrbfC6GYUBrkM
VITE_EMAILJS_SERVICE_ID_2=service_w6t9pye
VITE_EMAILJS_PROCESSING_TEMPLATE_ID_2=template_06m1dkj
VITE_EMAILJS_READY_TEMPLATE_ID_2=template_uwjf2fi
VITE_BUSINESS_EMAIL_2=benporll13@gmail.com

#email 3 delivery and paid
VITE_EMAILJS_PUBLIC_KEY_3=Dth1R7K09739Apip2
VITE_EMAILJS_SERVICE_ID_3=service_bk6okhg
VITE_EMAILJS_DELIVERY_TEMPLATE_ID_3=template_yxoadp5
VITE_EMAILJS_PAID_TEMPLATE_ID_3=template_ic09lsh
VITE_BUSINESS_EMAIL_3=yeng102207@gmail.com

#email 4 cancel
VITE_EMAILJS_PUBLIC_KEY_4=Dth1R7K09739Apip2
VITE_EMAILJS_SERVICE_ID_4=service_ay7t7me
VITE_EMAILJS_CANCEL_TEMPLATE_ID_4=template_sqk64tp
VITE_BUSINESS_EMAIL_4=work77052@gmail.com

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components (Navbar, Footer, ProductCard, etc.)
├── pages/               # Page components for routes
│   └── products/        # Admin dashboard pages (Products, Orders, Analytics, etc.)
├── contexts/            # React Context for auth and cart state
├── hooks/               # Custom React hooks (useFormValidation, useDebounce)
├── lib/                 # Utility functions
│   ├── supabase.js      # Supabase client setup
│   ├── products.js      # Product data operations
│   ├── orders.js        # Order management
│   ├── cart.js          # Cart utilities
│   ├── emailNotification.js  # Email service
│   └── dashboard.js     # Dashboard utilities
├── utils/               # Helper functions (validation, scrolling, etc.)
├── styles/              # Global and component styles
└── assets/              # Static assets
```

## 🚀 Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint to check code quality
npm run lint
```

## 💻 Usage

### For Customers
1. Browse products by category or search
2. View detailed product information and images
3. Add items to cart and adjust quantities
4. Proceed to checkout
5. Enter shipping and payment information
6. Receive order confirmation email
7. Track order status in customer dashboard

### For Store Owners/Admin
1. Log in with admin credentials to access the dashboard
2. **Products**: Add new products with images, edit existing items, manage categories
3. **Orders**: View incoming orders, update order status, and automatically notify customers
4. **Customers**: View customer profiles and order history
5. **Analytics**: Monitor sales performance and revenue
6. **Settings**: Configure store information and business details

## 🔄 Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- **users** - Customer and admin accounts
- **products** - Product catalog with descriptions, prices, and images
- **product_images** - Product image storage references
- **orders** - Customer orders with status tracking
- **order_items** - Individual items in each order
- **cart_items** - Shopping cart data (temporary)

## 🎨 Responsive Design

The application is fully responsive with optimized layouts for:
- **Desktop** (1024px and above)
- **Tablet** (768px - 1023px)
- **Mobile** (below 768px)

Mobile-specific CSS is maintained in `src/responsive-mobile.css` for maximum performance.

## 📧 Email Notifications

The app sends automated emails for:
- Order confirmation with order details
- Order status updates (Processing, Shipped, Delivered)
- Account welcome email on registration

EmailJS is configured for reliable email delivery without backend server requirements.

## ⚠️ Known Limitations

- Payment processing is currently not integrated (can be added via Stripe, PayPal, etc.)
- Wishlist functionality is not persistent across sessions
- Product reviews/ratings feature not yet implemented
- Bulk order export limited to admin dashboard

## 🔮 Future Enhancements

- **Payment Gateway Integration** - Stripe or PayPal for secure payments
- **Wishlist Feature** - Save favorite products for later purchase
- **Product Reviews** - Customer ratings and reviews
- **Advanced Analytics** - Charts and detailed sales reports
- **Email Templates** - Customizable email designs
- **Multi-language Support** - Internationalization (i18n)
- **Performance Optimization** - Code splitting and lazy loading improvements
- **Shipping Integration** - Real-time shipping cost calculation
- **Inventory Alerts** - Low stock notifications

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is in use, Vite will automatically use the next available port.

### Supabase Connection Issues
- Verify your `.env.local` credentials are correct
- Check if your Supabase project is active
- Ensure your IP is not blocked by Supabase

### Email Not Sending
- Verify EmailJS credentials in `.env.local`
- Check EmailJS template ID matches your actual template
- Review EmailJS console for error messages

## 📝 License

This project is proprietary. All rights reserved.

## 👤 Author

Nuestras Artesanías Team

Adrian Aban
Yuen Lin
Benjamin Portillo 
Jimael Cobb

---

## Live Production Link
https://nuestras-artesanias.vercel.app/

For questions or support, please contact the development team or submit an issue in the repository.

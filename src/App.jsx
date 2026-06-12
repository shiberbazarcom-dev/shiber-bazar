import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

/* ── Public pages ── */
const Home             = lazy(() => import('./pages/Home'))
const ShopsPage        = lazy(() => import('./pages/ShopsPage'))
const ShopDetail       = lazy(() => import('./pages/ShopDetail'))
const CategoriesPage   = lazy(() => import('./pages/CategoriesPage'))
const CategoryPage     = lazy(() => import('./pages/CategoryPage'))
const SearchPage       = lazy(() => import('./pages/SearchPage'))
const ProductDetails   = lazy(() => import('./pages/ProductDetails'))
const CartPage         = lazy(() => import('./pages/CartPage'))
const ContactPage      = lazy(() => import('./pages/ContactPage'))
const PolicyPage       = lazy(() => import('./pages/PolicyPage'))
const Login            = lazy(() => import('./pages/auth/Login'))
const Register         = lazy(() => import('./pages/auth/Register'))
const AuthCallback     = lazy(() => import('./pages/auth/AuthCallback'))

/* Order & tracking (public, no auth) */
const OrderPage        = lazy(() => import('./pages/OrderPage'))
const TrackOrder       = lazy(() => import('./pages/TrackOrder'))

/* ── Services module ── */
const ServicesPage       = lazy(() => import('./pages/services/ServicesPage'))
const ServiceDetail      = lazy(() => import('./pages/services/ServiceDetail'))
const ProviderProfile    = lazy(() => import('./pages/services/ProviderProfile'))
const SubmitService      = lazy(() => import('./pages/services/SubmitService'))
const MyServices         = lazy(() => import('./pages/dashboard/MyServices'))
const ManageServices     = lazy(() => import('./pages/admin/ManageServices'))

/* ── স্থানীয় সেবাসমূহ (Local Services Directory — independent module) ── */
const LocalServices         = lazy(() => import('./pages/localservices/LocalServices'))
const LocalServiceCategory  = lazy(() => import('./pages/localservices/LocalServiceCategory'))
const ServiceDirectoryAdmin = lazy(() => import('./pages/admin/ServiceDirectory'))

/* ── Customer Account ── */
const AccountPage      = lazy(() => import('./pages/account/AccountPage'))

/* ── Shop Owner / User Dashboard ── */
const DashboardOverview = lazy(() => import('./pages/dashboard/Overview'))
const MyShops           = lazy(() => import('./pages/dashboard/MyShops'))
const AddShop           = lazy(() => import('./pages/dashboard/AddShop'))
const Favorites         = lazy(() => import('./pages/dashboard/Favorites'))
const ShopOrders        = lazy(() => import('./pages/dashboard/ShopOrders'))
const Products          = lazy(() => import('./pages/dashboard/Products'))
const Profile           = lazy(() => import('./pages/dashboard/Profile'))
const QRCodePage        = lazy(() => import('./pages/dashboard/QRCode'))

/* ── Super Admin / Market Manager ── */
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'))
const ManageShops      = lazy(() => import('./pages/admin/ManageShops'))
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'))
const ManageUsers      = lazy(() => import('./pages/admin/ManageUsers'))
const ManageOrders     = lazy(() => import('./pages/admin/ManageOrders'))
const ManageProducts   = lazy(() => import('./pages/admin/ManageProducts'))
const ManageAds        = lazy(() => import('./pages/admin/ManageAds'))
const ManageRoles          = lazy(() => import('./pages/admin/ManageRoles'))
const ManageVerifications  = lazy(() => import('./pages/admin/ManageVerifications'))
const ManageShopRequests   = lazy(() => import('./pages/admin/ManageShopRequests'))
const Analytics            = lazy(() => import('./pages/admin/Analytics'))
const Settings             = lazy(() => import('./pages/admin/Settings'))
const ErrorLogs            = lazy(() => import('./pages/admin/ErrorLogs'))

/* Loading fallback */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
      </div>
    </div>
  )
}

/* WhatsApp Floating Button */
function WhatsAppButton() {
  const phone = '8801310012276'
  const message = 'আসসালামু আলাইকুম, আমি শিবের বাজার ওয়েবসাইট থেকে যোগাযোগ করছি।'
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[76px] md:bottom-6 right-4 md:right-6 z-50 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300 group"
      aria-label="WhatsApp"
    >
      {/* Pulse animation ring */}
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
      {/* WhatsApp Icon */}
      <svg
        className="w-7 h-7 text-white relative z-10"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        WhatsApp এ মেসেজ দিন
      </span>
    </a>
  )
}

/* Public layout wrapper */
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f5f5' }}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Spacer so content clears the fixed mobile bottom nav (60px) */}
      <div className="md:hidden h-[60px]" aria-hidden="true" />
      <WhatsAppButton />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ══════════════════════════════════
                PUBLIC ROUTES (no auth required)
            ══════════════════════════════════ */}
            <Route path="/"               element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/shops"          element={<PublicLayout><ShopsPage /></PublicLayout>} />
            <Route path="/shop/:idOrSlug" element={<PublicLayout><ShopDetail /></PublicLayout>} />
            <Route path="/categories"     element={<PublicLayout><CategoriesPage /></PublicLayout>} />
            <Route path="/category/:slug" element={<PublicLayout><CategoryPage /></PublicLayout>} />
            <Route path="/search"         element={<PublicLayout><SearchPage /></PublicLayout>} />
            <Route path="/login"          element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/register"       element={<PublicLayout><Register /></PublicLayout>} />
            <Route path="/auth/callback"  element={<AuthCallback />} />
            <Route path="/order"          element={<PublicLayout><OrderPage /></PublicLayout>} />
            <Route path="/order/:shopId"  element={<PublicLayout><OrderPage /></PublicLayout>} />
            <Route path="/track-order"    element={<PublicLayout><TrackOrder /></PublicLayout>} />
            <Route path="/product/:id"    element={<PublicLayout><ProductDetails /></PublicLayout>} />
            <Route path="/contact"        element={<PublicLayout><ContactPage /></PublicLayout>} />
            <Route path="/policy"         element={<PublicLayout><PolicyPage /></PublicLayout>} />
            <Route path="/cart"           element={<PublicLayout><CartPage /></PublicLayout>} />

            {/* ── স্থানীয় সেবাসমূহ (Local Services Directory) ── */}
            <Route path="/local-services"       element={<PublicLayout><LocalServices /></PublicLayout>} />
            <Route path="/local-services/:slug" element={<PublicLayout><LocalServiceCategory /></PublicLayout>} />

            {/* ── Services (public) ── */}
            {/* IMPORTANT: specific routes MUST come before /:slug to avoid slug catching them */}
            <Route path="/services"                    element={<PublicLayout><ServicesPage /></PublicLayout>} />
            <Route path="/services/detail/:id"         element={<PublicLayout><ServiceDetail /></PublicLayout>} />
            <Route path="/services/provider/:userId"   element={<PublicLayout><ProviderProfile /></PublicLayout>} />
            <Route path="/services/:slug"              element={<PublicLayout><ServicesPage /></PublicLayout>} />
            <Route path="/services/submit"       element={
              <PublicLayout>
                <ProtectedRoute requireAuth>
                  <SubmitService />
                </ProtectedRoute>
              </PublicLayout>
            } />

            {/* ══════════════════════════════════
                CUSTOMER /account  (any auth user)
            ══════════════════════════════════ */}
            <Route path="/account" element={
              <PublicLayout>
                <ProtectedRoute requireAuth>
                  <AccountPage />
                </ProtectedRoute>
              </PublicLayout>
            } />

            {/* ══════════════════════════════════
                SHOP OWNER /dashboard
                Roles: user, shop_owner, market_manager, super_admin
            ══════════════════════════════════ */}
            <Route path="/dashboard" element={
              <ProtectedRoute requireAuth>
                <DashboardLayout type="user" />
              </ProtectedRoute>
            }>
              <Route index            element={<DashboardOverview />} />
              <Route path="shops"     element={<MyShops />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="profile"   element={<Profile />} />

              {/* Shop-owner only */}
              <Route path="add-shop" element={
                <ProtectedRoute requireRole={['shop_owner','market_manager','super_admin']}>
                  <AddShop />
                </ProtectedRoute>
              } />
              <Route path="orders" element={
                <ProtectedRoute requireRole={['shop_owner','market_manager','super_admin']}>
                  <ShopOrders />
                </ProtectedRoute>
              } />
              <Route path="products" element={
                <ProtectedRoute requireRole={['shop_owner','market_manager','super_admin']}>
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="qr-code" element={
                <ProtectedRoute requireRole={['shop_owner','market_manager','super_admin']}>
                  <QRCodePage />
                </ProtectedRoute>
              } />
              {/* Services — any logged-in user */}
              <Route path="my-services" element={<MyServices />} />
            </Route>

            {/* ══════════════════════════════════
                SUPER ADMIN /admin
                Roles: super_admin, market_manager
            ══════════════════════════════════ */}
            <Route path="/admin" element={
              <ProtectedRoute requireAuth requireRole={['super_admin','market_manager']}>
                <DashboardLayout type="admin" />
              </ProtectedRoute>
            }>
              <Route index               element={<AdminDashboard />} />
              <Route path="shops"        element={<ManageShops />} />
              <Route path="categories"   element={<ManageCategories />} />
              <Route path="users"        element={<ManageUsers />} />
              <Route path="orders"       element={<ManageOrders />} />
              <Route path="products"     element={<ManageProducts />} />
              <Route path="ads"          element={<ManageAds />} />
              <Route path="roles"          element={<ManageRoles />} />
              <Route path="verifications"  element={<ManageVerifications />} />
              <Route path="shop-requests" element={<ManageShopRequests />} />
              <Route path="analytics"    element={<Analytics />} />
              <Route path="settings"     element={<Settings />} />
              <Route path="services"     element={<ManageServices />} />
              <Route path="service-directory" element={
                <ProtectedRoute requireRole={['super_admin']}>
                  <ServiceDirectoryAdmin />
                </ProtectedRoute>
              } />
              <Route path="error-logs"   element={<ErrorLogs />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* Global toasts */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background:   '#1e293b',
              color:        '#f1f5f9',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize:     '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SEO from '../components/SEO'

const YEAR = new Date().getFullYear()

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PolicyPage() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (location.hash) {
      setTimeout(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [location])

  return (
    <div className="min-h-screen pb-28 md:pb-10" style={{ background: '#f5f5f5' }}>
      <SEO
        title="গোপনীয়তা ও শর্তাবলী"
        description="শিবের বাজারের গোপনীয়তা নীতি ও ব্যবহারের শর্তাবলী। আমাদের সেবা ব্যবহার করার আগে এই নীতিমালা পড়ুন।"
        url="https://shiber-bazar.vercel.app/policy"
        noindex={true}
      />
      {/* Header */}
      <div className="py-8 px-4" style={{ background: '#2563EB' }}>
        <div className="container-app">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/" className="text-blue-200 hover:text-white text-sm transition-colors">হোম</Link>
            <span className="text-blue-300">›</span>
            <span className="text-white text-sm">নীতিমালা</span>
          </div>
          <h1 className="text-2xl font-bold text-white">গোপনীয়তা ও শর্তাবলী</h1>
          <p className="text-blue-200 text-sm mt-1">সর্বশেষ আপডেট: জুন {YEAR}</p>
        </div>
      </div>

      <div className="container-app py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 max-w-3xl">

          {/* Intro */}
          <div className="bg-blue-50 rounded-xl p-4 mb-8 flex gap-3">
            <span className="text-2xl flex-shrink-0">🛡️</span>
            <p className="text-sm text-blue-800">
              শিবের বাজার ব্যবহার করার আগে দয়া করে এই নীতিমালা পড়ুন।
              এই প্ল্যাটফর্ম ব্যবহার করলে আপনি এই শর্তাবলী মেনে নিয়েছেন বলে ধরা হবে।
            </p>
          </div>

          {/* Privacy Policy */}
          <Section id="privacy" title="১. গোপনীয়তা নীতি">
            <p>
              শিবের বাজার আপনার ব্যক্তিগত তথ্যের সুরক্ষাকে সর্বোচ্চ গুরুত্ব দেয়।
              আমরা শুধুমাত্র সেই তথ্যই সংগ্রহ করি যা সেবা প্রদানের জন্য প্রয়োজন।
            </p>
            <p><strong>আমরা যে তথ্য সংগ্রহ করি:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>নাম ও মোবাইল নম্বর (রেজিস্ট্রেশনের সময়)</li>
              <li>দোকানের নাম, ঠিকানা ও বিবরণ (দোকান মালিকদের জন্য)</li>
              <li>অর্ডার সংক্রান্ত তথ্য</li>
            </ul>
            <p><strong>আমরা যা করি না:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>তৃতীয় পক্ষের কাছে আপনার তথ্য বিক্রি করি না</li>
              <li>আপনার অনুমতি ছাড়া তথ্য শেয়ার করি না</li>
              <li>অপ্রয়োজনীয় তথ্য সংরক্ষণ করি না</li>
            </ul>
          </Section>

          {/* Shop Policy */}
          <Section id="shop" title="২. দোকান নীতিমালা">
            <p>
              শিবের বাজারে দোকান খুলতে হলে নিচের শর্তগুলো মানতে হবে:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>দোকানের তথ্য সঠিক ও আপডেট রাখতে হবে</li>
              <li>পণ্যের মূল্য ও বিবরণ সঠিকভাবে দিতে হবে</li>
              <li>ক্রেতার সাথে সৎ ও সম্মানজনক ব্যবহার করতে হবে</li>
              <li>অবৈধ বা নিষিদ্ধ পণ্য বিক্রি করা যাবে না</li>
              <li>মিথ্যা বা বিভ্রান্তিকর তথ্য দেওয়া যাবে না</li>
            </ul>
            <p>
              নিয়ম লঙ্ঘন করলে কোনো পূর্ব সতর্কতা ছাড়াই দোকান বাতিল করার অধিকার
              কর্তৃপক্ষ সংরক্ষণ করে।
            </p>
          </Section>

          {/* Order Policy */}
          <Section id="orders" title="৩. অর্ডার নীতিমালা">
            <p>
              শিবের বাজার মূলত একটি দোকান ডিরেক্টরি ও অর্ডার ম্যানেজমেন্ট প্ল্যাটফর্ম।
              অর্ডার সংক্রান্ত বিষয়ে:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>অর্ডার নিশ্চিত হওয়ার পর দোকান মালিক যোগাযোগ করবেন</li>
              <li>পণ্যের মান ও ডেলিভারির দায়িত্ব সংশ্লিষ্ট দোকান মালিকের</li>
              <li>অর্ডার বাতিল করতে দোকানে সরাসরি যোগাযোগ করুন</li>
              <li>কোনো সমস্যায় আমাদের হেল্পলাইনে যোগাযোগ করুন</li>
            </ul>
          </Section>

          {/* Terms */}
          <Section id="terms" title="৪. ব্যবহারের শর্তাবলী">
            <p>এই প্ল্যাটফর্ম ব্যবহার করতে হলে:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে</li>
              <li>একটি মোবাইল নম্বর দিয়ে একটিই একাউন্ট খোলা যাবে</li>
              <li>অন্যের তথ্য বা পরিচয় ব্যবহার করা যাবে না</li>
              <li>স্প্যাম, হ্যাকিং বা যেকোনো অবৈধ কার্যকলাপ নিষিদ্ধ</li>
            </ul>
          </Section>

          {/* Disclaimer */}
          <Section id="disclaimer" title="৫. দায়মুক্তি বিবৃতি">
            <p>
              শিবের বাজার একটি মধ্যস্থতাকারী প্ল্যাটফর্ম। দোকান ও ক্রেতার মধ্যে
              যেকোনো লেনদেন বা বিরোধের জন্য শিবের বাজার কর্তৃপক্ষ সরাসরি দায়ী নয়।
              তবে যেকোনো অভিযোগ সমাধানে আমরা সর্বদা সহযোগিতা করতে প্রস্তুত।
            </p>
          </Section>

          {/* Contact */}
          <Section id="contact" title="৬. আমাদের সাথে যোগাযোগ">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="flex items-center gap-2">
                <span>📍</span>
                <span>শিবের বাজার, সিলেট সদর, সিলেট</span>
              </p>
              <p className="flex items-center gap-2">
                <span>📞</span>
                <a href="tel:+8801310012276" className="text-blue-600 hover:underline font-medium">
                  ০১৩১০-০১২২৭৬
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span>💬</span>
                <a href="https://wa.me/8801310012276" target="_blank" rel="noopener noreferrer"
                   className="text-green-600 hover:underline font-medium">
                  WhatsApp: 01310012276
                </a>
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              © {YEAR} শিবের বাজার। সর্বস্বত্ব সংরক্ষিত।
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}

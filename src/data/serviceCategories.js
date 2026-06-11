/**
 * Local fallback list of service categories.
 * Mirrors the seed data in add_services_module.sql.
 * Used for category cards on homepage without a DB round-trip.
 */
export const SERVICE_CATEGORIES = [
  { slug: 'cng',          icon: '🚕', name_bn: 'সিএনজি / অটোরিকশা'  },
  { slug: 'salon',        icon: '✂️', name_bn: 'সেলুন ও নাপিত'       },
  { slug: 'tutor',        icon: '📚', name_bn: 'প্রাইভেট শিক্ষক'     },
  { slug: 'doctor',       icon: '👨‍⚕️', name_bn: 'ডাক্তার ও চেম্বার'  },
  { slug: 'electrician',  icon: '⚡', name_bn: 'ইলেকট্রিশিয়ান'       },
  { slug: 'plumber',      icon: '🚿', name_bn: 'প্লাম্বার'            },
  { slug: 'pickup',       icon: '🚛', name_bn: 'পিকআপ ভ্যান'         },
  { slug: 'blood-donor',  icon: '🩸', name_bn: 'রক্তদাতা'            },
  { slug: 'rental',       icon: '🏠', name_bn: 'বাসা / দোকান ভাড়া'  },
  { slug: 'emergency',    icon: '📞', name_bn: 'জরুরি নম্বর'          },
]

/**
 * Extra fields shown per category in the submission form.
 * Each entry is an array of { key, label, type, options? }
 */
export const CATEGORY_EXTRA_FIELDS = {
  tutor: [
    { key: 'subjects',    label: 'বিষয়সমূহ',         type: 'text',   placeholder: 'গণিত, বিজ্ঞান, ইংরেজি' },
    { key: 'classes',     label: 'শ্রেণি',             type: 'text',   placeholder: '৬ষ্ঠ থেকে ১০ম' },
    { key: 'education',   label: 'নিজের শিক্ষাগত যোগ্যতা', type: 'text', placeholder: 'BSc, MSc ...' },
  ],
  doctor: [
    { key: 'speciality',    label: 'বিশেষজ্ঞতা',      type: 'text',   placeholder: 'মেডিসিন, শিশু রোগ ...' },
    { key: 'chamber_time',  label: 'চেম্বারের সময়',   type: 'text',   placeholder: 'সকাল ৯টা — বিকাল ৩টা' },
  ],
  cng: [
    { key: 'vehicle_type',  label: 'গাড়ির ধরন',       type: 'text',   placeholder: 'সিএনজি / অটোরিকশা' },
    { key: 'routes',        label: 'রুট',               type: 'text',   placeholder: 'শিবের বাজার — আম্বরখানা' },
  ],
  pickup: [
    { key: 'vehicle_type',  label: 'গাড়ির ধরন',       type: 'text',   placeholder: 'পিকআপ / কাভার্ড ভ্যান' },
    { key: 'routes',        label: 'রুট / এলাকা',      type: 'text',   placeholder: 'পুরো সিলেট' },
  ],
  'blood-donor': [
    {
      key: 'blood_group', label: 'রক্তের গ্রুপ', type: 'select',
      options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
  ],
  rental: [
    { key: 'rent_amount', label: 'ভাড়ার পরিমাণ (মাসিক)', type: 'text', placeholder: '৳ ৫,০০০' },
  ],
}

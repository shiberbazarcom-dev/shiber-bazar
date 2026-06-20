import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/* ── All site settings as { key: value } map ── */
export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
      if (error) throw error
      return (data || []).reduce((acc, row) => {
        acc[row.key] = row.value
        return acc
      }, {})
    },
    staleTime: 1000 * 60 * 5, // cache 5 minutes
  })
}

/* ── Convenience: read one CMS value with a hardcoded fallback ── */
export function useCMSValue(key, fallback = '') {
  const { data: settings = {} } = useSiteSettings()
  const val = settings[key]
  return (val !== undefined && val !== null && val !== '') ? val : fallback
}

/* ── Convenience: just the admin WhatsApp number ── */
export function useAdminWhatsapp() {
  const { data: settings = {} } = useSiteSettings()
  return settings['whatsapp_number'] || ''
}

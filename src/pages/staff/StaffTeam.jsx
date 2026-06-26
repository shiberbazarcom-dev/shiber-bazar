import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { Badge } from '../../components/ui/badge'
import { Navigate } from 'react-router-dom'

export default function StaffTeam() {
  const { staffSession } = useStaffAuth()

  // Only manager can see this page
  if (staffSession?.role !== 'manager') return <Navigate to="/staff/orders" replace />

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['staff-team', staffSession?.shop_id],
    queryFn: async () => {
      if (!staffSession?.shop_id) return []
      const { data, error } = await supabase
        .from('shop_staff')
        .select('id, name, phone, role, is_active, last_login_at')
        .eq('shop_id', staffSession.shop_id)
        .eq('is_active', true)
        .order('created_at')
      if (error) throw error
      return data || []
    },
    enabled: !!staffSession?.shop_id,
  })

  if (isLoading) return <div className="text-center py-16 text-gray-400">লোড হচ্ছে...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">টিম তালিকা</h1>

      {team.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">কোনো সদস্য নেই</div>
      )}

      <div className="space-y-3">
        {team.map(member => (
          <div key={member.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{member.name}</span>
                {member.id === staffSession.staff_id && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">আপনি</span>
                )}
              </div>
              {member.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {member.phone}</p>}
              <p className="text-xs text-gray-400 mt-0.5">
                {member.last_login_at
                  ? `সর্বশেষ active: ${new Date(member.last_login_at).toLocaleDateString('bn-BD')}`
                  : 'এখনো login করেননি'}
              </p>
            </div>
            <Badge variant={member.role === 'manager' ? 'default' : 'secondary'} className="text-xs shrink-0">
              {member.role === 'manager' ? 'ম্যানেজার' : 'স্টাফ'}
            </Badge>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">Staff যোগ বা সরাতে দোকানের মালিকের সাথে যোগাযোগ করুন</p>
    </div>
  )
}

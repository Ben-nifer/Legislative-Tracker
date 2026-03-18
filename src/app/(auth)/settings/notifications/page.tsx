import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DigestToggle from './DigestToggle'
import { Bell } from 'lucide-react'

export const metadata = {
  title: 'Notification Settings | NYC Legislative Tracker',
}

export default async function NotificationSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/settings/notifications')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, email_digests_enabled')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

        <div className="mb-8 flex items-center gap-3">
          <Bell className="text-indigo-400" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Notification Settings</h1>
            <p className="text-sm text-slate-400">Manage how you hear about legislation updates</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 divide-y divide-slate-700/60">

          {/* Daily digest row */}
          <div className="flex items-start justify-between gap-6 p-5">
            <div>
              <p className="font-medium text-slate-100">Daily email digest</p>
              <p className="mt-1 text-sm text-slate-400">
                Get a daily summary of activity on legislation you follow.
                Sent every morning at 9 AM — only when there&apos;s something new.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Delivered to: {user.email}
              </p>
            </div>
            <DigestToggle initialEnabled={profile?.email_digests_enabled ?? false} />
          </div>

        </div>

      </div>
    </main>
  )
}

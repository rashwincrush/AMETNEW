import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SUPABASE_URL, SUPABASE_ANON_KEY, WHATSAPP_PHONE_NUMBER, WHATSAPP_API_KEY } from './config.ts'
import type { Event, EventAttendee, UserProfile } from './types.ts'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const response = await fetch('https://api.callmebot.com/whatsapp.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      phone: phoneNumber,
      text: message,
      apikey: WHATSAPP_API_KEY,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`CallMeBot API Error: ${errorText}`)
  }
}

export async function handler() {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('start_date', tomorrowStr)

    if (eventsError) throw eventsError

    for (const event of events as Event[]) {
      const { data: rsvps, error: rsvpsError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', event.id)

      if (rsvpsError) throw rsvpsError

      for (const rsvp of rsvps as EventAttendee[]) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', rsvp.user_id)
          .single()

        if (profileError) throw profileError

        const userProfile = profile as UserProfile
        if (userProfile.phone_number) {
          const message = `Hi ${userProfile.full_name}, this is a reminder that the event "${event.name}" is happening tomorrow!`
          await sendWhatsAppMessage(userProfile.phone_number, message)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

export interface Event {
  id: number
  name: string
  event_date: string
}

export interface EventAttendee {
  id: number
  event_id: number
  user_id: string
}

export interface UserProfile {
  id: string
  full_name: string
  phone_number: string
}

-- Schema fixes for AMET Alumni Portal
-- This script adds missing columns and renames columns to match the application code

-- Add created_at to event_feedback if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_feedback'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE event_feedback ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
END
$$;

-- Copy submitted_at to created_at if created_at exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_feedback'
        AND column_name = 'created_at'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_feedback'
        AND column_name = 'submitted_at'
    ) THEN
        UPDATE event_feedback
        SET created_at = submitted_at
        WHERE created_at IS NULL;
    END IF;
END
$$;

-- Rename status to attendance_status in event_attendees if status exists but attendance_status doesn't
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_attendees'
        AND column_name = 'status'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_attendees'
        AND column_name = 'attendance_status'
    ) THEN
        ALTER TABLE event_attendees RENAME COLUMN status TO attendance_status;
    END IF;
END
$$;

-- Add registration_date to event_attendees if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_attendees'
        AND column_name = 'registration_date'
    ) THEN
        ALTER TABLE event_attendees ADD COLUMN registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
END
$$;

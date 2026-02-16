-- EMERGENCY FIX FOR ERROR 401
-- This Disables Row Level Security (RLS) completely for the 'proposals' table.
-- WARNING: This makes the table public and writable by ANYONE with your Anon Key.
-- Use this ONLY for development to unblock yourself.

ALTER TABLE public.proposals DISABLE ROW LEVEL SECURITY;

// JavaScript Document

// SAAGRAM HOLIDAYS - SUPABASE CONNECTION

const SUPABASE_URL =
    "https://pgsgxcpcadzrtpztyits.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_0KjoXy9evMYsK043pXatjw_weYiA0c5";

const { createClient } = window.supabase;

const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Saagram Supabase Connected!");
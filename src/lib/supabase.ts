import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebkrxpcguufnydbildri.supabase.co';
const supabaseAnonKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia3J4cGNndXVmbnlkYmlsZHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDA1NTksImV4cCI6MjA5MTIxNjU1OX0.wUuRlLto3mqj2uHJQcR044AHo1GFgDLfvwBiw6cOmPQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

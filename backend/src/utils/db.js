const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;

function getClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

async function init() {
  const client = getClient();
  const { error } = await client.from("users").select("id").limit(1);
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
  console.log("Supabase connected successfully");
}

function getDb() {
  return getClient();
}

module.exports = { init, getDb, getClient };

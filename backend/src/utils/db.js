const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required. " +
      "Create a free project at https://supabase.com and set them in your .env file."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

let _ready = false;

async function init() {
  _ready = true;
  console.log("Supabase client initialized:", supabaseUrl);
}

let _initPromise = null;

async function ensureInit() {
  if (_ready) return;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    _ready = true;
  })();
  return _initPromise;
}

function getDb() {
  return new DbWrapper();
}

async function getDbAsync() {
  await ensureInit();
  return new DbWrapper();
}

class DbWrapper {
  from(tableName) {
    return new QueryBuilder(tableName);
  }
}

class QueryBuilder {
  constructor(tableName) {
    this._table = tableName;
    this._cols = "*";
    this._countMode = null;
    this._headMode = false;
    this._filters = [];
    this._orderCol = null;
    this._orderAsc = true;
    this._limitVal = null;
    this._offsetVal = null;
    this._singleMode = "none";
    this._op = "select";
    this._data = null;
  }

  select(cols, opts) {
    this._cols = cols || "*";
    if (opts && opts.count === "exact") this._countMode = "exact";
    if (opts && opts.head) this._headMode = true;
    return this;
  }

  eq(col, val) { this._filters.push({ col, val, op: "eq" }); return this; }
  neq(col, val) { this._filters.push({ col, val, op: "neq" }); return this; }
  gt(col, val) { this._filters.push({ col, val, op: "gt" }); return this; }
  gte(col, val) { this._filters.push({ col, val, op: "gte" }); return this; }
  lt(col, val) { this._filters.push({ col, val, op: "lt" }); return this; }
  lte(col, val) { this._filters.push({ col, val, op: "lte" }); return this; }
  in(col, vals) { this._filters.push({ col, val: vals, op: "in" }); return this; }
  is(col, val) { this._filters.push({ col, val, op: "is" }); return this; }

  order(col, opts) {
    this._orderCol = col;
    this._orderAsc = !opts || opts.ascending !== false;
    return this;
  }

  range(start, end) {
    this._offsetVal = start;
    this._limitVal = end - start + 1;
    return this;
  }

  limit(n) {
    this._limitVal = n;
    return this;
  }

  single() { this._singleMode = "single"; return this._exec(); }
  maybeSingle() { this._singleMode = "maybeSingle"; return this._exec(); }

  insert(obj) { this._op = "insert"; this._data = obj; return this; }
  update(obj) { this._op = "update"; this._data = obj; return this; }
  delete() { this._op = "delete"; return this; }

  then(resolve, reject) {
    return Promise.resolve(this._exec()).then(resolve, reject);
  }

  _applyFilters(q) {
    for (const f of this._filters) {
      switch (f.op) {
        case "eq": q = q.eq(f.col, f.val); break;
        case "neq": q = q.neq(f.col, f.val); break;
        case "gt": q = q.gt(f.col, f.val); break;
        case "gte": q = q.gte(f.col, f.val); break;
        case "lt": q = q.lt(f.col, f.val); break;
        case "lte": q = q.lte(f.col, f.val); break;
        case "in": q = q.in(f.col, f.val); break;
        case "is": q = q.is(f.col, f.val); break;
      }
    }
    return q;
  }

  async _exec() {
    try {
      switch (this._op) {
        case "select": return await this._execSelect();
        case "insert": return await this._execInsert();
        case "update": return await this._execUpdate();
        case "delete": return await this._execDelete();
        default: return { data: null, error: { message: "Unknown operation" } };
      }
    } catch (e) {
      const msg = (e && e.message) || String(e) || "Unknown error";
      console.error("QueryBuilder error:", msg, e && e.stack ? e.stack : "");
      return { data: null, error: { message: msg, details: msg, hint: "", code: "SUPABASE_ERROR" } };
    }
  }

  async _execSelect() {
    const selectOpts = {};
    if (this._countMode) selectOpts.count = this._countMode;
    if (this._headMode) selectOpts.head = this._headMode;

    let q = supabase.from(this._table).select(this._cols, selectOpts);
    q = this._applyFilters(q);
    if (this._orderCol) q = q.order(this._orderCol, { ascending: this._orderAsc });
    if (this._offsetVal !== null) {
      const end = this._offsetVal + this._limitVal - 1;
      q = q.range(this._offsetVal, end);
    } else if (this._limitVal !== null) {
      q = q.limit(this._limitVal);
    }

    if (this._singleMode === "single") return await q.single();
    if (this._singleMode === "maybeSingle") return await q.maybeSingle();
    return await q;
  }

  async _execInsert() {
    if (!this._data || typeof this._data !== "object") {
      return { data: null, error: { message: "No data to insert" } };
    }
    let q = supabase.from(this._table).insert(this._data).select();
    if (this._singleMode === "single") return await q.single();
    if (this._singleMode === "maybeSingle") return await q.maybeSingle();
    const result = await q;
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      return { data: result.data[0], error: result.error };
    }
    return { data: null, error: result.error };
  }

  async _execUpdate() {
    if (!this._data || typeof this._data !== "object") {
      return { data: null, error: { message: "No data to update" } };
    }
    let q = supabase.from(this._table).update(this._data);
    q = this._applyFilters(q);
    q = q.select();
    if (this._singleMode === "single") return await q.single();
    if (this._singleMode === "maybeSingle") return await q.maybeSingle();
    const result = await q;
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      return { data: result.data[0], error: result.error };
    }
    return { data: this._data, error: result.error };
  }

  async _execDelete() {
    let q = supabase.from(this._table).delete();
    q = this._applyFilters(q);
    const result = await q;
    return { data: [], error: result.error };
  }
}

module.exports = { init, getDb, getDbAsync, ensureInit };

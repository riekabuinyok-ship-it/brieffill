const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let SQL;
let db;
let saveTimer = null;

const DB_PATH = process.env.DB_PATH || (
  process.env.VERCEL
    ? '/tmp/brieffill.db'
    : path.join(__dirname, '..', '..', 'database', 'brieffill.db')
);
const SEED_PATH = path.join(__dirname, '..', '..', 'database', 'brieffill.db');

async function init() {
  SQL = await initSqlJs();
  _loadDb();
  console.log('SQLite database loaded:', DB_PATH);
}

function _loadDb() {
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else if (fs.existsSync(SEED_PATH)) {
    const buffer = fs.readFileSync(SEED_PATH);
    db = new SQL.Database(buffer);
    _saveDb();
  } else {
    db = new SQL.Database();
    _saveDb();
  }
}

function _saveDb() {
  const data = db.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function _scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { _saveDb(); } catch (e) { console.error('db save error:', e); }
    saveTimer = null;
  }, 300);
}

let initPromise = null;

async function ensureInit() {
  if (db) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    SQL = await initSqlJs();
    _loadDb();
  })();
  return initPromise;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call init() or await ensureInit() first.');
  }
  return new DbWrapper();
}

async function getDbAsync() {
  await ensureInit();
  return new DbWrapper();
}

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function qid(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

class DbWrapper {
  from(tableName) {
    return new QueryBuilder(tableName);
  }
}

class QueryBuilder {
  constructor(tableName) {
    this._table = tableName;
    this._cols = '*';
    this._countMode = null;
    this._filters = [];
    this._orderCol = null;
    this._orderAsc = true;
    this._limitVal = null;
    this._offsetVal = null;
    this._singleMode = 'none';
    this._op = 'select';
    this._data = null;
  }

  select(cols, opts) {
    this._cols = cols || '*';
    if (opts && opts.count === 'exact') this._countMode = 'exact';
    return this;
  }

  eq(col, val) { this._filters.push({ col, val, op: '=' }); return this; }
  neq(col, val) { this._filters.push({ col, val, op: '!=' }); return this; }
  gt(col, val) { this._filters.push({ col, val, op: '>' }); return this; }
  gte(col, val) { this._filters.push({ col, val, op: '>=' }); return this; }
  lt(col, val) { this._filters.push({ col, val, op: '<' }); return this; }
  lte(col, val) { this._filters.push({ col, val, op: '<=' }); return this; }
  in(col, vals) { this._filters.push({ col, vals, op: 'IN' }); return this; }
  is(col, val) { this._filters.push({ col, val, op: 'IS' }); return this; }

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

  single() { this._singleMode = 'single'; return this._exec(); }
  maybeSingle() { this._singleMode = 'maybeSingle'; return this._exec(); }

  insert(obj) { this._op = 'insert'; this._data = obj; return this; }
  update(obj) { this._op = 'update'; this._data = obj; return this; }
  delete() { this._op = 'delete'; return this; }

  then(resolve, reject) {
    return Promise.resolve(this._exec()).then(resolve, reject);
  }

  _buildWhere() {
    if (this._filters.length === 0) return '';
    const parts = this._filters.map((f) => {
      const col = qid(f.col);
      switch (f.op) {
        case '=':
          return col + ' = ' + esc(f.val);
        case '!=':
          return col + ' != ' + esc(f.val);
        case '>':
          return col + ' > ' + esc(f.val);
        case '>=':
          return col + ' >= ' + esc(f.val);
        case '<':
          return col + ' < ' + esc(f.val);
        case '<=':
          return col + ' <= ' + esc(f.val);
        case 'IS':
          return col + ' IS ' + (f.val === null ? 'NULL' : esc(f.val));
        case 'IN': {
          if (!Array.isArray(f.vals) || f.vals.length === 0) return '1=0';
          return col + ' IN (' + f.vals.map(v => esc(v)).join(', ') + ')';
        }
        default:
          return col + ' = ' + esc(f.val);
      }
    });
    return parts.join(' AND ');
  }

  _buildOrder() {
    if (!this._orderCol) return '';
    return ' ORDER BY ' + qid(this._orderCol) + ' ' + (this._orderAsc ? 'ASC' : 'DESC');
  }

  _buildLimit() {
    if (this._limitVal === null && this._offsetVal === null) return '';
    if (this._offsetVal !== null) {
      return ' LIMIT ' + this._limitVal + ' OFFSET ' + this._offsetVal;
    }
    return ' LIMIT ' + this._limitVal;
  }

  _exec() {
    try {
      switch (this._op) {
        case 'select': return this._execSelect();
        case 'insert': return this._execInsert();
        case 'update': return this._execUpdate();
        case 'delete': return this._execDelete();
        default: return { data: null, error: { message: 'Unknown operation' } };
      }
    } catch (e) {
      const msg = (e && e.message) || String(e) || 'Unknown error';
      console.error('QueryBuilder error:', msg, e && e.stack ? e.stack : '');
      return { data: null, error: { message: msg, details: msg, hint: '', code: 'SQLITE_ERROR' } };
    }
  }

  _parseResults(execResult) {
    if (!execResult || execResult.length === 0) return [];
    const r = execResult[0];
    if (!r.values || r.values.length === 0) return [];
    return r.values.map(row => {
      const obj = {};
      r.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  _execSelect() {
    if (this._countMode === 'exact') {
      let sql = 'SELECT COUNT(*) AS count FROM ' + qid(this._table);
      const where = this._buildWhere();
      if (where) sql += ' WHERE ' + where;
      const result = db.exec(sql);
      const rows = this._parseResults(result);
      const count = rows.length > 0 ? (rows[0].count || 0) : 0;
      return { count, data: [], error: null };
    }

    let sql = 'SELECT ' + this._cols + ' FROM ' + qid(this._table);
    const where = this._buildWhere();
    if (where) sql += ' WHERE ' + where;
    sql += this._buildOrder();
    sql += this._buildLimit();

    const result = db.exec(sql);
    const rows = this._parseResults(result);

    if (this._singleMode === 'single') {
      if (rows.length === 0) {
        return { data: null, error: { message: 'Row not found', details: '', hint: '', code: 'PGRST116' } };
      }
      return { data: rows[0], error: null };
    }
    if (this._singleMode === 'maybeSingle') {
      return { data: rows.length > 0 ? rows[0] : null, error: null };
    }

    return { data: rows, error: null };
  }

  _execInsert() {
    if (!this._data || typeof this._data !== 'object') {
      return { data: null, error: { message: 'No data to insert' } };
    }
    const cols = Object.keys(this._data);
    const vals = cols.map(c => {
      const v = this._data[c];
      return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
    });
    const placeholders = cols.map(() => '?').join(', ');
    const sql = 'INSERT INTO ' + qid(this._table) + ' (' + cols.map(qid).join(', ') + ') VALUES (' + placeholders + ')';

    try {
      db.run(sql, vals);
      _scheduleSave();

      const lastId = db.exec('SELECT last_insert_rowid() AS id');
      const id = lastId && lastId[0] && lastId[0].values ? lastId[0].values[0][0] : null;

      const result = { ...this._data, id };
      return { data: result, error: null };
    } catch (e) {
      if (e.message && e.message.includes('UNIQUE constraint failed')) {
        return { data: null, error: { message: 'Duplicate entry', details: e.message, hint: '', code: '23505' } };
      }
      throw e;
    }
  }

  _execUpdate() {
    if (!this._data || typeof this._data !== 'object') {
      return { data: null, error: { message: 'No data to update' } };
    }
    const cols = Object.keys(this._data);
    const setClause = cols.map(c => qid(c) + ' = ?').join(', ');
    const vals = cols.map(c => {
      const v = this._data[c];
      return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
    });

    let sql = 'UPDATE ' + qid(this._table) + ' SET ' + setClause;
    const where = this._buildWhere();
    if (where) {
      sql += ' WHERE ' + where;
      // Since buildWhere uses esc() inline, we can't use ? placeholders for WHERE
      // Build the entire SQL with inline values
      let fullSql = 'UPDATE ' + qid(this._table) + ' SET ';
      const setParts = cols.map(c => qid(c) + ' = ?');
      fullSql += setParts.join(', ');
      if (where) fullSql += ' WHERE ' + this._buildWhereRaw();
      db.run(fullSql, vals);
    } else {
      db.run(sql, vals);
    }
    _scheduleSave();
    return { data: this._data, error: null };
  }

  _buildWhereRaw() {
    if (this._filters.length === 0) return '';
    const parts = this._filters.map((f) => {
      const col = qid(f.col);
      switch (f.op) {
        case '=': return col + ' = ' + esc(f.val);
        case '!=': return col + ' != ' + esc(f.val);
        case 'IS': return col + ' IS ' + (f.val === null ? 'NULL' : esc(f.val));
        case 'IN': {
          if (!Array.isArray(f.vals) || f.vals.length === 0) return '1=0';
          return col + ' IN (' + f.vals.map(v => esc(v)).join(', ') + ')';
        }
        default: return col + ' = ' + esc(f.val);
      }
    });
    return parts.join(' AND ');
  }

  _execDelete() {
    let sql = 'DELETE FROM ' + qid(this._table);
    const where = this._buildWhereRaw();
    if (where) sql += ' WHERE ' + where;
    db.run(sql);
    _scheduleSave();
    return { data: [], error: null };
  }
}

module.exports = { init, getDb };

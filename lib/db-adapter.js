/**
 * CongraphDB Database Adapter
 *
 * Provides a unified interface for CongraphDB operations with
 * support for switching between Raw Cypher and JavaScript API.
 *
 * Usage:
 *   const adapter = createDbAdapter(db, 'cypher');  // or 'javascript'
 *   await adapter.createNode('Movie', { title: 'The Matrix' });
 */

'use strict';

const { Database, CongraphDBAPI } = require('congraphdb');

/**
 * Raw Cypher Query Implementation
 * Uses direct Connection.query() with Cypher strings
 */
class CypherAdapter {
  constructor(db) {
    this._db = db;
    this._conn = null;
  }

  async init() {
    if (!this._conn) {
      this._conn = this._db.createConnection();
    }
  }

  async close() {
    this._conn = null;
  }

  escapeCypher(str) {
    return str.replace(/'/g, "\\'");
  }

  async createNode(label, properties) {
    const props = Object.entries(properties)
      .map(([k, v]) => {
        if (typeof v === 'string') {
          return `${k}: '${this.escapeCypher(v)}'`;
        } else if (typeof v === 'number') {
          return `${k}: ${v}`;
        } else if (Array.isArray(v)) {
          return `${k}: [${v.map(item => `'${this.escapeCypher(String(item))}'`).join(', ')}]`;
        }
        return `${k}: ${v}`;
      })
      .join(', ');

    const query = `CREATE (n:${label} {${props}}) RETURN n`;
    const result = await this._conn.query(query);
    const rows = await result.getAll();
    return rows[0]?.n || null;
  }

  async getNodesByLabel(label) {
    const result = await this._conn.query(`MATCH (n:${label}) RETURN n`);
    const rows = await result.getAll();
    return rows.map(row => row.n);
  }

  async getNodeByProperty(label, prop, value) {
    const escapedValue = typeof value === 'string' ? `'${this.escapeCypher(value)}'` : value;
    const result = await this._conn.query(`MATCH (n:${label} {${prop}: ${escapedValue}}) RETURN n`);
    const rows = await result.getAll();
    return rows[0]?.n || null;
  }

  async updateNodeByProperty(label, prop, value, updates) {
    const escapedValue = typeof value === 'string' ? `'${this.escapeCypher(value)}'` : value;
    const sets = Object.entries(updates)
      .map(([k, v]) => {
        if (typeof v === 'string') {
          return `n.${k} = '${this.escapeCypher(v)}'`;
        } else if (typeof v === 'number') {
          return `n.${k} = ${v}`;
        }
        return `n.${k} = ${v}`;
      })
      .join(', ');

    const query = `MATCH (n:${label} {${prop}: ${escapedValue}}) SET ${sets} RETURN n`;
    const result = await this._conn.query(query);
    const rows = await result.getAll();
    return rows[0]?.n || null;
  }

  async getOutgoingEdges(nodeLabel, nodeProp, nodeValue) {
    const escapedValue = typeof nodeValue === 'string' ? `'${this.escapeCypher(nodeValue)}'` : nodeValue;
    const result = await this._conn.query(`
      MATCH (n:${nodeLabel} {${nodeProp}: ${escapedValue}})-[r]->(m)
      RETURN r, m
    `);
    const rows = await result.getAll();
    return rows
      .filter(row => row.m !== undefined && row.m !== null)
      .map(row => ({
        ...row.r,
        to: row.m._id || row.m.id,
        toNode: row.m
      }));
  }

  async query(cypher) {
    return await this._conn.query(cypher);
  }

  async queryAll(cypher) {
    const result = await this._conn.query(cypher);
    return await result.getAll();
  }
}

/**
 * JavaScript API Implementation
 * Uses CongraphDBAPI for node/edge operations
 */
class JavaScriptAPIAdapter {
  constructor(db) {
    this._db = db;
    this._api = null;
  }

  async init() {
    if (!this._api) {
      this._api = new CongraphDBAPI(this._db);
    }
  }

  async close() {
    if (this._api) {
      await this._api.close();
      this._api = null;
    }
  }

  escapeCypher(str) {
    return str.replace(/'/g, "\\'");
  }

  async createNode(label, properties) {
    return await this._api.createNode(label, properties);
  }

  async getNodesByLabel(label) {
    return await this._api.getNodesByLabel(label);
  }

  async getNodeByProperty(label, prop, value) {
    const nodes = await this._api.getNodesByLabel(label);
    return nodes.find(n => n[prop] === value) || null;
  }

  async updateNodeByProperty(label, prop, value, updates) {
    const node = await this.getNodeByProperty(label, prop, value);
    if (node && node._id) {
      return await this._api.updateNode(node._id, updates);
    }
    return null;
  }

  async getOutgoingEdges(nodeLabel, nodeProp, nodeValue) {
    const node = await this.getNodeByProperty(nodeLabel, nodeProp, nodeValue);
    if (node && node._id) {
      return await this._api.getOutgoing(node._id);
    }
    return [];
  }

  async query(cypher) {
    return await this._api.query(cypher);
  }

  async queryAll(cypher) {
    const result = await this._api.query(cypher);
    return await result.getAll();
  }
}

/**
 * Factory function to create the appropriate adapter
 *
 * @param {Database} db - CongraphDB Database instance
 * @param {string} mode - 'cypher' or 'javascript'
 * @returns {CypherAdapter|JavaScriptAPIAdapter}
 */
function createDbAdapter(db, mode = 'cypher') {
  const normalizedMode = mode.toLowerCase();

  if (normalizedMode === 'cypher' || normalizedMode === 'raw') {
    return new CypherAdapter(db);
  } else if (normalizedMode === 'javascript' || normalizedMode === 'js' || normalizedMode === 'api') {
    return new JavaScriptAPIAdapter(db);
  } else {
    throw new Error(`Unknown adapter mode: ${mode}. Use 'cypher' or 'javascript'.`);
  }
}

module.exports = {
  createDbAdapter,
  CypherAdapter,
  JavaScriptAPIAdapter
};

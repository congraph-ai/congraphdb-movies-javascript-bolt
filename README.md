# CongraphDB Movies JavaScript Sample

A demo application using CongraphDB - an embedded, high-performance graph database for Node.js. This is a port of the Neo4j Movies JavaScript Bolt sample, adapted to use CongraphDB instead of Neo4j.

## Overview

This application demonstrates how easy it is to get started with CongraphDB in JavaScript. It provides:
- Movie search with listing
- Movie detail view with cast information
- Interactive graph visualization using D3.js
- Vote functionality for movies
- **Switchable between Raw Cypher and JavaScript API**

## Key Differences from Neo4j Version

| Feature | Neo4j Version | CongraphDB Version |
|---------|---------------|-------------------|
| Database | Remote server | Embedded local file |
| Connection | Bolt driver (TCP/IP) | Native module |
| Deployment | Requires Neo4j server | Single binary + data file |
| Query Language | Cypher | Cypher (compatible) |
| Storage | Separate database files | Single `.cgraph` file |

## Prerequisites

- **Node.js** 20 or later
- **npm** or **yarn**

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build CongraphDB Native Module (if not already built)

```bash
cd ../../congraphdb
npm run build
cd ../sample-graphdb/congraphdb-movies-javascript-bolt
```

### 3. Seed Sample Data

```bash
npm run seed
```

This populates the database with sample movies, people, and their relationships.

### 4. Build Frontend Assets

```bash
npm run build
```

### 5. Run the Application

```bash
# Start with Raw Cypher API (default, recommended for v0.1.6)
npm start

# Or explicitly:
npm run start:cypher

# Start with JavaScript API (for testing when v0.1.7+ fixes node ID issue)
npm run start:js
```

The application will be available at `http://localhost:3500`

## API Modes

This application supports two CongraphDB query interfaces:

### 1. Raw Cypher Mode (Default)

Uses direct Cypher queries via `Connection.query()`. **Recommended for v0.1.6** due to JavaScript API node ID handling issues.

```bash
npm start
# or explicitly:
npm run start:cypher
```

### 2. JavaScript API Mode

Uses `CongraphDBAPI` for node/edge operations. Available for testing when the node ID issue is fixed in v0.1.7+.

```bash
npm run start:js
```

### Environment Variable

You can also set the mode via environment variable:

```bash
# Linux/Mac
CONGRAPHDB_API_MODE=cypher npm start
CONGRAPHDB_API_MODE=javascript npm start

# Windows (PowerShell)
$env:CONGRAPHDB_API_MODE="cypher"; npm start
$env:CONGRAPHDB_API_MODE="javascript"; npm start

# Windows (CMD)
set CONGRAPHDB_API_MODE=cypher && npm start
set CONGRAPHDB_API_MODE=javascript && npm start
```

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run seed` | Seed database with sample data |
| `npm start` | Start server (default: Cypher mode) |
| `npm run start:cypher` | Start server using Raw Cypher queries |
| `npm run start:js` | Start server using JavaScript API |
| `npm run build` | Build frontend assets |
| `npm run clean` | Clean build artifacts |
| `npm run dev` | Build and start server |
| `npm run dev:cypher` | Build and start with Cypher mode |
| `npm run dev:js` | Build and start with JavaScript API |

## Project Structure

```
congraphdb-movies-javascript-bolt/
├── lib/
│   └── db-adapter.js       # Database adapter (Cypher/JavaScript API)
├── src/
│   ├── app.js              # Main application UI logic
│   ├── congraphdbApi.js    # Frontend API wrapper
│   ├── assets/
│   │   ├── index.html      # HTML template
│   │   └── images/         # Image assets
│   └── models/
│       ├── Movie.js        # Movie model
│       └── MovieCast.js    # MovieCast model
├── scripts/
│   ├── init-schema.js      # Database schema initialization (legacy)
│   └── seed-database.js    # Sample data seeding
├── movies.cgraph           # Persistent database file
├── server.js               # Express server with adapter
├── package.json
├── webpack.config.js
└── README.md
```

## Database Schema

### Node Tables

- **Movie**: `title`, `tagline`, `released`, `votes`
- **Person**: `name`, `born`

### Relationship Tables

- **ACTED_IN**: Person → Movie (with `roles` property)

## Architecture: Database Adapter Pattern

The application uses a database adapter pattern to support multiple query interfaces:

```
lib/db-adapter.js
├── CypherAdapter           # Raw Cypher queries via Connection.query()
└── JavaScriptAPIAdapter    # CongraphDBAPI wrapper
```

This allows:
- Easy switching between modes via environment variable
- Testing when JavaScript API is fixed in future versions
- Unified interface for database operations

## Configuration

Configuration is done via environment variables:

```bash
# API Mode: 'cypher' or 'javascript' (default: cypher)
CONGRAPHDB_API_MODE=cypher

# Database path (default: ./movies.cgraph)
# Note: currently hardcoded in server.js
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/movies/search?title=` | GET | Search movies by title |
| `/api/movies/:title` | GET | Get movie details with cast |
| `/api/movies/:title/vote` | POST | Vote for a movie |
| `/api/graph` | GET | Get graph data for D3.js visualization |

## Cypher Queries

CongraphDB supports Cypher query language. Here are the queries used:

### Search Movies
```cypher
MATCH (m:Movie)
WHERE m.title CONTAINS $title
RETURN m
```

### Get Movie with Cast
```cypher
MATCH (m:Movie {title: $title})
RETURN m
```

Cast is fetched separately:
```cypher
MATCH (p:Person)-[r:ACTED_IN]->(m:Movie {title: $title})
RETURN p.name, r.roles
```

### Vote for Movie
```cypher
MATCH (m:Movie {title: $title})
SET m.votes = m.votes + 1
```

### Get Graph for Visualization
```cypher
MATCH (p:Person)-[r:ACTED_IN]->(m:Movie)
RETURN p.name, m.title
```

## Stack

- **Database**: CongraphDB (embedded graph database)
- **Backend**: Node.js, Express
- **Frontend**: jQuery, Bootstrap, D3.js
- **Build**: Webpack 5

## License

Apache-2.0

## Acknowledgments

This is a port of the [Neo4j Movies JavaScript Bolt](https://github.com/neo4j-examples/movies-javascript-bolt) sample application, adapted to use CongraphDB.

## Related Resources

- [CongraphDB Documentation](https://congraph-ai.github.io/congraphdb-docs/)
- [CongraphDB GitHub](https://github.com/congraph-ai/congraphdb)
- [Cypher Query Language](https://neo4j.com/developer/cypher/)
- [Migration Plan](../../.notes/congraph-ai/congraphdb-movies-javascript-bolt/plan_03.md)

# CongraphDB Movies JavaScript Sample

A demo application using CongraphDB - an embedded, high-performance graph database for Node.js. This is a port of the Neo4j Movies JavaScript Bolt sample, adapted to use CongraphDB instead of Neo4j.

## Overview

This application demonstrates how easy it is to get started with CongraphDB in JavaScript. It provides:
- Movie search with listing
- Movie detail view with cast information
- Interactive graph visualization using D3.js
- Vote functionality for movies

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

### 2. Initialize the Database Schema

```bash
node scripts/init-schema.js
```

This creates the database file at `./movies.cgraph` with the required node and relationship tables.

### 3. Seed Sample Data

```bash
node scripts/seed-data.js
```

This populates the database with sample movies, people, and their relationships.

### 4. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:8080`

## Development

### Build for Production

```bash
npm run build
```

This creates a production build in the `build/` directory.

### Clean Build Artifacts

```bash
npm run clean
```

## Project Structure

```
congraphdb-movies-javascript-bolt/
├── src/
│   ├── app.js              # Main application UI logic
│   ├── congraphdbApi.js    # CongraphDB API wrapper
│   ├── assets/
│   │   ├── index.html      # HTML template
│   │   └── images/         # Image assets
│   └── models/
│       ├── Movie.js        # Movie model
│       └── MovieCast.js    # MovieCast model
├── scripts/
│   ├── init-schema.js      # Database schema initialization
│   └── seed-data.js        # Sample data seeding
├── package.json
├── webpack.config.js
└── README.md
```

## Database Schema

### Node Tables

- **Movie**: `title` (PK), `tagline`, `released`, `votes`
- **Person**: `name` (PK), `born`

### Relationship Tables

- **ACTED_IN**: Person → Movie (with `roles` property)
- **DIRECTED**: Person → Movie
- **PRODUCED**: Person → Movie
- **WROTE**: Person → Movie

## Configuration

Configuration is done via environment variables:

```bash
# Database path (default: ./movies.cgraph)
CONGRAPHDB_PATH=./movies.cgraph

# Web server port (default: 8080)
PORT=8080
```

## API Functions

The application exposes the following API functions in `src/congraphdbApi.js`:

- `searchMovies(title)` - Search movies by title substring
- `getMovie(title)` - Get movie with cast details
- `voteInMovie(title)` - Increment vote count for a movie
- `getGraph()` - Get graph data for D3 visualization

## Cypher Queries

CongraphDB supports Cypher query language. Here are the queries used:

### Search Movies
```cypher
MATCH (movie:Movie)
WHERE toLower(movie.title) CONTAINS toLower($title)
RETURN movie
```

### Get Movie with Cast
```cypher
MATCH (movie:Movie {title: $title})
OPTIONAL MATCH (movie)<-[r]-(person:Person)
RETURN movie.title, collect([person.name, head(split(toLower(type(r)), '_')), r.roles])
```

### Vote for Movie
```cypher
MATCH (m:Movie {title: $title})
SET m.votes = coalesce(m.votes, 0) + 1
```

### Get Graph for Visualization
```cypher
MATCH (m:Movie)<-[:ACTED_IN]-(a:Person)
RETURN m.title AS movie, collect(a.name) AS cast
LIMIT 100
```

## Stack

- **Database**: CongraphDB (embedded graph database)
- **Backend**: Node.js
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

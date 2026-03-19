const API_BASE = '/api';

async function searchMovies(title) {
  const response = await fetch(`${API_BASE}/movies/search?title=${encodeURIComponent(title)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function getMovie(title) {
  const response = await fetch(`${API_BASE}/movies/${encodeURIComponent(title)}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function voteInMovie(title) {
  const response = await fetch(`${API_BASE}/movies/${encodeURIComponent(title)}/vote`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function getGraph() {
  const response = await fetch(`${API_BASE}/graph`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

exports.searchMovies = searchMovies;
exports.getMovie = getMovie;
exports.getGraph = getGraph;
exports.voteInMovie = voteInMovie;

const _ = require('lodash');

function Movie(nodeOrProperties) {
  // Handle Neo4j Node format (for backward compatibility)
  if (nodeOrProperties && nodeOrProperties.properties) {
    _.extend(this, nodeOrProperties.properties);
  } else {
    // Handle CongraphDB plain object format
    _.extend(this, nodeOrProperties);
  }

  // CongraphDB returns numbers directly, no need for .toNumber()
  // But keep backward compatibility with Neo4j format
  if (this.id && typeof this.id.toNumber === 'function') {
    this.id = this.id.toNumber();
  }
  if (this.duration && typeof this.duration.toNumber === 'function') {
    this.duration = this.duration.toNumber();
  }
  if (this.votes && typeof this.votes.toNumber === 'function') {
    this.votes = this.votes.toNumber();
  }

  // Ensure votes defaults to 0
  if (!this.votes) {
    this.votes = 0;
  }
}

module.exports = Movie;

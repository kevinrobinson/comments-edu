const pathToRegexp = require('path-to-regexp');
const {OAuth2Client} = require('google-auth-library');
const {Pool} = require('pg');

// For querying the database
function createPool() {
  const connectionString = (process.env.NODE_ENV === 'development')
    ? process.env.DATABASE_URL
    : process.env.DATABASE_URL +'?ssl=true';

  return new Pool({connectionString});
}

function readClientId() {
  return process.env.GOOGLE_CLIENT_ID;
}

function readTokenHeader(req) {
  return req.header('X-Comments-Edu-Token');
}

// determine threadId by project, assuming all projects
// are public.  this just checks referer, so it's
// convenience and not a full authorization check
function readThreadId(req) {
  const referrer = req.header('Referer');
  const match = pathToRegexp('https://codeprojects.org/:id/').exec(referrer);
  if (!match) return '[default-thread]';
  return match[1];
}

function readAllowedDomains() {
  return (process.env.ALLOWED_GOOGLE_DOMAINS || '').split(',');
}

function postComment(pool, req, res) {  
  const {commentText, byText} = req.body;
  const idToken = readTokenHeader(req);
  const threadId = readThreadId(req);
  if (!idToken || !threadId || !commentText || !byText) {
    console.log('Aborting postComment, missing data...');
    return res.status(422).end();
  }

  verifyOrThrow(idToken)
    .then(() => insertComment(pool, {threadId, commentText, byText}))
    .then(() => res.json({success: true}))
    .catch(error => {
      console.error(error);
      res.status(500);
    });
}

async function verifyOrThrow(idToken) {
  const clientId = readClientId();
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: clientId
  });
  const payload = ticket.getPayload();
  const userId = payload['sub'];
  const domain = payload['hd'];

  const isSafelistedDomain = (readAllowedDomains().indexOf(domain) !== -1);
  if (!isSafelistedDomain) throw new Error('not authorized; domain not in safelist');

  return;
}


function flagComment(pool, req, res) {
  const {commentId, html, location} = req.body;
  const idToken = readTokenHeader(req);
  const threadId = readThreadId(req);
  if (!threadId || !idToken || !commentId || !html || !location) {
    console.log('Aborting flagComment, missing data...');
    return res.status(422).end();
  }

  console.log('flagComment recorded');
  verifyOrThrow(idToken)
    .then(() => insertFlag(pool, {threadId, commentId, html, location}))
    .then(() => res.json({success: true}))
    .catch(error => {
      console.error(error);
      res.status(500);
    });
}


// TODO(kr) guard threadId
// TODO(kr) database constraints
function insertComment(pool, {threadId, commentText, byText}) {
  const sql = `INSERT INTO comments(thread_id, comment_text, by_text, timestampz) VALUES ($1, $2, $3, $4)`;
  const now = new Date();
  const values = [threadId, commentText, byText, now];
  return pool.query(sql, values)
    .then(response => {
      console.log('added a comment!');
      return {success: true};
    })
    .catch(error => {
      console.log('insertComment error', threadId, error);
      return null;
    });
}

function insertFlag(pool, {threadId, commentId, html, location}) {
  const sql = `INSERT INTO flags(thread_id, comment_id, location, html, timestampz) VALUES ($1, $2, $3, $4, $5)`;
  const now = new Date();
  const values = [threadId, commentId, location, html, now];
  return pool.query(sql, values)
    .then(response => {
      console.log('added a flag!');
      return {success: true};
    })
    .catch(error => {
      console.log('insertFlag error', threadId, error);
      return null;
    });
}


function fetchComments(pool, req, res) {
  const threadId = readThreadId(req);
  const idToken = readTokenHeader(req);
  const includeFlagged = req.query.flagged || false;

  verifyOrThrow(idToken)
    .then(() => queryComments(pool, threadId, {includeFlagged}))
    .then(rows => res.json({comments: rows}))
    .catch(error => {
      console.error('fetchComments', threadId, error);
      res.status(500);
    });
}



function queryComments(pool, threadId, options = {}) {
  const limit = options.limit || 100;
  const includeFlagged = options.includeFlagged || false;
  const query = (includeFlagged)
    ? queryCommentsIncludingFlagged(pool, threadId, limit)
    : queryCommentsDefault(pool, threadId, limit);

  return query.then(response => response.rows)
    .catch(error => {
      console.log('queryComments', threadId, error);
      return null;
    });
}

// exclude flagged comments
function queryCommentsDefault(pool, threadId, limit) {
  const sql = `
    SELECT * FROM comments
    WHERE thread_id = $1
      AND id NOT IN (SELECT comment_id FROM flags)
    ORDER BY timestampz ASC LIMIT $2
  `;
  const values = [threadId, limit];
  return pool.query(sql, values)
}

function queryForIncludingFlagged(pool, threadId, limit) {
  const sql = 'SELECT * FROM comments WHERE thread_id = $1 ORDER BY timestampz ASC LIMIT $2';
  const values = [threadId, limit];
  return pool.query(sql, values)
}

module.exports = {
  postComment,
  flagComment,
  fetchComments, 
  createPool
};
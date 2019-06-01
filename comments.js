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

function readThreadId(req) {
  return 'k7';
}

function readAllowedDomains() {
  return (process.env.ALLOWED_GOOGLE_DOMAINS || '').split(',');
}

function postComment(pool, req, res) {  
  const {commentText, byText} = req.body;
  const idToken = readTokenHeader(req);
  const threadId = readThreadId(req);
  if (!threadId || !commentText || !byText) {
    console.log('Invalid post, missing data');
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
  const {commentId} = req.body;
  
  // TODO(kr)
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


function fetchComments(pool, req, res) {
  const threadId = readThreadId(req);
  const idToken = readTokenHeader(req);

  verifyOrThrow(idToken)
    .then(() => queryComments(pool, threadId))
    .then(rows => res.json({comments: rows}))
    .catch(error => {
      console.error('fetchComments', threadId, error);
      res.status(500);
    });
}



function queryComments(pool, threadId, options = {}) {
  const limit = options.limit || 100;
  const sql = 'SELECT * FROM comments WHERE thread_id = $1 ORDER BY timestampz ASC LIMIT $2';
  const values = [threadId, limit];
  return pool.query(sql, values)
    .then(response => response.rows)
    .catch(error => {
      console.log('queryComments', threadId, error);
      return null;
    });
}

module.exports = {
  postComment,
  flagComment,
  fetchComments, 
  createPool
};
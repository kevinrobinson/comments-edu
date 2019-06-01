const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const {
  postComment,
  flagComment,
  fetchComments,
  createPool
} = require('./comments.js');


/* --- server setup ---------------------------------- */

// create server
const app = express();
app.use(bodyParser.json());

// only allow https
function enforceHTTPS(request, response, next) {
  if (process.env.NODE_ENV === 'development') return next();

  if (request.headers['x-forwarded-proto'] !== 'https') {
    const httpsUrl = ['https://', request.headers.host, request.url].join('');
    return response.redirect(httpsUrl);
  }

  return next();
}
app.use(enforceHTTPS);


// create IP-based rate limiter for all endpoints
app.use(rateLimit({
  windowMs: 10*60*1000, // 10 minutes
  max: 100, // limit each IP to n requests per windowMs
  delayMs: 0, // disable delaying - full speed until the max limit is reached
  onLimitReached: (req, res, options) => {
    console.log('rateLimit reached!');
  }
}));


// Allow CORS
const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN;
app.use(cors({origin: CORS_ALLOW_ORIGIN}));

// database connection pool
const pool = createPool();

/* --- endpoints ---------------------------------- */
app.post('/comments/:thread_id/share', postComment.bind(null, pool));
app.get('/comments/:thread_id', fetchComments.bind(null, pool));
// app.post('/comments/:thread_id/flag', flagComment.bind(null, pool));
/* ----------------------------------------------- */

// start server
const PORT = process.env.PORT || 5000;
app.get('/hello', (req, res) => res.json({hello: 'world'}));
app.use(express.static('public'))
app.get('*', (req, res) => res.status(404).json({status: '404'}));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

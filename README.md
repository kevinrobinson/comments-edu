# comments

## Start locallly

```
NODE_ENV=development \
ALLOWED_GOOGLE_DOMAINS=foo.whatever.edu \
CORS_ALLOW_ORIGIN=bar.app.com \
GOOGLE_CLIENT_ID=xyz \
yarn start
```

## Provision database

Make a Postgres database, with tables:
```
# CREATE DATABASE "comments-edu-dev";
# \c "comments-edu-dev";
# CREATE TABLE comments (
  id serial primary key,
  thread_id text,
  comment_text text,
  by_text text,
  timestampz timestamptz
);
```

## Build UI library
```
cd ui-library && yarn install && yarn build \
  REACT_GOOGLE_CLIENT_ID=xyz
  REACT_COMMENTS_EDU_DOMAIN=https://example.com
cp build/static/js/main.*.js ../public/library.js
```
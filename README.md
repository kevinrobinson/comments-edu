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
Note that the config here is different for dev and production.
```
cd ui-library && yarn install && \
  REACT_APP_GOOGLE_CLIENT_ID=xyz \
  REACT_APP_COMMENTS_EDU_DOMAIN=https://example.com \
  yarn build
cp build/static/js/main.*.js ../public/library.js
```

## Use UI library
See `public/dev.html`, and note that config is different for dev and production.

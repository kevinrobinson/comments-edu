# comments-edu-library

This is the UI library for the front-end.

```
yarn build \
  REACT_GOOGLE_CLIENT_ID=xyz
  REACT_COMMENTS_EDU_DOMAIN=https://example.com
```

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


### example
https://repl.it/@kevinrobinson/ExtraneousTanSeptagon


--------------


This is intended for a plain HTML/CSS/JS development environment (eg, Code Studio or repl.it).

Example: https://studio.code.org/projects/weblab/nKK-osLmdkNk9Hxpp15Bk4FXaxjq4LY_L2vKpcDxT3c/edit

For backend service, see `signed-in-comments` project.

### docs
https://developers.google.com/identity/sign-in/web/backend-auth

## security and privacy
- never show local id publically
- never show real name publicly
- no contents send over email
- no user identifiers stored durable
- no logging of content or identifiers
- no gsuite authorization, each user authorizes to teach about oauth
- (scope grants access to any code studio app, need some minimal verification of full path)

## ux
### developer UX
- one magic script tag
- enable students to style, if they want
- allow automated moderation (eg, keywords list)
- allow JS moderation function (eg, trained tfjs model)

### commenter UX
- plan for chromebooks, where they are already signed in with google
- only allow login for whitelisted school domain
- allows kid to pick their own name, with warning text
- anyone clicks "flag" and teacher gets emailed, not student
- warning on potentially inappropriate comment text in-browser
- deep link to revoke google app authorization

### moderator UX
- automated client-side moderation (eg, keywords)
- emails on any "flag"
- can delete any post


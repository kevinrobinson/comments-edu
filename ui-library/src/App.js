import React, {useState, useEffect} from 'react';


export default function App(props) {
  const googleClientId = process.env.REACT_GOOGLE_CLIENT_ID;
  
  return (
    <div className="CommentsEdu">
      <div className="CommentsEdu-title">Comments</div>
      <GoogleSignIn clientId={googleClientId}>
        {({idToken, profile}) => (
          <CommentAs idToken={idToken} profile={profile} />
        )}
      </GoogleSignIn>
      <ExistingComments />
    </div>
  );
}


// Where is the server?
function readCommentsEduDomain() {
  return process.env.REACT_COMMENTS_EDU_DOMAIN;
}

function GoogleSignIn({children, clientId}) {
  const [googleUser, setGoogleUser] = useState(null);
  const profile = (googleUser ? googleUser.getBasicProfile() : null);
  const idToken = (googleUser ? googleUser.getAuthResponse().id_token : null);

  useEffect(() => {
    window.gapi.load('auth2', () => {
      gapi.auth2.init({client_id: clientId}).then(auth2 => {
        const user = auth2.currentUser.get();
        setGoogleUser(user);
      });
    });
  }, [idToken, googleUser]);

  return children({idToken, profile});
};



function flagComment(commentId) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const domain = readCommentsEduDomain();
  const url = `${domain}/comments/1/flag`;
  const body = JSON.stringify({commentId});
  return fetch(url, {headers, body, method: 'POST'})
    .then(response => response.json());
}
function Comment({id, comment}) {
  const [isFlagged, setFlagged] = useState(false);

  useEffect(() => {
    if (!isFlagged) return;
    flagComment(id);
  }, [isFlagged]);

  if (isFlagged) return null; // hide it
  return (
    <div className="CommentsEduComment">
      <div className="CommentsEduComment-comment-text">{comment.comment_text}</div>
      <div>
        <div className="CommentsEduComment-by-text">by {comment.by_text}</div>
        <div
          className="CommentsEduComment-flag"
          onClick={e => setFlagged(true)}
        >flag</div>
      </div>
    </div>
  );
}
  
function postComment(toPost) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const domain = readCommentsEduDomain();
  const url = `${domain}/comments/1/share`;
  const body = JSON.stringify(toPost);
  return fetch(url, {headers, body, method: 'POST'})
    .then(response => response.json());
}

function CommentAs({idToken, profile}) {
  const [commentText, setCommentText] = useState('');
  const [byText, setByText] = useState('');
  const [toPost, setToPost] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postDone, setPostDone] = useState(null);
  const [postError, setPostError] = useState(null);
  
  useEffect(() => {
    if (toPost === null || isPosting || postDone || postError) return;
    setIsPosting(true);
    postComment(toPost)
      .then(json => {
        setPostDone(json);
        setIsPosting(false);
      })
      .catch(error => {
        setPostError(error);
        setIsPosting(false);
      });
  }, [toPost, isPosting, postDone, postError]);
  
  return (
    <div className="CommentsEdu-CommentAs">
      <div className="CommentsEdu-add-comment">
        <input
          className="CommentsEdu-comment-input-text"
          type="text"
          placeholder="What do you think?"
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
        />
        <input
          className="CommentsEdu-comment-by-text"
          placeholder="Your nickname"
          type="text"
          value={byText}
          onChange={e => setByText(e.target.value)}
        />
        <button
          className="CommentsEdu-comment-share-button"
          onClick={e => setToPost({byText, commentText, idToken})}
        >Share</button>
      </div>
      <div>
        {profile
          ? <div>You are signed in, but posting will use whatever nickname you choose.</div>
          : <div>You need to sign in with a district Google account to comment.</div>
        }
      </div>
    </div>
  );
}



function ExistingComments() {
  const [isFetching, setIsFetching] = useState(false);
  const [commentsJson, setCommentsJson] = useState(null);
  const [commentsError, setCommentsError] = useState(null);

  useEffect(() => {
    if (commentsJson || commentsError || isFetching) return;
    
    const domain = readCommentsEduDomain();
    const url = `${domain}/comments/1`;
    const headers = {
      'Accept': 'application/json'
    };
    setIsFetching(true);
    
    fetch(url, {headers})
      .then(response => response.json())
      .then(setCommentsJson)
      .then(() => setIsFetching(false))
      .catch(setCommentsError)
      .catch(() => setIsFetching(false));
  }, [isFetching, commentsJson, commentsError]);

  return (
    <div className="CommentsEdu-comments">
      {(commentsJson === null)
        ? <div>Loading comments...</div>
        : commentsJson.comments.map(comment => <Comment key={comment.id} comment={comment} />)
      }
    </div>
  );
}


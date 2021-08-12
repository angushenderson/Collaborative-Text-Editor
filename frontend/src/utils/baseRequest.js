import jwt from 'jwt-decode';

export default function baseRequest(user, setUser, requestCallback) {
  // Helper function that handles JWT refreshing
  // user and setUser parameters are from userContext
  // request parameter is the function to run when access token if valid
  const exp = jwt.jwt_decode(user.Authorization.refresh).exp;
  if (exp < new Date().getTime()/1000) {
    // Token has expired, request a new access token
    fetch('/api/auth/token/refresh', {
      'method': 'POST',
      'body': {
        'refresh': user.refresh,
      }
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
    }).then((data) => {
      setUser({...user, Authorization: {
        refresh: user.refresh,
        access: data.access,
      }});
      requestCallback();
    }).catch((error) => {
      console.log(error);
    });
  } else {
    // Token is still valid
    requestCallback();
  }
}
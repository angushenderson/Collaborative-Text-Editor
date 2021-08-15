import jwt_decode from 'jwt-decode';

export default function baseRequest(user, setUser, history, requestCallback) {
  // Helper function that handles JWT refreshing
  // user and setUser parameters are from userContext
  // request parameter is the function to run when access token if valid
  // history parameter from react-router-dom useHistory hook

  const access_exp = jwt_decode(user.Authorization.refresh).exp;
  const refresh_exp = jwt_decode(user.Authorization.access).exp;

  if (refresh_exp < new Date().getTime()/1000) {
    // Refresh token has expired, need to get user to log back in again
    history.push('/login');
  } else if (access_exp < new Date().getTime()/1000) {
    // Access token has expired, request a new access token
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
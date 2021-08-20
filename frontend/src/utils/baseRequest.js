import jwt_decode from 'jwt-decode';
import { logout } from './auth';

export default function baseRequest(user, setUser, history, requestCallback) {
  // Helper function that handles JWT refreshing
  // user and setUser parameters are from userContext
  // request parameter is the function to run when access token if valid. Function
  //   should take accessToken parameter, this will be passed to it when called for making requests
  // history parameter from react-router-dom useHistory hook

  const access_exp = jwt_decode(user.Authorization.access).exp;
  const refresh_exp = jwt_decode(user.Authorization.refresh).exp;

  const current_time = new Date().getTime();

  // if (refresh_exp < new Date().getTime()/1000) {
  if (current_time >= refresh_exp * 1000) {
    // Refresh token has expired, need to get user to log back in again
    // Clear tokens then redirect
    logout(setUser);
    // TODO after login return to running this function
    history.push('/login');
  // } else if (access_exp < new Date().getTime()/1000) {
  } else if (current_time >= access_exp * 1000) {
    // Access token has expired, request a new access token
    fetch('/api/auth/token/refresh/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: user.Authorization.refresh,
      }),
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
    }).then((data) => {
      setUser({...user, Authorization: {
        refresh: user.Authorization.refresh,
        access: data.access,
      }});
      requestCallback(data.access);
    }).catch((error) => {
      console.log(error);
    });
  } else {
    // Token is still valid
    requestCallback(user.Authorization.access);
  }
}
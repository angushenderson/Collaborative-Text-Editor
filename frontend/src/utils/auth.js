import jwt_decode from 'jwt-decode';

export function isUserAuthenticated(user) {
  // Helper function to check if user is authenticated
  // Function takes user object from userContext
  return user.hasOwnProperty('Authorization');
}

export function extractProfileFromJWT(user, setUser, accessToken, refreshToken, additionalArgs={}) {
  // Extract data from JWT and insert into user object
  // Additional args is an object of extra data to append to user object (user object values will overwrite keys in this object if duplicated exist)
  const token = jwt_decode(accessToken);
  setUser({
    ...additionalArgs,
    ...user,
    Authorization: {
      'access': accessToken,
      'refresh': refreshToken,
    },
    'username': token.username,
    'profile_picture': token.profile_picture,
  });
}

export function logout(setUser) {
  // Log user out by removing refresh and access token pair and setting user to empty object
  localStorage.removeItem('refresh');
  localStorage.removeItem('access');
  setUser({});
}
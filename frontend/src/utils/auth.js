export function isUserAuthenticated(user) {
  // Helper function to check if user is authenticated
  // Function takes user object from userContext
  return user.hasOwnProperty('Authorization');
}
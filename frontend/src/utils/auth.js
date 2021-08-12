import { userContext } from '../userContext';

export function isUserAuthenticated(user) {
  // Helper function to check if user is authenticated
  // Function takes user object from userContext
  console.log(user);
  return user.hasOwnProperty('Authorization');
}
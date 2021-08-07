export default function login(username, password, loginCallback) {
  /* Function to login a user. `loginCallback` is a callback function
  to confirm log in or report errors */
  console.log(username, password);
  fetch('api/token/', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // 'withCredentials': true,
    },
    body: JSON.stringify({'username': username, 'password': password})
  }).then(response => {
    console.log(response);
  })
}
import { useState } from 'react';
import { Route, Switch, Redirect, useHistory } from 'react-router-dom';
import { extractProfileFromJWT, isUserAuthenticated } from './utils/auth';
import { userContext } from './userContext';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import baseRequest from './utils/baseRequest';
import SignUpRootPage from './pages/auth/SignUpRootPage';

function App() {
  // User is initially an empty dictionary
  const [user, setUser] = useState({});
  let history = useHistory();

  if (!isUserAuthenticated(user)) {
    // Fetch access and refresh tokens from local storage
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    if (refresh !== null && access !== null) {
      // Token's exist - extract user data from them
      extractProfileFromJWT(user, setUser, access, refresh);
    }
  }

  // Obsolete function, keeping as an example of using baseRequest and token auth for future requests
  // useEffect(() => {
  //   // Fetch user account info
  //   if (isUserAuthenticated(user)) {
  //     baseRequest(user, setUser, history, (accessToken) => {
  //       fetch('/api/auth/my-account/', {
  //         'method': 'GET',
  //         'headers': {
  //           'Authorization': `Bearer ${accessToken}`,
  //         }
  //       }).then((response) => {
  //         return response.json();
  //       }).then((data) => {
  //         setUser({...user, username: data.username, profile_picture: data.profile_picture});
  //         setAppInitComplete(true);
  //       });
  //     })
  //   } else {
  //     setAppInitComplete(true);
  //   }
  // });

  return (
    // Context is { user, setUser }, use this syntax for unpacking
    <userContext.Provider value={{
      user,
      setUser,
    }}>
      <Switch>
        {/* Editor */}
        <Route path='/editor' render={(props) => {
          if (isUserAuthenticated(user)) {
            return <EditorPage />;
          } else {
            return <Redirect to='/login' />;
          }
        }} />

        {/* Auth */}
        <Route path='/login' render={(props) => {
          if (!isUserAuthenticated(user)) {
            return <LoginPage />
          } else {
            return <Redirect to='/' />;
          }
        }} />
        <Route path='/signup' render={(props) => {
          if (!isUserAuthenticated(user) || user.hasOwnProperty('signup_phase')) {
            return <SignUpRootPage signupPhase={!user.hasOwnProperty('signup_phase') ? 0 : user.signup_phase} />;
          } else {
            return <Redirect to='/' />;
          }
        }} />

        {/* Index */}
        <Route path='' component={HomePage} exact />
      </Switch>
    </userContext.Provider>
  );
}

export default App;

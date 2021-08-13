import { useState } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import SignUpRootPage from './pages/auth/SignUpRootPage';
import { isUserAuthenticated } from './utils/auth';
import { userContext } from './userContext';
import LoginPage from './pages/auth/LoginPage';

function App() {
  // User is initially an empty dictionary
  const [user, setUser] = useState({});

  if (!isUserAuthenticated(user)) {
    // Fetch access and refresh tokens from local storage
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    if (refresh !== null && access !== null) {
      user['Authorization'] = {
        'access': access,
        'refresh': refresh,
      };
    }
  }

  return (
    // Context is { user, setUser }, use this syntax for unpacking
    <userContext.Provider value={{
      user,
      setUser,
    }}>
      <BrowserRouter>
        <Switch>
          <Route path='/login' render={(props) => {
            if (!isUserAuthenticated(user)) {
              return <LoginPage />
            } else {
              return <div>
                <h1>Welcome {user.username}</h1>
                <img src={user.profile_picture} alt='Profile picture' />
              </div>;
            }
          }} />
          <Route path='/signup' render={(props) => {
            if (!isUserAuthenticated(user)) {
              return <SignUpRootPage />
            } else {
              return <h1>Welcome {user.username}</h1>
            }
          }} />
        </Switch>
      </BrowserRouter>
    </userContext.Provider>
  );
}

export default App;

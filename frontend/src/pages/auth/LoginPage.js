import { useState, useContext } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import TextInput from '../../components/input/text_input';
import Button from '../../components/input/button';
import { userContext } from '../../userContext';
import { extractProfileFromJWT } from '../../utils/auth';

export default function LoginPage (props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inputError, setInputError] = useState(false);

  // User context
  const { user, setUser } = useContext(userContext);

  const history = useHistory();

  const resetErrors = () => {
    setInputError(false);
  }

  // Handle form submition
  const handleSubmit = () => {
    if (password !== '' && username !== '') {
      resetErrors();
      // Fetch a token pair
      fetch('api/auth/token/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'username': username, 'password': password})
      }).then(response => {
        // Signup valid, proceed to next phase
        if (response.ok) {
          // Username and password are valid
          return response.json();
        } else {
          // Credentials are invalid
          setInputError(true);
        }
      }).then(data => {
        if (data !== undefined) {
          // Set user context and proceed redirect to homepage
          extractProfileFromJWT(user, setUser, data.access, data.refresh);
          // Store access and refresh tokens in local storage
          localStorage.setItem('access', data.access);
          localStorage.setItem('refresh', data.refresh);
          // Login complete, redirect to home page
          history.push('');
        }
      });
    } else {
      setInputError(true);
    }
  }

  return <div className='form-container'>
    <h1>Sign in.</h1>
    {/* Username */}
    <TextInput
      value={username}
      setValue={setUsername}
      id='username'
      type='text'
      label='Username'
      placeholderText='ach_henderson'
      autocomplete='username'
      isError={inputError}
      handleKeypress={resetErrors}
      errorMessage='Invalid credentials!'
      isValid={username !== ''}
    />
    {/* Password */}
    <TextInput
      value={password}
      setValue={setPassword}
      id='password'
      type='password'
      label='Password'
      placeholderText='Password'
      autocomplete='password'
      isError={inputError}
      handleKeypress={resetErrors}
      errorMessage='Invalid credentials!'
      isValid={password !== ''}
    />
    {/* Submit button */}
    <Button primary text='Login' type='submit' onClick={handleSubmit} />
  </div>;
}
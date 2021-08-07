import { useState, useEffect } from 'react';
import { validate } from 'email-validator';
import { HiShieldCheck } from 'react-icons/hi';
import Button from '../components/input/button';
import TextInput from '../components/input/text_input';

export default function RegisterPage(props) {
  const [username, setUsername] = useState('');
  const [isUsernameUnique, setIsUsernameUnique] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordStrongEnough, setIsPasswordStrongEnough] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inputErrors, setInputErrors] = useState({'username': false, 'password': false, 'confirm_password': false});

  useEffect(() => {
    if (username !== '') {
      fetch(`api/auth/validate-username/${username}`)
        .then(response => response.json())
        .then(data => {
          setIsUsernameUnique(data['valid']);
        }
      )
    } else {
      setIsUsernameUnique(false);
    }
  }, [username]);

  useEffect(() => {
    if (password !== '') {
      fetch('api/auth/validate-password/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'password': password})
      }).then(response => response.json())
      .then(data => {
        // Check if password is valid
        setIsPasswordStrongEnough(data['valid']);
      });
    } else {
      setIsPasswordStrongEnough(false);
    }
  }, [password]);

  const detectErrors = () => {
    // Find errors in input form
    setInputErrors({
      'username': !isUsernameUnique,
      'password': !isPasswordStrongEnough,
      'confirm_password': (password !== confirmPassword),
    });
  }

  const handleSubmit = () => {
    if (password === confirmPassword && password !== '' && isPasswordStrongEnough && isUsernameUnique) {
      fetch('api/auth/register/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'username': username, 'password': password})
      }).then(response => {
        if (response.ok) {
          
        } else {
          detectErrors();
        }
      })
    } else {
      detectErrors();
    }
  }

  const handleKeypress = e => {
    if (e.keyCode === 13) {
      // Enter key pressed
      handleSubmit();
    }
  }

  return <div className='form-container'>
    <h1>Create an account.</h1>
    {/* Username */}
    <TextInput
      value={username}
      setValue={setUsername}
      id='username'
      type='text'
      label='Username'
      placeholderText='ach_henderson'
      autocomplete='username'
      isValid={isUsernameUnique}
      validIcon={<HiShieldCheck size={24} />}
      onKeyPress={handleKeypress}
      isError={inputErrors['username']}
      errorMessage='Already taken!'
    />
    {/* Password */}
    <TextInput
      value={password}
      setValue={setPassword}
      id='password'
      type='password'
      label='Password'
      placeholderText='Pick a strong password'
      autocomplete='new-password'
      isValid={isPasswordStrongEnough}
      validIcon={<HiShieldCheck size={24} />}
      onKeyPress={handleKeypress}
      isError={inputErrors['password']}
      errorMessage='Not secure enough!'
    />
    {/* Confirm password */}
    <TextInput
      value={confirmPassword}
      setValue={setConfirmPassword}
      id='confirm_password'
      type='password'
      label='Confirm password'
      placeholderText='Confirm the above password'
      autocomplete='new-password'
      isValid={password === confirmPassword && password !== ''}
      validIcon={<HiShieldCheck size={24} />}
      onKeyPress={handleKeypress}
      isError={inputErrors['confirm_password']}
      errorMessage="Doesn't match!"
    />
    {/* Submit button */}
    <Button text='Create Account' type='submit' onClick={handleSubmit} />
  </div>;
}
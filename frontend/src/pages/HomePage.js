import { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '../components/input/button';
import { isUserAuthenticated, logout } from '../utils/auth';
import { userContext } from '../userContext';

export default function HomePage (props) {
  // User context
  const { user, setUser } = useContext(userContext);
  const history = useHistory();

  return <div className='form-container' style={{maxWidth: '500px'}}>
    <div className='typewriter'>
      <h1>Collaborative text editor!</h1>
    </div>
    <p style={{textAlign: 'left', marginTop: 2}}>By Angus Henderson</p>

    {isUserAuthenticated(user) ? 
      <div style={{display: 'flex', alignContent: 'center', flexDirection: 'column'}} className='input-field-container'>
        <h3 style={{textAlign: 'center'}}>Welcome {user.username}!</h3>
        <img style={{borderRadius: '50%', margin: '0 auto'}} src={user.profile_picture} width='100px' height='100px' alt='profile picture' />
        <Button text='Sign out' onClick={() => logout(setUser)} />
      </div>
      :
      <div className={'dual-button-container'}>
        <div className='dual-button-button'>
          <Button primary text='Sign up' onClick={() => {history.push('/signup')}} />
        </div>
        <div className='dual-button-button'>
          <Button text='Sign in' onClick={() => {history.push('/login')}} /> 
        </div>
      </div>
    }
  </div>;
}
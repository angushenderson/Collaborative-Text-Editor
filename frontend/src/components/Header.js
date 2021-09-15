import React from 'react';
import { FaHamburger } from 'react-icons/fa';
import { userContext } from '../userContext';

export default function Header ({documentTitle='Untitled', sidebarOpen=false, toggleSidebar=null}) {
  // User context
  const { user, setUser } = React.useContext(userContext);

  const [iconColor, setIconColor] = React.useState('white');

  return <div style={{display: 'inline-flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
    <div style={{display: 'inline-flex', alignItems: 'center'}}>
      {!sidebarOpen && <FaHamburger size={24} onClick={() => {toggleSidebar(); setIconColor('white')}} style={{marginLeft: '24px'}} onMouseOver={() => setIconColor('#b8b8b8')} onMouseOut={() => setIconColor('white')} color={iconColor} />}
      <h3 style={{padding: '0 32px'}}>{documentTitle}</h3>
    </div>

    <div style={{marginRight: '24px', padding: '4px'}}>
      <img style={{borderRadius: '50%'}} src={user.profile_picture} width='42px' height='42px' alt='profile picture' />
    </div>
  </div>;
}
import React from 'react';
import { FaHamburger } from 'react-icons/fa';
import { userContext } from '../userContext';

export default function Header ({documentTitle='Untitled', sidebarOpen=false, toggleSidebar=null, documentCollaborators=null, setDocumentCollaborators=null}) {
  // User context
  const { user, setUser } = React.useContext(userContext);

  const [iconColor, setIconColor] = React.useState('white');

  console.log("Collaborators", documentCollaborators);

  return <div style={{display: 'inline-flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
    <div style={{display: 'inline-flex', alignItems: 'center'}}>
      {!sidebarOpen && <FaHamburger size={24} onClick={() => {toggleSidebar(); setIconColor('white')}} style={{marginLeft: '24px'}} onMouseOver={() => setIconColor('#b8b8b8')} onMouseOut={() => setIconColor('white')} color={iconColor} />}
      <h3 style={{padding: '0 32px'}}>{documentTitle}</h3>
    </div>

    <div style={{marginRight: '24px', padding: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
      {documentCollaborators && <div style={{marginRight: '16px'}} className="dropdown-container">
        <button className='btn-secondary' style={{padding: '8px 16px'}}>Share</button>
        <div className="dropdown-content">
          <p><b>Document Collaborators</b></p>
          <hr />
          {documentCollaborators.map(collaborator => <div key={collaborator.user.username} style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
            <p>{collaborator.user.username}</p>
            <p>{collaborator.permission_level}</p>
          </div>)}
        </div>
      </div>}
      <img style={{borderRadius: '50%'}} src={user.profile_picture} width='42px' height='42px' alt='profile picture' />
    </div>
  </div>;
}
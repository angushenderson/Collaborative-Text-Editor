import React from 'react';
import { useHistory } from 'react-router-dom';
import { FaHamburger } from 'react-icons/fa';
import { userContext } from '../userContext';
import Dropdown from 'react-dropdown';
import baseRequest from '../utils/baseRequest';
import TextInput from './input/text_input';

export default function Header ({documentTitle='Untitled', sidebarOpen=false, toggleSidebar=null, documentCollaborators=null, setDocumentCollaborators=null, documentId=null, websocket=null}) {
  // User context
  const { user, setUser } = React.useContext(userContext);
  console.log(user.permission);

  // Router
  const history = useHistory();

  const [iconColor, setIconColor] = React.useState('white');

  const [searchBarValue, setSearchBarValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);

  const dropdownOptions = ['Owner', 'Admin', 'Editor', 'Viewer', 'Remove'];

  React.useEffect(() => {
    if (searchBarValue !== '') {
      // Request timeout to only send request once user has stopped typing
      const delayDebounceFn = setTimeout(() => {
        baseRequest(user, setUser, history, (accessToken) => {
          fetch(`/api/users/search/?search=${searchBarValue}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }).then((response) => {
            if (response.ok) {
              return response.json()
            }
          }).then((data) => {
            if (data !== undefined) {
              console.log("Search Response", data);
              setSearchResults(data);
            }
          });
        });
      }, 200);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchBarValue]);

  const addCollaborator = (user_id) => {
    baseRequest(user, setUser, history, (accessToken) => {
      websocket.current.send(JSON.stringify({
        'type': 'add_new_collaborator',
        'access_token': accessToken,
        'body': {
          'user': user_id,
        }
      }));
    });
  }

  const changeUserPermission = (userId, newPermission) => {
    console.log(userId, newPermission);
  }

  return <div style={{display: 'inline-flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
    <div style={{display: 'inline-flex', alignItems: 'center'}}>
      {!sidebarOpen && <FaHamburger size={24} onClick={() => {toggleSidebar(); setIconColor('white')}} style={{marginLeft: '24px'}} onMouseOver={() => setIconColor('#b8b8b8')} onMouseOut={() => setIconColor('white')} color={iconColor} />}
      <h3 style={{padding: '0 32px'}}>{documentTitle}</h3>
    </div>

    <div style={{marginRight: '24px', padding: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
      {documentCollaborators && <div style={{marginRight: '16px'}} className="dropdown-container">
        <button className='btn-secondary' style={{padding: '8px 16px'}}>Share</button>
        <div className="dropdown-content">
          <TextInput
            value={searchBarValue}
            setValue={setSearchBarValue}
            id='user_search_bar'
            label='Add collaborators'
            placeholderText='ach_henderson'
            autocomplete='off'
          />
          <div style={{padding: '4px 0', translate: 'translateY(-24px)'}}>
            {searchResults.map(result => <div key={"search-result-"+result.username} style={{cursor: 'pointer'}} onClick={() => addCollaborator(result.id)}>{result.username}</div>)}
          </div>
          <p><b>Document Collaborators</b></p>
          <hr />
          {documentCollaborators.map(collaborator => <div key={collaborator.user.username} style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '4px 8px'}}>
            <p>{collaborator.user.username}</p>
            <Dropdown className="permission-dropdown" disabled={user.permission > 1} options={dropdownOptions} onChange={() => changeUserPermission(collaborator.id, )} value={collaborator.permission_level} />
          </div>)}
        </div>
      </div>}
      <img style={{borderRadius: '50%'}} src={user.profile_picture} width='42px' height='42px' alt='profile picture' />
    </div>
  </div>;
}
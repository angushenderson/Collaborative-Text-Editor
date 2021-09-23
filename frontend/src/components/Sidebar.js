import React from 'react';
import { FiArrowLeftCircle } from 'react-icons/fi';
import TimeOfDayWelcomeMessage from '../utils/time';
import { userContext } from '../userContext';

export default function Sidebar({width, setSidebarContentMargin, children}) {
  // User context
  const { user, setUser } = React.useContext(userContext);

  const [xPosition, setX] = React.useState(-width);

  const [iconColor, setIconColor] = React.useState('white');

  const toggleMenu = () => {
    setSidebarContentMargin(-xPosition);
    if (xPosition < 0) {
      setX(0);
    } else {
      setX(-width);
    }
  };

  React.useEffect(() => {
    setX(0);
  }, []);

  return <div
    className="sidebar"
    style={{
      transform: `translatex(${xPosition}px)`,
      width: width,
      zIndex: '20',
      // paddingTop: '60px',
    }}
  >
    <div style={{display: 'inline-flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', maxWidth: width-28, width: '100%'}}>
      <h2>{TimeOfDayWelcomeMessage()} <span style={{fontWeight: 'bold'}}>{user.username}</span></h2>
      <FiArrowLeftCircle size={72} onMouseOver={() => setIconColor('#b8b8b8')} onMouseOut={() => setIconColor('white')} color={iconColor} onClick={toggleMenu} />
    </div>
    <React.Fragment>{children}</React.Fragment>
  </div>
}
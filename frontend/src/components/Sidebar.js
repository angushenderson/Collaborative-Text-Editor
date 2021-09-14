import React from 'react';

export default function Sidebar({width, setSidebarContentMargin, children}) {
  const [xPosition, setX] = React.useState(-width);

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
    }}
  >
    <button
      onClick={() => toggleMenu()}
      className="sidebar-toggle-menu"
      style={{
        transform: `translate(${width}px, 20vh)`,
        width: '30px',
      }}
    ></button>
    <React.Fragment>{children}</React.Fragment>
  </div>
}
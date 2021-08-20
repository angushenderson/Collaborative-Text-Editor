import React from 'react';

export default function Sidebar({width, height, children}) {
  const [xPosition, setX] = React.useState(-width);

  const toggleMenu = () => {
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
      minHeight: height
    }}
  >
    <button
      onClick={() => toggleMenu()}
      className="toggle-menu"
      style={{
        transform: `translate(${width}px, 20vh)`
      }}
    ></button>
    <React.Fragment>{children}</React.Fragment>
  </div>
}
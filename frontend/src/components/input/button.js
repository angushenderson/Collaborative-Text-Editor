import '../../styles/components.css';

export default function button({
  text = 'Button',
  type = 'button',
  onClick = null, // Callback function to run when button is pressed
  primary = false,
}) {
  return <div className='button-container'>
    <button className='btn-grad' type={type} onClick={onClick}>
      {text}
    </button>
  </div>;
}
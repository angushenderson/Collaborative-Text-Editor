import '../../styles/components.css';

export default function SmallButton({
  text = 'Button',
  type = 'button',
  onClick = null, // Callback function to run when button is pressed
  primary = false,
}) {
  return <button className={primary ? 'btn-grad-primary': 'btn-secondary'} style={{padding: '12px 24px', margin: '8px 0px'}} type={type} onClick={onClick}>
    {text}
  </button>;
}
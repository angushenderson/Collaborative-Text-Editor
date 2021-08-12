import '../../styles/components.css';

// Function for themed text input
export default function TextInput({
  value = null, // state value
  setValue = null, // setState callback
  id = 'id', // ID for input
  type = 'text', // Type of input
  label = 'Label text', // Label text
  placeholderText = 'Placeholder text ...', // Placeholder input text
  autocomplete = '', // Auto complete attribute for input field
  isValid = false,
  validIcon = null, // Icon to show when isValid is true, IconSize prop should be 24!!!
  handleKeypress=null, // Function to run when a key is pressed
  isError=false, // If true, will shake to show an error has occurred
  errorMessage='',
}) {

  return <div style={{display: 'block'}} className='input-field-container'>
    <div style={{display: 'inline-block', height: '100px', width: '100%'}}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        id={id}
        name={id}
        type={type}
        placeholder={placeholderText}
        autoComplete={autocomplete}
        className={`text-input ${isValid ? 'input-success-shadow' : ''} ${isError ? 'text-input-ERROR': ''}`}
        onKeyPress={handleKeypress}
      />
      <div className='label-container'>
        <label htmlFor={id} className='label-text'>{label}{isError ? ` - ${errorMessage}`: ''}</label>
      </div>
      {isValid && <div className='trailing-icon-container'>
        {validIcon}
      </div>}
    </div>
  </div>;
}
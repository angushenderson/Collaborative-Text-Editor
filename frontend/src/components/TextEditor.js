import { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';

export default function TextEditor(props) {
  // Text editor using draft.js

  // Editor state, use editorState to access rich text in editor
  const [editorState, setEditorState] = useState(
    () => EditorState.createEmpty(),
  );

  useEffect(() => {
    // console.log(editorState.getCurrentContent());
    console.log(convertToRaw(editorState.getCurrentContent()));
  }, [editorState]);

  function handleKeyCommand (command, editorState) {
    // Function to handle key commands such as Ctrl + b or Ctrl + c
    const newState = RichUtils.handleKeyCommand(editorState, command);
    
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  function handleEditorStyleChange(newStyle) {
    // Function to handle changing of the editor style from a button press
    // newStyle is the new style the editor should represent in accordance with draft.js
    setEditorState(RichUtils.toggleInlineStyle(editorState, newStyle));
  }

  return <div className='editor-container'>
    <button onClick={() => handleEditorStyleChange('BOLD')}>Bold</button>
    <Editor editorState={editorState} handleKeyCommand={handleKeyCommand} onChange={setEditorState} spellCheck={true} />
  </div>;
}
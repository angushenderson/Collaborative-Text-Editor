import { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, Modifier, SelectionState, ContentBlock } from 'draft-js';
import _, { update } from 'lodash';
import isPrintableKeyEvent from 'is-printable-key-event';
import 'draft-js/dist/Draft.css';
import isNull from '../utils/isNull';


// Characters which are used to break up words - used for backspace-word operations
const WORD_BREAK_CHARACTERS = [' ', '(', ')', '{', '}', '[', ']', '"', '.', ',', '@', '/', '!', '£', '$', '%', '^', '&', '*', '\\', '?', '<', '>', '|', '`', ':', ';', '#', '~', '-', '+', '='];

export default function TextEditor(props) {
  // Text editor using draft.js
  const editorState = props.editorState;
  const setEditorState = props.setEditorState;
  const updatedContentStack = props.updatedContentStack;
  const setUpdatedContentStack = props.setUpdatedContentStack;
  const sendUpdatedDocument = props.sendUpdatedDocument;

  const [editorHasFocus, setEditorHasFocus] = useState(false);
  
  function keyBindingFn(e) {
    // This function is run FIRST
    const keyBinding = getDefaultKeyBinding(e);
    var newContentBlocks = [];

    // TODO Implement handling of highlighted text

    if (['backspace', 'backspace-word'].includes(keyBinding)) {
      // Text has been deleted
      var words = editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getAnchorKey()).getText();
      words = words.slice(0,editorState.getSelection().getAnchorOffset());
      
      // Calculate length of last word to remove
      var i = 0;
      // Handle break word characters
      while (WORD_BREAK_CHARACTERS.includes(words[words.length-1-i])) {
        i++;
      }
      // Handle counting word lengths
      while (![...WORD_BREAK_CHARACTERS, undefined].includes(words[words.length-1-i])) {
        i++;
      }

      const position = keyBinding === 'backspace-word' ? words.length - i : editorState.getSelection().getAnchorOffset()-1;
      const offset = keyBinding === 'backspace-word' ?  i : 1;

      if (keyBinding === 'backspace-word') {
        // Update editor state
        const selection = new SelectionState({
          anchorKey: editorState.getSelection().getAnchorKey(),
          focusKey: editorState.getSelection().getFocusKey(),
          anchorOffset: editorState.getSelection().getAnchorOffset()-i,
          focusOffset: editorState.getSelection().getAnchorOffset(),
          isBackward: false,
          hasFocus: editorState.getSelection().getHasFocus(),
        });
        const newState = Modifier.removeRange(editorState.getCurrentContent(), selection, 'backward');
        setEditorState(EditorState.push(editorState, newState, 'remove-range'));
      }

      newContentBlocks.push({
        type: 'delete',
        block: editorState.getSelection().getAnchorKey(),
        position: position,
        offset: offset,
      });
    } else if (keyBinding === 'split-block') {
      // Enter key has been pressed
      const newContentState = Modifier.splitBlock(editorState.getCurrentContent(), editorState.getSelection());
      newContentBlocks.push({
        type: 'split-block',
        block: editorState.getSelection().getAnchorKey(),
        newBlock: newContentState.getKeyAfter(editorState.getSelection().getAnchorKey()),
        position: editorState.getSelection().getAnchorOffset(),
      });
      console.log(editorState.getSelection().getAnchorKey());
      setEditorState(EditorState.push(editorState, newContentState, 'split-block'));

    } else if (Array.from({length: 8}, (_, i) => i + 33).includes(e.keyCode)) {
      // Arrow key / page key pressed
      console.log({
        type: 'cursor-moved',
        block: 'block_id',
        position: 'an integer',
        text: 'text',
      });
    } else if (keyBinding === null && (isPrintableKeyEvent(e) || e.keyCode === 32)) {
      // Text has been added
      newContentBlocks.push({
        type: 'insert',
        block: editorState.getSelection().getAnchorKey(),
        position: editorState.getSelection().getAnchorOffset(),
        text: e.key,
      });
    }

    if (newContentBlocks) {
      setUpdatedContentStack([...updatedContentStack, ...newContentBlocks]);
    }
    return keyBinding;
  }

  function handleKeyCommand (command, _) {
    // Dont bother with this function :- handle it all in the above function instead
    // This function is run SECOND
    if (command === 'backspace') {

    } else if (command === 'backspace-word') {
      // Custom backspace word behaviour in above function
      return 'handled';
    } else if (command === 'split-block') {
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
    <Editor
      editorState={editorState}
      handleKeyCommand={handleKeyCommand}
      keyBindingFn={keyBindingFn}
      onChange={setEditorState}
      spellCheck={true}
      readOnly={false}
      onFocus={() => {setEditorHasFocus(true)}}
      onBlur={() => {setEditorHasFocus(false)}}
    />
  </div>;
}
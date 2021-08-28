import { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw, getDefaultKeyBinding } from 'draft-js';
import _, { update } from 'lodash';
import isPrintableKeyEvent from 'is-printable-key-event';
import 'draft-js/dist/Draft.css';
import isNull from '../utils/isNull';

export default function TextEditor(props) {
  // Text editor using draft.js
  const editorState = props.editorState;
  const setEditorState = props.setEditorState;
  const updatedSelection = props.updatedSelection;
  const setUpdatedSelection = props.setUpdatedSelection;
  const sendUpdatedDocument = props.sendUpdatedDocument;

  const [editorHasFocus, setEditorHasFocus] = useState(false);

  useEffect(() => {
    if (!isNull(updatedSelection)) {
      console.log(updatedSelection);
    }
  }, [updatedSelection]);

  function keyBindingFn(e) {
    const keyBinding = getDefaultKeyBinding(e);

    const selection = {
      anchorBlockKey: editorState.getSelection().getAnchorKey(),
      focusBlockKey: editorState.getSelection().getFocusKey(),
      anchorOffset: editorState.getSelection().getAnchorOffset(),
      focusOffset: editorState.getSelection().getFocusOffset(),
    };
  
    if (isNull(updatedSelection)) {
      var newUpdatedSelection = {...selection};
    } else {
      var newUpdatedSelection = {...updatedSelection};
    }

    if (Array.from({length: 8}, (_, i) => i + 33).includes(e.keyCode)) {
      // Custom function code to state when the editor cursor has been moved
      return 'move-cursor';
    } else if (isPrintableKeyEvent(e)) {
      // Single character is being added
      const newOffset = selection.anchorOffset + 1;

      setUpdatedSelection({
        ...newUpdatedSelection,
        anchorOffset: newOffset < newUpdatedSelection.anchorOffset ? newOffset : newUpdatedSelection.anchorOffset,  
        focusOffset: newOffset >= newUpdatedSelection.focusOffset ? newOffset : newUpdatedSelection.focusOffset,
      });
    }
    // else if (e.keyCode === 13) {
    //   // Enter key pressed
    //   setUpdatedSelection({
    //     ...newUpdatedSelection,
    //     focusBlockKey: newUpdatedSelection.focusBlockKey,
    //     focusOffset: 0,
    //   });
    // }

    return keyBinding;
  }

  function handleKeyCommand (command, editorState) {
    // TODO Need to make sure anchor is before or inline with focus at all times

    const selection = {
      anchorBlockKey: editorState.getSelection().getAnchorKey(),
      focusBlockKey: editorState.getSelection().getFocusKey(),
      anchorOffset: editorState.getSelection().getAnchorOffset(),
      focusOffset: editorState.getSelection().getFocusOffset(),
    };
    const content = editorState.getCurrentContent();

    // If updatedSelection is filled with null values, establish an anchor based on current selection
    if (isNull(updatedSelection)) {
      var newUpdatedSelection = {...selection};
    } else {
      var newUpdatedSelection = {...updatedSelection};
    }

    // Key of current block or block above if moving cursor to one above
    const row = selection.focusOffset - 1 < 0 ? content.getKeyBefore(selection.anchorBlockKey) : selection.anchorBlockKey;
    const offset = selection.focusOffset - 1 < 0 ? content.getBlockForKey(row).getLength() : selection.focusOffset - 1

    if (command === 'backspace') {
      // Handle text being removed one character at a time
      newUpdatedSelection = {
        ...newUpdatedSelection,
        // Only move anchor back if row has moved up
        anchorBlockKey: row !== newUpdatedSelection.anchorBlockKey ? row : newUpdatedSelection.anchorBlockKey,
        focusBlockKey: row === updatedSelection.focusBlockKey ? row : newUpdatedSelection.focusBlockKey,
        // More anchor back if focus will overtake anchor, else move focus backwards
        anchorOffset: offset < newUpdatedSelection.anchorOffset ? offset : newUpdatedSelection.anchorOffset,
        focusOffset: offset >= newUpdatedSelection.focusOffset ? offset : newUpdatedSelection.focusOffset,
      };
    } else if(command === 'backspace-word') {
      // Handle text being removed one word at a time
      
      if (content.getBlockForKey(row).getText().length !== 0) {
        // Find the next backspace
        var char = content.getBlockForKey(row).getText()[selection.focusOffset-1] === ' ' ? selection.focusOffset-2 : selection.focusOffset-1;
        while (content.getBlockForKey(row).getText()[char-1] !== ' ' && char !== 0) {
          char--;
        }
        const newOffset = selection.focusOffset - 1 < 0 ? content.getBlockForKey(row).getLength() : char;

        newUpdatedSelection = {
          ...newUpdatedSelection,
          // Only move anchor back if row has moved up
          anchorBlockKey: row !== newUpdatedSelection.anchorBlockKey ? row : newUpdatedSelection.anchorBlockKey,
          focusBlockKey: row === updatedSelection.focusBlockKey ? row : newUpdatedSelection.focusBlockKey,
          // More anchor back if focus will overtake anchor, else move focus backwards
          anchorOffset: newOffset < newUpdatedSelection.anchorOffset ? newOffset : newUpdatedSelection.anchorOffset,
          focusOffset: newOffset >= newUpdatedSelection.focusOffset ? newOffset : newUpdatedSelection.focusOffset,
        };
      } else {
        newUpdatedSelection = {
          ...newUpdatedSelection,
          focusBlockKey: row,
          focusOffset: offset,
        };
      }

    } else if (command === 'delete') {
      // Delete key will only delete content in current block - it will never change blocks
      // TODO, UPDATE THIS BEHAVIOUR, not entirely sure about how delete key should work so figure it out and fix this in accordance to new anchor focus rules
      newUpdatedSelection = {
        ...newUpdatedSelection,
        focusOffset: selection.focusOffset
      };

    }

    if (command === 'move-cursor') {
      // Cursor has been moved by key presses, send any changes to avoid edge case conflicts
      sendUpdatedDocument();
      return 'not-handled';
    }

    // Update state
    setUpdatedSelection(newUpdatedSelection);

    // Function to handle key commands such as Ctrl + b or Ctrl + c
    const newEditorState = RichUtils.handleKeyCommand(editorState, command);
    if (newEditorState) {
      setEditorState(newEditorState);
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
import { useState, useEffect, useContext } from 'react';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, Modifier, SelectionState, ContentBlock } from 'draft-js';
import _, { update } from 'lodash';
import isPrintableKeyEvent from 'is-printable-key-event';
import { userContext } from '../userContext';
import 'draft-js/dist/Draft.css';
import SmallButton from './input/small_button';
import isNull from '../utils/isNull';


// Characters which are used to break up words - used for backspace-word operations
const WORD_BREAK_CHARACTERS = [' ', '(', ')', '{', '}', '[', ']', '"', '.', ',', '@', '/', '!', '£', '$', '%', '^', '&', '*', '\\', '?', '<', '>', '|', '`', ':', ';', '#', '~', '-', '+', '='];

const BLOCK_TYPES = [
  ['H1', 'header-one'],
  ['H2', 'header-two'],
  ['H3', 'header-three'],
  ['H4', 'header-four'],
  ['H5', 'header-five'],
  ['H6', 'header-six'],
  ['Blockquote', 'blockquote'],
  ['UL', 'unordered-list-item'],
  ['OL', 'ordered-list-item'],
  ['Code Block', 'code-block'],
];

const INLINE_STYLES = [
  ['Bold', 'BOLD'],
  ['Italic', 'ITALIC'],
  ['Underline', 'UNDERLINE'],
];

export default function TextEditor(props) {
  // Text editor using draft.js
  const editorState = props.editorState;
  const setEditorState = props.setEditorState;
  const updatedContentStack = props.updatedContentStack;
  const setUpdatedContentStack = props.setUpdatedContentStack;
  const sendUpdatedDocument = props.sendUpdatedDocument;

  const [editorHasFocus, setEditorHasFocus] = useState(false);

  const { user, setUser } = useContext(userContext);
  
  function keyBindingFn(e) {
    // This function is run FIRST
    const keyBinding = getDefaultKeyBinding(e);
    const selection = editorState.getSelection();
    var newContentBlocks = [];

    // TODO Implement handling of highlighted text

    if (['backspace', 'backspace-word'].includes(keyBinding)) {
      // Cursor text has been deleted
      getKeyRange().forEach(key => {
        // Offsets in current block
        var anchor = selection.getAnchorKey() === key ? selection.getAnchorOffset() : 0;
        var focus = selection.getFocusKey() === key ? selection.getFocusOffset() : editorState.getCurrentContent().getBlockForKey(key).getText().length;

        if (key === selection.getAnchorKey() && key === selection.getFocusKey() && anchor === focus) {
          // No text highlighted
          var words = editorState.getCurrentContent().getBlockForKey(key).getText();
          words = words.slice(0, anchor);
          
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

          // TODO Need to fix bug where backspace at anchor of 0 deletes the entire line (delete key style)
          console.log(editorState.getCurrentContent().getBlocksAsArray()[0].getKey(), selection.getAnchorKey(), anchor, focus);
          if (editorState.getCurrentContent().getBlocksAsArray()[0].getKey() === selection.getAnchorKey() && anchor < 1 && focus < 1) {
            // Backspace pressed on block on first line
            return;
          } else {
            anchor = keyBinding === 'backspace-word' ? words.length - i : anchor-1;
            focus = keyBinding === 'backspace-word' ?  i : 1;
          }

          if (keyBinding === 'backspace-word') {
            // Update editor state
            const new_selection = new SelectionState({
              anchorKey: selection.getAnchorKey(),
              focusKey: selection.getFocusKey(),
              anchorOffset: selection.getAnchorOffset()-i,
              focusOffset: selection.getAnchorOffset(),
              isBackward: false,
              hasFocus: selection.getHasFocus(),
            });
            const newState = Modifier.removeRange(editorState.getCurrentContent(), new_selection, 'backward');
            setEditorState(EditorState.push(editorState, newState, 'remove-range'));
          }
        } else if (key === selection.getAnchorKey() && key === selection.getFocusKey()) {
          // Highlighted text in single block has been deleted
          anchor = selection.isBackward ? selection.getFocusOffset() : selection.getAnchorOffset();
          focus = selection.isBackward ? selection.getAnchorOffset() - selection.getFocusOffset() : selection.getFocusOffset() - selection.getAnchorOffset();
        } else {
          // Highlighted text across multiple blocks has been deleted
          // NOTE Need to take into account reverse selections: they're a bitch lol
          const stop = selection.isBackward ? selection.getAnchorKey() : selection.getFocusKey();
          const stopOffset = selection.isBackward ? selection.getAnchorOffset() : selection.getFocusOffset();
          focus = stop === key ? stopOffset : editorState.getCurrentContent().getBlockForKey(key).getText().length;

          const start = selection.isBackward ? selection.getFocusKey() : selection.getAnchorKey();
          const startOffset = selection.isBackward ? selection.getFocusOffset() : selection.getAnchorOffset();
          anchor = start === key ? startOffset : -1;

          if (anchor === -1) {
            focus++;
          }
        }

        newContentBlocks.push({
          type: 'delete',
          block: key,
          position: anchor,
          offset: focus,
        });
      });
    } else if (keyBinding === 'split-block') {
      // Enter key has been pressed
      const deletedSections = (selection.getAnchorKey() === selection.getFocusKey() && selection.getFocusOffset() === selection.getAnchorOffset()) ? [] : deleteSelectionRange();

      newContentBlocks = newContentBlocks.concat(deletedSections);
      console.log('SPLIT BLOCK', newContentBlocks);

      // if (deletedSections.length > 1) {
      //   // Delete blocks
      //   var newContentState = Modifier.removeRange(editorState.getCurrentContent(), selection, 'forward');
      //   var newSelection = new SelectionState({
      //     anchorKey: selection.getAnchorKey(),
      //     focusKey: selection.getAnchorKey(),
      //     anchorOffset: selection.getAnchorOffset(),
      //     focusOffset: selection.getAnchorOffset(),
      //     isBackward: false,
      //     hasFocus: selection.getHasFocus(),
      //   });
      //   newContentState.selectionState = newSelection;
      // } else {
      var newContentState = editorState.getCurrentContent();
      var newSelection = selection;
      // }

      console.log(newSelection);
      console.log(newContentState);
      newContentState = Modifier.splitBlock(newContentState, newSelection);
      newContentBlocks.push({
        type: 'split-block',
        block: editorState.getSelection().getAnchorKey(),
        newBlock: newContentState.getKeyAfter(editorState.getSelection().getAnchorKey()),
        position: editorState.getSelection().getAnchorOffset(),
      });
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
    // This function is run SECOND
    if (command === 'handled') {
      return 'handled';
    } else if (command === 'backspace-word') {
      // Custom backspace word behaviour in above function
      return 'handled';
    } else if (command === 'split-block') {
      return 'handled';
    }

    return 'not-handled';
  }

  function deleteSelectionRange() {
    var stack = [];
    console.log('RANGE', getKeyRange());
    getKeyRange().forEach(key => {
      const selection = editorState.getSelection();

      // if (key !== selection.getAnchorKey() && key !== selection.getFocusKey() && selection.getAnchorOffset() !== selection.getFocusOffset()) {
      const stop = selection.isBackward ? selection.getAnchorKey() : selection.getFocusKey();
      const stopOffset = selection.isBackward ? selection.getAnchorOffset() : selection.getFocusOffset();
      const focus = stop === key ? stopOffset : editorState.getCurrentContent().getBlockForKey(key).getText().length;

      const start = selection.isBackward ? selection.getFocusKey() : selection.getAnchorKey();
      const startOffset = selection.isBackward ? selection.getFocusOffset() : selection.getAnchorOffset();
      const anchor = start === key ? startOffset : -1;

      stack.push({
        type: 'delete',
        block: key,
        position: anchor,
        offset: focus,
      });
      // }
    });
    console.log(stack);
    return stack;
  }

  function getKeyRange() {
    // Get a range of keys between current selection
    const selection = editorState.getSelection();
    const stop = selection.isBackward ? selection.getAnchorKey() : selection.getFocusKey();

    var key = selection.isBackward ? selection.getFocusKey() : selection.getAnchorKey();
    var keys = [key];
    while (key !== stop && key !== undefined) {
      key = editorState.getCurrentContent().getKeyAfter(key);
      keys.push(key);
      console.log(keys);
    } if (keys.at(-1) === undefined) {
      keys.pop();
    } if (key !== stop) {
      keys.push(stop);
    }
    console.log("keys", keys);

    return keys;
  }

  function handleBlockTypeChange(newType) {
    const newState = RichUtils.toggleBlockType(editorState, newType);
    setEditorState(newState);

    var newContentBlocks = [];
    getKeyRange().forEach(item => {
      newContentBlocks.push({
        type: 'set-block-type',
        block: item,
        newBlockType: newState.getCurrentContent().getBlockForKey(item).getType(),
      })
    });
  
    setUpdatedContentStack([...updatedContentStack, ...newContentBlocks]);
  }

  function handleEditorStyleChange(newStyle) {
    // Function to handle changing of the editor style from a button press
    // newStyle is the new style the editor should represent in accordance with draft.js
    const newState = RichUtils.toggleInlineStyle(editorState, newStyle);
    var newStyleRange = [];
    getKeyRange().forEach(item => {
      const position = newState.getSelection().getAnchorKey() === item ? newState.getSelection().getAnchorOffset() : 0;
      // -1 means selection to the end of the block
      const offset = newState.getSelection().getFocusKey() === item ? newState.getSelection().getFocusOffset() : -1;

      newStyleRange.push({
        type: 'set-inline-style',
        block: item,
        position: position,
        offset: offset,
        style: newStyle,
      });
    });

    setEditorState(newState);
    setUpdatedContentStack([...updatedContentStack, ...newStyleRange]);
  }

  function getSelectionBlockStyle() {
    // Returns undefined if selection spans multiple content blocks
    if (editorState.getSelection().getAnchorKey() !== editorState.getSelection().getFocusKey()) {
      return undefined;
    } else {
      return editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getAnchorKey()).getType();
    }
  }

  return <div className='editor-container'>
    <div className='editor-control-panel' style={{marginBottom: '12px', position: 'sticky', top: '64px', background: '#101010', zIndex: '5'}}>
      <div style={{display: 'inline-flex', flexWrap: 'wrap'}}>
        {  BLOCK_TYPES.map(item => {
          return <div style={{marginRight: '8px'}} key={item[0]}>
            <SmallButton
              text={item[0]}
              onClick={() => handleBlockTypeChange(item[1])}
              primary={getSelectionBlockStyle() === item[1]}
            />
          </div>
        })}

        {/* {  INLINE_STYLES.map(item => {
          return <div style={{marginRight: '8px'}} key={item[0]}>
            <SmallButton
              text={item[0]}
              onClick={() => handleEditorStyleChange(item[1])}
              // primary={getSelectionBlockStyle() === item[1]}
            />
          </div>
        })} */}
      </div>
    </div>

    <Editor
      editorState={editorState}
      handleKeyCommand={handleKeyCommand}
      keyBindingFn={keyBindingFn}
      onChange={setEditorState}
      spellCheck={true}
      readOnly={user.permission > 2}
      onFocus={() => {setEditorHasFocus(true)}}
      onBlur={() => {setEditorHasFocus(false)}}
    />
  </div>;
}
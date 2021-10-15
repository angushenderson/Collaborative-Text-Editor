import { useState, useEffect, useContext } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';
import '../styles/textEditorStyles.css';
import { userContext } from '../userContext';

export default function TitleEditor (props) {
  // Editor to set the title of a document
  const editorState = props.editorState;
  const setEditorState = props.setEditorState;

  const { user, setUser } = useContext(userContext);

  useEffect(() => {
    /*
      {
        'anchor': int,   start
        'focus': int,    end
        'new_text': str,
      }
    */

    // console.log(editorState.getSelection().serialize());
    // console.log(convertToRaw(editorState.getCurrentContent()));

    // console.log(editorState);

    // Get selected characters
    // var selectionState = editorState.getSelection();
    // var anchorKey = selectionState.getAnchorKey();
    // var currentContent = editorState.getCurrentContent();
    // var currentContentBlock = currentContent.getBlockForKey(anchorKey);
    // var start = selectionState.getStartOffset();
    // var end = selectionState.getEndOffset();
    // if (start === end) {
    //   start--;
    // }
    // var selectedText = currentContentBlock.getText().slice(start, end);
    // console.log(selectedText);
    // const slicedText = editorState.getCurrentContent().getPlainText().slice(start, end);
    // console.log(slicedText);
    // console.log(editorState.getSelection().serialize());

    // Get last added character(s)
    // console.log(editorState.getUndoStack());
    if (editorState.getUndoStack().size > 0) {
      // console.log(editorState.getUndoStack());
    }
    // console.log(editorState.getUndoStack()[-1].getEntityMap());
  }, [editorState]);

  useEffect(() => {
    var start = editorState.getSelection().getStartOffset();
    var end = editorState.getSelection().getEndOffset();
    if (start === end) {
      start--;
    }
    var slicedText = editorState.getCurrentContent().getPlainText().slice(start, end);
    // console.log(slicedText);

    // Title doesn't require any styling, only the text
    // const rawData = convertToRaw(editorState.getCurrentContent());
    // // console.log(rawData.blocks);
    // var text = '';
    // for (var i=0; i < rawData.blocks.length; i++) {
    //   text += rawData.blocks[i].text;
    // }
    // console.log(text);

    editorState.getCurrentContent();
  }, [editorState]);

  const keyBindingFn = (event) => {
    if (event.keyCode === 13) {
      // Prevent enter key presses
      return '';
    }
    return getDefaultKeyBinding(event);
  }

  let className = 'editor-container';
  var contentState = editorState.getCurrentContent();
  if (!contentState.hasText()) {
    if (contentState.getBlockMap().first().getType() !== 'unstyled') {
      className += ' RichEditor-hidePlaceholder';
    }
  }

  console.log(user.permission);

  return <div className={className}>
    <Editor
      editorState={editorState}
      onChange={setEditorState}
      keyBindingFn={keyBindingFn}
      handlePastedText={() => {

      }}
      blockStyleFn={(contentBlock) => {
        const type = contentBlock.getType();
        if (type === 'unstyled') {
          return 'page-title';
        }
      }}
      placeholder='Untitled'
      spellCheck={true}
      readOnly={user.permission > 1}
    />
  </div>;
}
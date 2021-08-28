import { useState, useEffect, useContext, useRef } from 'react';
import { ContentState, EditorState, convertFromRaw } from 'draft-js';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TextEditor from '../components/TextEditor';
import TitleEditor from '../components/TitleEditor';
import { userContext } from '../userContext';
import baseRequest from '../utils//baseRequest';
import useInterval from '../utils/useInterval';
import isNull from '../utils/isNull';

export default function EditorPage(props) {
  const webSocket = useRef(null);

  // Prevent requests being send unless the below time has passed since the last request (websocket)
  const REQUEST_TIME_RATE_LIMIT = 1000;

  // User context
  const { user, setUser } = useContext(userContext);

  const history = useHistory();

  // State for managing title input box
  const [titleEditorState, setTitleEditorState] = useState(null);
  const [previousTitle, setPreviousTitle] = useState('');

  // State for managing document editor
  const [documentEditorState, setDocumentEditorState] = useState(null);
  
  const resetUpdatedSelection = () => {
    return {
      anchorBlockKey: null,
      focusBlockKey: null,
      anchorOffset: null,
      focusOffset: null,
    };
  }
  
  const [updatedSelection, setUpdatedSelection] = useState(resetUpdatedSelection());

  const sendUpdatedTitle = () => {
    // Function to send text in title text box to websocket if text has changed
    if (titleEditorState !== null) {
      // Only send request if connection is open
      if (webSocket.current.readyState === WebSocket.OPEN) {
        const text = titleEditorState.getCurrentContent().getPlainText();
        // Only send text if its changed
        if (previousTitle !== text) {
          webSocket.current.send(JSON.stringify({
            'type': 'document-title',
            'text': text,
          }));
          setPreviousTitle(text);
        }
      } else {
        // TODO: handle unconnected errors here (prevent typing and show warning)
      }
    }
  };

  const sendUpdatedDocument = () => {
    // Function to send the text which has been updated to server via open websocket
    if (documentEditorState !== null) {
      if (webSocket.current.readyState === WebSocket.OPEN) {
        if (!isNull(updatedSelection)) {
          // Only send request if content has been updated
          const text = getUpdatedSelectionText();
          console.log(text);
          webSocket.current.send(JSON.stringify({
            'type': 'document-update',
            'update_state': {...updatedSelection, text: text},
          }));
          // Reset
          setUpdatedSelection(resetUpdatedSelection());
        }
      }
    }
  }

  const getUpdatedSelectionText = () => {
    // Returns the updated text from updatedSelection object state, this will account for the fact that anchor could be ahead of focus (back to front)
    var text = '';
    const content = documentEditorState.getCurrentContent();

    if (updatedSelection.anchorBlockKey === updatedSelection.focusBlockKey) {
      // For single block modifications
      return content.getBlockForKey(updatedSelection.anchorBlockKey).getText().slice(updatedSelection.anchorOffset, updatedSelection.focusOffset);
    }

    // For multi block modifications
    var block = content.getBlockForKey(updatedSelection.anchorBlockKey);
    var text = block.getText().slice(updatedSelection.anchorOffset, block.getText().length);
    while (block !== null) {
      block = content.getBlockAfter(block.getKey());
      if (block.getKey() === updatedSelection.focusBlockKey) {
        text += block.getText().slice(0, updatedSelection.focusOffset);
        block = null;
      } else {
        text += block.getText() + '\n';
      }
    }

    return text;
  }

  useEffect(() => {
    // Fetch document
    baseRequest(user, setUser, history, (accessToken) => {
      fetch('/api/documents/b50762e9-8f9b-4f80-8e31-4d7daf374d46/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        return undefined;
      }).then((data) => {
        if (data !== undefined) {
          setTitleEditorState(() => EditorState.createWithContent(ContentState.createFromText(data.title)));
          setDocumentEditorState(() => EditorState.createWithContent(convertFromRaw(data.editor)));
          setPreviousTitle(data.title);
        }
      });
    });
  }, []);

  useInterval(() => {
    // Start a timer -> to prevent sending a request on every keypress
    //                  this function will only allow requests to be send when
    //                  a key pressing is over or a certain interval is complete
    sendUpdatedTitle();
    sendUpdatedDocument();
  }, REQUEST_TIME_RATE_LIMIT);

  useEffect(() => {
    // Web socket setup
    // 14776d62-411d-421c-b60a-548d5434e403/
    // Using .current to access value stored in reference hook
    
    webSocket.current = new WebSocket('ws://127.0.0.1:8000/ws/document/');

    // Function to run when data received
    webSocket.current.onmessage = (message) => {
      console.log(message);
    };
    return () => webSocket.current.close();


  }, []);

  if (titleEditorState !== null && documentEditorState !== null) {
    return <>
      <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', minHeight: '100%'}}>
        <div className='title-editor-container'>
          <TitleEditor editorState={titleEditorState} setEditorState={setTitleEditorState} />
        </div>
        <div className='text-editor-container'>
          <TextEditor
            editorState={documentEditorState}
            setEditorState={setDocumentEditorState}
            updatedSelection={updatedSelection}
            setUpdatedSelection={setUpdatedSelection}
            sendUpdatedDocument={sendUpdatedDocument}
          />
          <button onClick={sendUpdatedDocument}>Send updated text</button>
        </div>
      </div>
    </>;
  } else {
    return <h1>Loading...</h1>;
  }
}
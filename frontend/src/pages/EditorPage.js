import { useState, useEffect, useContext, useRef } from 'react';
import { ContentState, EditorState } from 'draft-js';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TextEditor from '../components/TextEditor';
import TitleEditor from '../components/TitleEditor';
import { userContext } from '../userContext';
import baseRequest from '../utils//baseRequest';
import useInterval from '../utils/useInterval';

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

  const sendUpdatedTitle = () => {
    // Function to send text in title text box to websocket if text has changed
    if (titleEditorState !== null) {
      // Only send request if connection is open
      if (webSocket.current.readyState === WebSocket.OPEN) {
        const text = titleEditorState.getCurrentContent().getPlainText();
        // Only send text if its changed
        if (previousTitle !== text) {
          webSocket.current.send(JSON.stringify({
            'text': text,
          }));
          setPreviousTitle(text);
        }
      } else {
        // TODO: handle unconnected errors here (prevent typing and show warning)
      }
    }
  };

  useEffect(() => {
    // Fetch document
    baseRequest(user, setUser, history, (accessToken) => {
      fetch('/api/documents/14776d62-411d-421c-b60a-548d5434e403/', {
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
          setTitleEditorState(EditorState.createWithContent(ContentState.createFromText(data.title)));
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

  if (titleEditorState !== null) {
    return <>
      <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
        <div className='title-editor-container'>
          <TitleEditor editorState={titleEditorState} setEditorState={setTitleEditorState} />
        </div>
        <div className='text-editor-container'>
          <TextEditor />
        </div>
      </div>
    </>;
  } else {
    return <h1>Loading...</h1>;
  }
}
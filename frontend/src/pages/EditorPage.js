import { useState, useEffect, useContext, useRef } from 'react';
import { ContentState, EditorState, convertFromRaw } from 'draft-js';
import { useHistory, useLocation  } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TextEditor from '../components/TextEditor';
import TitleEditor from '../components/TitleEditor';
import { userContext } from '../userContext';
import baseRequest from '../utils//baseRequest';
import useInterval from '../utils/useInterval';
import isNull from '../utils/isNull';
import Button from '../components/input/button';

export default function EditorPage(props) {
  const webSocket = useRef(null);

  // Prevent requests being send unless the below time has passed since the last request (websocket)
  const REQUEST_TIME_RATE_LIMIT = 1000;

  // User context
  const { user, setUser } = useContext(userContext);

  // Router
  const history = useHistory();
  const location = useLocation();

  // Document
  const [documents, setDocuments] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);

  // State for managing title input box
  const [titleEditorState, setTitleEditorState] = useState(null);
  const [previousTitle, setPreviousTitle] = useState('');

  // State for managing document editor
  const [documentEditorState, setDocumentEditorState] = useState(null);

  const [sidebarContentMargin, setSidebarContentMargin] = useState(250);
  
  /* State to track data which has been updated locally, but not yet sent to server+other clients
  Schema for this will look like:
    {
      type: str,
      block: str - id of block being updated,
      position: int,
      text: str - if text has been added,
      offset: int - if text is being deleted,
    }
  */
  const [updatedContentStack, setUpdatedContentStack] = useState([]);

  const sendUpdatedTitle = () => {
    // Function to send text in title text box to websocket if text has changed
    if (titleEditorState !== null) {
      // Only send request if connection is open
      if (webSocket.current.readyState === WebSocket.OPEN) {
        const text = titleEditorState.getCurrentContent().getPlainText();
        // Only send text if its changed
        if (previousTitle !== text) {
          webSocket.current.send(JSON.stringify({
            'type': 'update-document-title',
            'body': {
              'title': text,
            },
          }));
          setPreviousTitle(text);

          setDocuments((documents) => {
            // Update document title in documents list (shown in document explorer column)
            var docIndex = documents.map((elem) => elem.id).indexOf(currentDocumentId);
            return [
              ...documents.slice(0, docIndex),
              {
                ...documents[docIndex],
                title: text === '' ? 'Untitled' : text,
              },
              ...documents.slice(docIndex+1),
            ]
          });
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
        if (!isNull(updatedContentStack)) {
          // Only send request if content has been updated
          console.log(updatedContentStack);
          webSocket.current.send(JSON.stringify({
            'type': 'update-document-content',
            'body': {
              'data': updatedContentStack,
            },
          }));
          // Reset
          setUpdatedContentStack([]);
        }
      }
    }
  };

  useEffect(() => {
    baseRequest(user, setUser, history, (accessToken) => {
      fetch('/api/documents/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
      }).then((data) => {
        if (data !== undefined) {
          // Set untitled default text
          for (var i=0; i < data.length; i++) {
            if (data[i].title === '') {
              data[i].title = 'Untitled';
            }
          }
          setDocuments(data);
        }
      });
    })
  }, []);

  const fetchDocument = (id) => {
    // Fetch document
    baseRequest(user, setUser, history, (accessToken) => {
      fetch(`/api/documents/${id}/`, {
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
          setUpdatedContentStack([]);
          setTitleEditorState(() => EditorState.createWithContent(ContentState.createFromText(data.title)));
          setDocumentEditorState(() => EditorState.createWithContent(convertFromRaw(data.editor)));
          setPreviousTitle(data.title);
          setCurrentDocumentId(data.id);
          console.log(data.editor);
          history.push(`/editor/${data.id}`);
        }
      });
    });
  };

  const createNewDocument = () => {
    baseRequest(user, setUser, history, (accessToken) => {
      fetch('/api/documents/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
      }).then((data) => {
        history.push(`/editor/${data.id}`);
        // Give default title
        data.title = 'Untitled';
        setCurrentDocumentId(data.id);
        setDocuments([
          ...documents,
          data
        ]);
      })
    });
    setTitleEditorState(() => EditorState.createEmpty());
    setDocumentEditorState(() => EditorState.createEmpty());
  }; 

  useInterval(() => {
    // Start a timer -> to prevent sending a request on every keypress
    //                  this function will only allow requests to be send when
    //                  a key pressing is over or a certain interval is complete
    sendUpdatedTitle();
    sendUpdatedDocument();
  }, REQUEST_TIME_RATE_LIMIT);

  useEffect(() => {
    // Web socket setup
    // Using .current to access value stored in reference hook
    console.log(currentDocumentId);
    if (currentDocumentId !== null) {
      webSocket.current = new WebSocket(`ws://127.0.0.1:8000/ws/document/${currentDocumentId}/`);

      // Function to run when data received
      webSocket.current.onmessage = (message) => {
        console.log(message);
      };

      return () => webSocket.current.close();
    }
  }, [currentDocumentId]);

  useEffect(() => {
    // Check the URL document id
    const id = location.pathname.split('/')[2];
    if (id !== undefined && id !== '') {
      fetchDocument(id);
      setCurrentDocumentId(id);
    }
  }, []);

  if (documents !== null) {
    return <div>
      {sidebarContentMargin !== 0 && <Sidebar width={270} setSidebarContentMargin={setSidebarContentMargin} >
        {documents.map((document, index) => {
          return <div key={index} style={{padding: '2px 18px'}} onClick={() => fetchDocument(document.id)}>
            <h4 style={{margin: '12px 0', cursor: 'pointer'}}>{document.title}</h4>
          </div>;
        })}
        <div style={{padding: '12px 18px'}}>
          <Button text='New page' onClick={createNewDocument} />
        </div>
      </Sidebar>}
      
      <div style={{marginLeft: `${sidebarContentMargin !== 0 ? sidebarContentMargin: 0}px`}}>
        <Header documentTitle={titleEditorState !== null ? titleEditorState.getCurrentContent().getPlainText() : ''} sidebarOpen={sidebarContentMargin!==0} toggleSidebar={() => setSidebarContentMargin(270)} />
      </div>

      {( titleEditorState !== null && documentEditorState !== null) ?
        <div style={{marginLeft: `${sidebarContentMargin}px`}}>
          <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', minHeight: '100%'}}>
            <div className='title-editor-container'>
              <TitleEditor editorState={titleEditorState} setEditorState={setTitleEditorState} />
            </div>
            <div className='text-editor-container'>
              <TextEditor
                editorState={documentEditorState}
                setEditorState={setDocumentEditorState}
                updatedContentStack={updatedContentStack}
                setUpdatedContentStack={setUpdatedContentStack}
                sendUpdatedDocument={sendUpdatedDocument}
              />
            </div>
          </div>
        </div>
        :
        <h1>Loading...</h1>
      }
    </div>;
  } else {
    return <h1>Loading...</h1>;
  }
}
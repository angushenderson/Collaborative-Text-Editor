import { useState, useEffect, useContext, useRef } from 'react';
import { ContentState, EditorState, convertFromRaw, Modifier, SelectionState } from 'draft-js';
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

export default function EditorPage() {
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
  const [documentCollaborators, setDocumentCollaborators] = useState(null);
  const [authenticationTicket, setAuthenticationTicket] = useState(null);

  // State for managing title input box
  const [titleEditorState, setTitleEditorState] = useState(null);
  const [previousTitle, setPreviousTitle] = useState('');

  // State for managing document editor
  const [documentEditorState, setDocumentEditorState] = useState(null);
  const documentEditorStateRef = useRef();
  documentEditorStateRef.current = documentEditorState;

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
    if (titleEditorState !== null && webSocket.current !== null) {
      // Only send request if connection is open
      if (webSocket.current.readyState === WebSocket.OPEN) {
        const text = titleEditorState.getCurrentContent().getPlainText();
        // Only send text if its changed
        if (previousTitle !== text && user.permission < 2) {
          baseRequest(user, setUser, history, (access_token) => {
            webSocket.current.send(JSON.stringify({
              'type': 'update_document_title',
              'access_token': access_token,
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
          });
        }
      } else {
        // TODO: handle unconnected errors here (prevent typing and show warning)
      }
    }
  };

  const sendUpdatedDocument = () => {
    // Function to send the text which has been updated to server via open websocket
    if (documentEditorState !== null && webSocket.current !== null) {
      if (webSocket.current.readyState === WebSocket.OPEN) {
        if (!isNull(updatedContentStack)) {
          // Only send request if content has been updated
          baseRequest(user, setUser, history, (access_token) => {
            webSocket.current.send(JSON.stringify({
              'type': 'update_document_content',
              'access_token': access_token,
              'body': {
                'data': updatedContentStack,
              },
            }));
            // Reset
            setUpdatedContentStack([]);
          });
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
          console.log("DOCUMENTS", data);
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
          console.log(data);
          setTitleEditorState(() => EditorState.createWithContent(ContentState.createFromText(data.title)));
          setDocumentEditorState(() => EditorState.createWithContent(convertFromRaw(data.editor)));
          setCurrentDocumentId(data.id);
          setAuthenticationTicket(data.authentication_ticket);
          setPreviousTitle(data.title);
          setUpdatedContentStack([]);
          setDocumentCollaborators(data.collaborators);
          setUser((user) => ({...user, permission: data.permission, permission_level: data.permission_level}));
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
    const state = EditorState.createEmpty();
    setDocumentEditorState(state);
    setUpdatedContentStack([{
      type: 'insert',
      block: state.getCurrentContent().getBlocksAsArray()[0].getKey(),
      position: 0,
      text: '',
    }]);
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
    if (currentDocumentId !== null && authenticationTicket !== null) {
      webSocket.current = new WebSocket(`ws://127.0.0.1:8000/ws/document/${currentDocumentId}/?${authenticationTicket}`);

      // Function to run when data received
      webSocket.current.onmessage = (message) => {
        handleWebSocketMessage(message);
      };

      return () => webSocket.current.close();
    }
  }, [currentDocumentId, authenticationTicket]);

  const handleWebSocketMessage = (message) => {
    const data = JSON.parse(message.data);

    switch (data.type) {
      case 'add_new_collaborators':
        setDocumentCollaborators(collaborators => [...collaborators, data.body]);
        break;

      case 'update_document_content':
        var newEditorState = documentEditorStateRef.current;
        for (var i=0; i < data.body.data.length; i++) {
          const update = data.body.data[i];
          
          switch (update.type) {
            case 'insert':
              const new_selection = new SelectionState({
                anchorKey: update.block,
                focusKey: update.block,
                anchorOffset: update.position,
                focusOffset: update.position,
              });

              const newContentState = Modifier.insertText(newEditorState.getCurrentContent(), new_selection, update.text, null);
              newEditorState = EditorState.push(newEditorState, newContentState, 'insert-characters');
          }
        }

        setDocumentEditorState(newEditorState);
        break;

      case 'update_document_title':
        // console.log('update_document_title', data.sender_user_id, user.id);
        // if (data.sender_user_id !== user.id) {
        setPreviousTitle(data.body.title);
        setTitleEditorState(EditorState.push(titleEditorState, ContentState.createFromText(data.body.title)));
        setDocuments((documents) => {
          // Update document title in documents list (shown in document explorer column)
          var docIndex = documents.map((elem) => elem.id).indexOf(currentDocumentId);
          return [
            ...documents.slice(0, docIndex),
            {
              ...documents[docIndex],
              title: data.body.title === '' ? 'Untitled' : data.body.title,
            },
            ...documents.slice(docIndex+1),
          ]
        });
        // }
        break;
    }
  }

  useEffect(() => {
    // Check the URL document id
    const id = location.pathname.split('/')[2];
    if (id !== undefined && id !== '') {
      fetchDocument(id);
      setCurrentDocumentId(id);
    }
  }, []);

  const editorRenderArea = () => {
    if (currentDocumentId) {
      return <div style={{marginLeft: `${sidebarContentMargin}px`}}>
        {( titleEditorState !== null && documentEditorState !== null) ?
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
        :
        <h1 style={{marginLeft: '20px'}}>Loading...</h1>
      }</div>;
    } else {
      return <div style={{marginLeft: `${sidebarContentMargin + 20}px`, display: 'flex', justifyContent: 'center', marginRight: '0px'}}>
        <div style={{maxWidth: '500px'}}>
          <h2>Select a document to get started, or create a new one!</h2>
          <Button text='New page' onClick={createNewDocument} />
        </div>
      </div>
    }
  }

  if (documents !== null) {
    const myDocuments = documents.filter(document => document.permission === 0);
    const sharedWithMeDocuments = documents.filter(document => document.permission !== 0);

    return <div>
      {sidebarContentMargin !== 0 && <Sidebar width={270} setSidebarContentMargin={setSidebarContentMargin} >
        <div style={{padding: '2px 18px'}}>
          <h3>My Documents</h3>
          <hr />
        </div>
        {myDocuments.map((document, index) => {
          return <div key={index} style={{padding: '2px 18px'}} onClick={() => fetchDocument(document.id)}>
            <h4 style={{margin: '12px 0', cursor: 'pointer'}}>{document.title}</h4>
          </div>;
        })}
        <div style={{padding: '12px 18px'}}>
          <Button text='New page' onClick={createNewDocument} />
        </div>
        {sharedWithMeDocuments.length !== 0 && <div style={{padding: '2px 18px'}}>
          <h3>Shared with me</h3>
          <hr />
        </div>}
        {sharedWithMeDocuments.map((document, index) => {
          return <div key={index} style={{padding: '2px 18px'}} onClick={() => fetchDocument(document.id)}>
            <h4 style={{margin: '12px 0', cursor: 'pointer'}}>{document.title}</h4>
          </div>;
        })}
      </Sidebar>}
      
      <div style={{marginLeft: `${sidebarContentMargin !== 0 ? sidebarContentMargin: 0}px`, position: 'sticky', top: '0px', background: '#101010', zIndex: '10', height: '64px'}}>
        <Header
          documentTitle={titleEditorState !== null ? titleEditorState.getCurrentContent().getPlainText() : ''}
          sidebarOpen={sidebarContentMargin!==0}
          toggleSidebar={() => setSidebarContentMargin(270)}
          documentCollaborators={documentCollaborators}
          setDocumentCollaborators={setDocumentCollaborators}
          documentId={currentDocumentId}
          websocket={webSocket}
        />
      </div>
        
      {editorRenderArea()}
    </div>;
  } else {
    return <h1>Loading...</h1>;
  }
}
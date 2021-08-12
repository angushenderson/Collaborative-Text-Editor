import { useRef, useState, useContext } from 'react';
import Button from '../../components/input/button';
import baseRequest from '../../utils/baseRequest';
import { userContext } from '../../userContext';

export default function SetProfilePhotoPage(props) {
  // Page to allow user to upload a profile picture
  const uploadedImage = useRef(null);
  const imageUploader = useRef(null);
  const [image, setImage] = useState(null);

  const { user, setUser } = useContext(userContext);

  const handleImageUpload = e => {
    // For handling storing and representing image in frontend -
    //     no http logic is conducted here!
    const [file] = e.target.files;
    if (file) {
      const reader = new FileReader();
      const {current} = uploadedImage;
      current.file = file;
      reader.onload = (e) => {
          current.src = e.target.result;
      }
      reader.readAsDataURL(file);
      setImage(file);
    }
  };

  const submitForm = () => {
    // Send put request with image
    let formData = new FormData();
    formData.append('profile_picture', image);
    
    baseRequest(user, setUser, () => {
      fetch('/api/auth/my-account/', {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${user.Authorization.access}`},
        body: formData,
      }).then(response => response.json())
      .then(data => {
        console.log(data);
        setUser({...user, profile_picture: data['profile_picture']});
      });
    });
  };
   
  return <div className='form-container' style={{'maxWidth': '450px'}}>
    <h1>Upload a profile picture.</h1>
    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      ref={imageUploader}
      style={{
        display: "none"
      }}
    />
    <div
      style={{
        height: "180px",
        width: "180px",
        border: "none",
        flex: "0 0 100%",
        margin: '24px',
      }}
      onClick={() => imageUploader.current.click()}
    >
      <div style={{
          width: '180px',
          height: '180px',
          display: 'block',
          margin: '0 auto',
          position: 'relative'
        }}
        className='upload-image'
      >
        <img
          ref={uploadedImage}
          style={{
            width: '180px',
            height: '180px',
            display: 'block',
            margin: '0 auto',
            borderRadius: '50%',
            border: 'none',
          }}
          src={user['profile_picture']}
        />
        <div className='image-overlay'>Upload image!</div>
      </div>
    </div>
    <Button text={uploadedImage === null ? 'Skip' : 'Complete setup'} onClick={submitForm}/>
  </div>;
}
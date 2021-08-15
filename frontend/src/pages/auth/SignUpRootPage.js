import RegisterPage from './RegisterPage';
import SetProfilePhotoPage from './SetProfilePhotoPage';

export default function SignUpRootPage (props) {
  // Root page to control flow through signup
  // signupPhase props refers to which page to show, fetched from signup_phase attribute
  //    in userContext. Should be 0 if that key doesn't exist. Last page in signup flow will
  //    remove this field to denote that flow has been completed.

  return [
    <RegisterPage />,
    <SetProfilePhotoPage />,
  ][props.signupPhase];
}
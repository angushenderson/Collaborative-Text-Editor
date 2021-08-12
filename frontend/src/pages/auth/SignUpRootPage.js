import { useState } from 'react';
import RegisterPage from './RegisterPage'; 
import SetProfilePhotoPage from './SetProfilePhotoPage';

// Component to handle entire signup flow
export default function SignUpRootPage(props) {
  const [currentSignupPhase, setCurrentSignupPhase] = useState(0);

  const nextSignupPhase = () => {
    setCurrentSignupPhase(currentSignupPhase + 1);
  }

  const signup_phases = {
    0: <RegisterPage nextSignupPhase={nextSignupPhase} />,
    1: <SetProfilePhotoPage nextSignupPhase={nextSignupPhase} />
  };

  return signup_phases[currentSignupPhase]; 
  // return signup_phases[1];
}
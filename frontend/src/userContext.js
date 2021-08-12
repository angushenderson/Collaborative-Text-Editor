// User context for managing the authorized user
import { createContext } from 'react';

// Setting default values
// user value should have Authorization key with access and refresh tokens as children
const userContext = createContext({user: {}, setUser: () => {}});

export { userContext };
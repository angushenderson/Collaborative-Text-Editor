import { BrowserRouter, Route, Switch } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path='/signup' component={RegisterPage} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;

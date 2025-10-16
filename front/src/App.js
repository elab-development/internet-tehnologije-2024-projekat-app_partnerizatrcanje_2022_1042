import logo from './logo.svg';
import './App.css';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import RunEvents from './pages/RunEvents';

function App() {
  return (
     <>
     <RunEvents></RunEvents>
     <Login></Login>
      <Register></Register>
      <Home></Home>
     
     </>
  );
}

export default App;

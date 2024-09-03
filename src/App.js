import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RegisteredNumber from './Components/registeredNumber/RegisteredNumber';
import Login from './Components/login/Login';
import HomeNavbar from './Components/navbar/Navbar';
import SuperadminDashboard from './pages/SuperadminDashboard';
import Home from './pages/Home';
import Blocklist from './pages/Blocklist';
import Profile from './pages/Profile';
import HodPhoneBook from './pages/HodPhoneBook';
import CEOphoneBook from './pages/CEOphoneBook';
import Allusers from './pages/Allusers';
import LeadConverted from './pages/LeadConverted';
import RegisterUser from './pages/RegisterUser';
import GenerateReport from './pages/GenerateReport';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/createuser' element={<RegisterUser />} />
          <Route path='/superadmindashboard' element={<SuperadminDashboard />} />
          <Route path='/home' element={<Home />} />
          <Route path='/generatereport' element={<GenerateReport />} />
          <Route path='/blocklist' element={<Blocklist />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/hodphonebook' element={<HodPhoneBook />} />
          <Route path='/ceophonebook' element={<CEOphoneBook />} />
          <Route path='/allusers' element={<Allusers />} />
          <Route path='/leadconverted' element={<LeadConverted />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;

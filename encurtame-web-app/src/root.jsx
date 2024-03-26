import { AppBar, Toolbar, Button } from '@mui/material';
import { Outlet } from 'react-router-dom';
import './root.css'
export default function RootLayout() {
  return (
    <>
      <AppBar position="static" className='encurtame-app-bar'>
        <Toolbar className="encurtarme-top-toolbar" variant="dense">
          <Button  color="inherit" href="/">
            Home
          </Button>
          <Button className="register-nav-button" color="inherit" href="/">
            Login
          </Button>
          <Button className="register-nav-button" color="inherit" href="/register">
            Register
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </>
  )
}
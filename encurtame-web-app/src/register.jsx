import { Button, Stack, TextField } from '@mui/material';
import { Form, useNavigate } from 'react-router-dom';
import './register.css'
export default function RegisterPage() {
  const navigate = useNavigate();

  const onsubmit = (e) => {
    e.preventDefault();
    let email = document.getElementsByName('email')[0].value;
    let password = document.getElementsByName('password')[0].value;

    navigate('/', { state: { email } });
  }

  return (
    <Form>
      <div className='encurtame-register-div'>
        <TextField name="email" variant="outlined" type="email" className="register" placeholder="Email" />
        <TextField name="password" variant="outlined" type="password" className="register" placeholder="Password" />
        <Button variant="contained" type="submit" className="register" onClick={onsubmit}>Register</Button>
      </div>
    </Form>
  )
}
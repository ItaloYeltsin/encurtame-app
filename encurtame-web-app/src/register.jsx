import { Button, TextField  } from '@mui/material';
import { Form, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './register.css';
import { Overlay } from './components/overlay';
export default function RegisterPage() {
  const navigate = useNavigate()


  const apiURL = import.meta.env.VITE_API_URL

  //setup states
  const [loading, setLoading] = useState(false)
  const [validationErr, setValidationErr] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formSuccessMessage, setFormSuccessMessage] = useState("")
  const [formData, setFormData] = useState({});

  const handleInput = (e) => {
    setValidationErr(false)
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    console.log(e.target.value);
    setFormData((prevState) => ({
      ...prevState,
      [fieldName]: fieldValue
    }));
  }

  const submitForm = (e) => {
    // We don't want the page to refresh
    e.preventDefault()
    setLoading(true)
    // POST the data to the URL of the form
    fetch(`${apiURL}user` ?? '', {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    })
    .then((response) => {
      setLoading(false)
      if (response.status === 409) {
        setValidationErr(true)
      }

      if (response.status === 201) {
        let data = response.json()
        setFormData({})
        setFormSuccess(true)
        navigate('/')
      }

    })
      .catch((error) => {
        setLoading(false)
        console.error('Error:', error);
      })
  }
  return (
    <Form onSubmit={submitForm}>
      <div className='encurtame-register-div'>
      {validationErr?
        <TextField name="email" error helperText="Email already exists" variant="outlined" label="Email" type="email" className="register" placeholder="Email" onChange={handleInput} />
        :
        <TextField name="email" variant="outlined" label="Email" type="email" className="register" placeholder="Email" onChange={handleInput} />
        }
        <TextField name="password" variant="outlined" label="Password" type="password" className="register" placeholder="Password" onChange={handleInput} />
        <Button variant="contained" type="submit" className="register">Register</Button>
      </div>
      {loading && <Overlay/>}
    </Form>

  )
}
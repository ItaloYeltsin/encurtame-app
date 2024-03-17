import { useState,  } from 'react'
import { Form, useNavigate, useLocation } from 'react-router-dom'
import { TextField, Button, Stack } from '@mui/material'


export default function Home() {
  const navigate = useNavigate();
  let message = null;

  const apiURL = import.meta.env.VITE_API_URL
  const webAppURL = import.meta.env.VITE_WEB_APP_URL
  const [formSuccess, setFormSuccess] = useState(false)
  const [formSuccessMessage, setFormSuccessMessage] = useState("")
  const [formData, setFormData] = useState({
    url: ""
  });

  const handleInput = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    console.log(e.target.value);
    setFormData((prevState) => ({
      ...prevState,
      [fieldName]: fieldValue
    }));
  }

  const copyToClipBoard = () => {
    navigator.clipboard.writeText(formSuccessMessage)
    // set button text to "copied!"
    const value = (document.getElementsByName("shortUrl")[0]).value
    document.getElementsByName("copyButton")[0].innerText = "copied!"
  }

  const submitForm = (e) => {
    // We don't want the page to refresh
    e.preventDefault()

    let data = {
      url: document.getElementsByName('url')[0].value
    };

    // POST the data to the URL of the form
    fetch(apiURL ?? '', {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    }).then((response) => response.json())
      .then((data) => {
        setFormData({
          url: ""
        })

        setFormSuccess(true)
        navigate('/show-link', { state: { url: `${webAppURL}${data.id}` } });
      })
  }

  return (
    <div>
      <Form method="POST" onSubmit={submitForm} action='/show-link'>
        <div className="encurtame-div">
          <TextField className='encurtame-input encurtame-item' type="text" placeholder="https://my-long-website-link.com/and-more-..." onChange={handleInput} name='url' />
          <Button className='encurtame-button' variant="contained" type="submit">Encurtar</Button>
        </div>
      </Form>
    </div>
  )
}

import { Form, useLocation } from 'react-router-dom'
import { TextField, Button, Stack } from '@mui/material'
import './home.css'

export default function ShowLinkPage(props) {
  const location = useLocation();
  let { url } = location.state

  const copyToClipBoard = () => {
    navigator.clipboard.writeText(url)
    // set button text to "copied!"
    const value = (document.getElementsByName("shortUrl")[0]).value
    document.getElementsByName("copyButton")[0].innerText = "copied!"
  }

  return (
    <div className='encurtame-div'>
      <TextField name='shortUrl' className='encurtame-input encurtame-item' type="text" value={url}/>
      <Button name="copyButton" className='encurtame-button' variant="contained" onClick={copyToClipBoard}>Copy</Button>
    </div>
  )
}

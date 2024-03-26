import { CircularProgress } from '@mui/material';
import './overlay.css';

export function Overlay() {
  return (
    <div className='overlay'>
      <CircularProgress  className='encurtame-loading-indicator'/>
    </div >
    )
}
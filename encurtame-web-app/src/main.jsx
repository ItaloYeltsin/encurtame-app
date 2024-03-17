import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"
import Home from './home.jsx'
import RootLayout from './root.jsx'
import RegisterPage from './register.jsx'
import RedirectPage from './redirect.jsx'
import ShowLinkPage from './show-link.jsx'
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout/>,
    children: [
      {
        path: "/",
        element: <Home/>,
      },
      {
        path: "/register",
        element: <RegisterPage/>,
      },
      {
        path: "/show-link",
        element: <ShowLinkPage/>,
      },
    ]
  },
  {
    path: "/:shortId",
    element: <RedirectPage/>,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

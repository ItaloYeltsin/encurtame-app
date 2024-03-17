import { useLayoutEffect } from "react";

export default function RedirectPage() {
  const apiURL = import.meta.env.VITE_API_URL
  const id = document.location.pathname.replace("/", "");

  useLayoutEffect(() => {

    fetch(`${apiURL}${id}`, {
      method: "GET",
    }).then((response) => {
      return response.json()
      })
      .then((data) => {
        window.location.href = data.url
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  });
  return (
    <div></div>
  )
}
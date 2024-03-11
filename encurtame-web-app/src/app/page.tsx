'use client'
import Image from "next/image";
import { useState } from "react";

export default function Home() {

  const [formData, setFormData] = useState({
    url: ""
  });

  const [formSuccess, setFormSuccess] = useState(false)
  const [formSuccessMessage, setFormSuccessMessage] = useState("")

  const handleInput = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    setFormData((prevState) => ({
      ...prevState,
      [fieldName]: fieldValue
    }));
  }

  const copyToClipBoard = (e) => {
    navigator.clipboard.writeText(formSuccessMessage)
    // set button text to "copied!"
    const value = document.getElementsByName("shortUrl")[0].value
    document.getElementsByName("copyButton")[0].innerText = "copied!"
  }

  const submitForm = (e) => {
    // We don't want the page to refresh
    e.preventDefault()

    const formURL = e.target.action

    // POST the data to the URL of the form
    fetch(formURL, {
      method: "POST",
      body: JSON.stringify(formData),
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
        setFormSuccessMessage(`${window.location.href}${data.id}`)
      })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/encurtame.png"
          alt="Encurtame logo"
          width={400}
          height={37}
          priority
        />
      </div>
      <div className="flex min-h-screen flex-col items-center p-24 w-screen">
        {formSuccess ?
          <div className="flex flex-row w-1/2">
            <input name="shortUrl" value={formSuccessMessage} className="mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
            <button name="copyButton" onClick={() => {copyToClipBoard()}} className="text-white bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:focus:ring-yellow-900" type="submit">copy!</button>
          </div>
          :
          <form className="flex flex-row items-center w-1/2" method="POST"  action="https://2alp7i82r8.execute-api.us-east-1.amazonaws.com/Dev/url" onSubmit={submitForm}>
              <input type="text" name="url" onChange={handleInput} value={formData.url} className="mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
              <button className="w-200 text-white bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:focus:ring-yellow-900" type="submit">
                shorten!
              </button>
          </form>
        }
      </div>
    </main>
  );
}

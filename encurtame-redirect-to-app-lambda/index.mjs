
export const handler = async (event) => {
  return {
    statusCode: 301,
    headers: {
      "Location": `${process.env.WEB_APP_URL}`
    }
  }
}

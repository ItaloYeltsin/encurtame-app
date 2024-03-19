export function allowCorsConfig (responseObject) {
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      ...responseObject.headers
    },
    ...responseObject
  }
}

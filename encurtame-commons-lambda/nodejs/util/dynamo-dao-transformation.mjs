export function transformfromDynamo (entity) {
  if (!entity) {
    return null
  }
  const obj = {}
  Object.keys(entity).forEach(key => {
    if (entity[key].S) {
      obj[key] = entity[key].S
    }
  })
  return obj
}

export function transformToDynamo (entity) {
  const obj = {}
  Object.keys(entity).forEach(key => {
    obj[key] = { S: entity[key] }
  })
  return obj
}

import bcrypt from 'bcrypt'

const saltRounds = 5

export async function passEncrypt (plainText) {
  return bcrypt.hash(plainText, saltRounds)
}

export async function passCompare (plainText, hash) {
  return bcrypt.compareSync(plainText, hash)
}

import { passEncrypt, passCompare } from './encryption.mjs'

test('encrypt and compare', async () => {
  const plainText = '@Password123456'
  const encrypted = await passEncrypt(plainText)
  expect(encrypted).not.toBe(plainText)
  expect(await passCompare(plainText, encrypted)).toBe(true)
})

import { expect, test } from '@jest/globals'
import { UserService } from './user-service.mjs'
import { passCompare } from '../util/encryption.mjs'

let mockedUserRepository
let userService
const mockedDynamoUser = {
  id: 'example-id',
  email: 'email@example',
  password: 'password'
}

// initialize mocks
beforeEach(() => {
  mockedUserRepository = {
    retrieve: jest.fn().mockResolvedValue(mockedDynamoUser),
    save: jest.fn().mockResolvedValue(mockedDynamoUser)
  }
  userService = new UserService(mockedUserRepository)
})

test('get user', async () => {
  const user = await userService.get('email@example')
  expect(user).toEqual({
    id: mockedDynamoUser.id,
    email: mockedDynamoUser.email,
    password: mockedDynamoUser.password
  })
})

test('insert user', async () => {
  const user = {
    email: mockedDynamoUser.email,
    password: mockedDynamoUser.password
  }
  const insertedUSer = await userService.insert(user)
  // insertedUSer should not contain password
  expect(insertedUSer).toEqual({
    id: mockedDynamoUser.id,
    email: mockedDynamoUser.email
  })
  // caputre ags
  const userToBeSaved = mockedUserRepository.save.mock.calls[0][0]
  expect(userToBeSaved.email).toBe(mockedDynamoUser.email)
  expect(userToBeSaved.password).not.toBe(mockedDynamoUser.password)
  expect(userToBeSaved.id).not.toBe(mockedDynamoUser.id)

  // check password encryption
  await expect(passCompare(mockedDynamoUser.password, userToBeSaved.password)).resolves.toBe(true)
})

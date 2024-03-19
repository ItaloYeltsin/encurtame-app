import { expect, test, jest } from '@jest/globals'

import { UserDynamoRepository } from './user-dynamo-repository.mjs'
import { ConflictingResourceException } from '../exception/conflicting-resource-exception.mjs'

const mockedModule = {
  send: jest.fn().mockResolvedValue({})
}

const mockedDynamoUser = {
  id: { S: 'example-id' },
  email: { S: 'email@example' },
  password: { S: 'password' }
}

const mockedApplicationUser = {
  id: 'example-id',
  email: 'email@example',
  password: 'password'
}

let userRepositoryUnderTest

// initialize mocks
beforeEach(() => {
  mockedModule.send.mockClear()

  mockedModule.send
    .mockResolvedValueOnce({ Items: [] })
    .mockResolvedValue({ Item: mockedDynamoUser })
  userRepositoryUnderTest = new UserDynamoRepository()
  userRepositoryUnderTest.client = mockedModule
})

test('get user', async () => {
  mockedModule.send.mockClear()
  mockedModule.send.mockReset()
  mockedModule.send.mockResolvedValue({ Items: [mockedDynamoUser] })
  const user = await userRepositoryUnderTest.retrieve(mockedApplicationUser)
  expect(user).toEqual([mockedApplicationUser])
})

test('insert user', async () => {
  const user = await userRepositoryUnderTest.save(mockedApplicationUser)

  // caputre ags from second call
  const userToBeSent = mockedModule.send.mock.calls[1][0].input.Item
  expect(userToBeSent.id.S).toBe(mockedApplicationUser.id)
  expect(userToBeSent.email.S).toBe(mockedApplicationUser.email)
  expect(userToBeSent.password.S).toBe(mockedApplicationUser.password)
})

test('test already exists', async () => {
  mockedModule.send.mockReset()
  mockedModule.send.mockResolvedValue({ Items: [mockedDynamoUser] })
  await expect(userRepositoryUnderTest.save(mockedApplicationUser)).rejects.toThrowError(ConflictingResourceException)
})

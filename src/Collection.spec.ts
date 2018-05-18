import { isSizedCollection, getSize } from './Collection'

describe('isSizedCollection', () => {
  it('determines if a collection has size or length', () => {
    const arr = [1, 2, 3]
    const map = new Map([[1, 2], [3, 4]])
    expect(isSizedCollection(arr)).toBeTruthy()
    expect(isSizedCollection(map)).toBeTruthy()
  })
})

describe('getSize', () => {
  it('gets the size of a collection', () => {
    const arr = [1, 2, 3]
    const map = new Map([[1, 2], [3, 4]])
    expect(getSize(arr)).toBe(3)
    expect(map).toBe(2)
  })
})

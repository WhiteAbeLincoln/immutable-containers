import { List } from './List'
import { drop, length, take } from './operators'
import { equals } from '../../Prelude'

describe('take', () => {
  it('should give a prefix of length n', () => {
    const prefix = [1, 2, 3]
    const xs = List.from([...prefix, 4, 5])
    const first3 = take(prefix.length)(xs)
    expect(first3.length).toBe(3)
    expect(length(first3)).toBe(3)
    expect(
      equals(
        first3,
        List.from(prefix)
      )
    ).toBeTruthy()
  })

  it('should give the original list if n >= length xs', () => {
    const xs = List.of(1, 2, 3)
    const took = take(10)(xs)
    expect(equals(
      took,
      xs
    )).toBeTruthy()
  })

  it('should give the empty list if n < 1', () => {
    expect(length(take(-5)(List.of(1, 2, 3)))).toBe(0)
    expect([...take(-5)(List.of(1, 2, 3))]).toEqual([])
  })
})

describe('drop', () => {
  it('should give an empty list when n > length xs', () => {
    const xs = List.of(1, 2, 3)
    expect(length(drop(4)(xs))).toBe(0)
  })

  it('should only drop n items', () => {
    const xs = List.of(1, 2, 3)
    expect(length(drop(1)(xs))).toBe(2)
  })

  it('should drop items from the front of the list', () => {
    expect(
      equals(
        drop(1)(List.of(1, 2, 3)),
        List.of(2, 3)
      )
    ).toBeTruthy()
  })
})

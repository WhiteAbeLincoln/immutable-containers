import { List } from './List'
import { drop, length } from './operators'
import { equals } from '../../Prelude'

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

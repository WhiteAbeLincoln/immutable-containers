import { List } from './List'
import { drop, length, take, cons, append,
  head, last, tail, init, empty, map,
  reverse, intersperse, intercalate,
  concat, transpose, subsequences, permutations,
  concatMap, iterate, repeat, replicate, cycle,
  unfoldr, takeWhile, zipN } from './operators'
import { equals } from '../../Prelude'
import { some, Option, none } from 'fp-ts/lib/Option'

describe('cons', () => {
  const x = 1
  const xs = List.of(2, 3, 4)
  const newList = cons(x)(xs)
  it('creates a new list with x prefixed to xs', () => {
    expect([...newList]).toEqual([1, 2, 3, 4])
  })

  it('creates a new list with length length(xs) + 1', () => {
    expect(newList).toHaveLength(xs.length + 1)
  })
})

describe('append', () => {
  const xs = List.of(1, 2)
  const ys = List.of(3, 4)
  const newList = append(xs)(ys)
  it('creates a new list with ys appended to xs', () => {
    expect([...newList]).toEqual([1, 2, 3, 4])
  })

  it('creates a new list with length length(xs) + length(ys)', () => {
    expect(newList).toHaveLength(xs.length + ys.length)
  })
})

describe('head', () => {
  const xs = List.of(1, 2, 3, 4)
  const first = head(xs)

  it('gets the first element of a non-empty list', () => {
    expect(first).toBe(xs.get(0))
  })

  it('throws on an empty list', () => {
    expect(() => head(List.zero())).toThrow()
  })
})

describe('last', () => {
  const xs = List.of(1, 2, 3, 4)
  const end = last(xs)

  const xxxxxxxxxxxxxxxxxxs = List.from(function*() {
    while (true) yield 1
  })

  it('gets the last element of a non-empty list', () => {
    expect(end).toBe(4)
  })

  it('throws on an infinite list', () => {
    expect(() => last(xxxxxxxxxxxxxxxxxxs)).toThrow()
  })

  it('throws on an empty list', () => {
    expect(() => last(List.zero())).toThrow()
  })
})

describe('tail', () => {
  const xs = List.of(1, 2, 3, 4)
  const end = tail(xs)

  it('gets the tail of a non-empty list', () => {
    expect(equals(end, List.of(2, 3, 4))).toBeTruthy()
  })

  it('throws on a empty list', () => {
    expect(() => tail(List.zero())).toThrow()
  })
})

describe('init', () => {
  const xs = List.of(1, 2, 3, 4)
  const first = init(xs)

  it('gets the init of a non-empty list', () => {
    expect(equals(first, List.of(1, 2, 3))).toBeTruthy()
  })

  it('throws on an empty list', () => {
    expect(() => init(List.zero())).toThrow()
  })
})

describe('length', () => {
  it('gets the length of a finite list', () => {
    expect(length(List.of(1, 2, 3, 4))).toBe(4)
  })
})

describe('empty', () => {
  it('gives true when xs is empty', () => {
    expect(empty(List.zero())).toBeTruthy()
  })

  it('gives false when xs is non-empty', () => {
    expect(empty(List.of(1, 2, 3))).toBeFalsy()
  })
})

describe('map', () => {
  it('maps a function over the list xs', () => {
    expect([...map((n: number) => n + 1)(List.of(1, 2, 3, 4))]).toEqual([2, 3, 4, 5])
  })
})

describe('reverse', () => {
  const base = [1, 2, 3, 4]
  const rbase = [...base].reverse()
  const list = List.from(base)
  const ilist = List.from(function*() { while (true) yield 1 })

  it('reverses a list', () => {
    expect([...reverse(list)]).toEqual(rbase)
  })

  it('throws on an infinite list', () => {
    expect(() => reverse(ilist)).toThrow()
  })
})

describe('intersperse', () => {
  const list = List.of('a', 'b', 'c')
  const sperse = intersperse(',')(list)

  it('intersperses items between a list', () => {
    expect([...sperse]).toEqual(['a', ',', 'b', ',', 'c'])
  })

  it('gives a length of 2 * length(xs) - 1', () => {
    expect(sperse).toHaveLength(2 * list.length - 1)
  })
})

describe('intercalate', () => {
  const xss = List.of(List.of('a', 'b', 'c'), List.of('d', 'e', 'f'))
  const xs = List.of('|', '|')
  const terc = intercalate(xs)(xss)
  const final = ['a', 'b', 'c', '|', '|', 'd', 'e', 'f']

  it('intercalates the list', () => {
    expect([...terc]).toEqual(final)
  })

  it('is equivalent to concat(intersperse(xs)(xss))', () => {
    expect([...terc]).toEqual([...concat(intersperse(xs)(xss))])
  })

  it('gives a list with the correct length', () => {
    expect(terc).toHaveLength(final.length)
  })
})

describe('transpose', () => {
  it('transposes the rows and columns of its argument', () => {
    const xss = List.of(List.of(1, 2, 3), List.of(4, 5, 6))
    const trans = transpose(xss)
    const out = List.of(List.of(1, 4), List.of(2, 5), List.of(3, 6))
    expect(equals(trans, out)).toBeTruthy()
  })

  it('skips elements if some rows are shorter than following rows', () => {
    const xss = List.of(List.of(10, 11), List.of(20), List.zero(), List.of(30, 31, 32))
    const trans = transpose(xss)
    const out = List.of(List.of(10, 20, 30), List.of(11, 31), List.of(32))
    expect(equals(trans, out)).toBeTruthy()
  })
})

describe('subsequences', () => {
  it('gives a list of all subsequences of the argument', () => {
    const xs = List.from('abc')
    const sub = subsequences(xs)
    const out = List.of(
      List.zero(),
      List.from('a'),
      List.from('b'),
      List.from('ab'),
      List.from('c'),
      List.from('ac'),
      List.from('bc'),
      List.from('abc')
    )

    expect(equals(sub, out)).toBeTruthy()
  })
})

describe('permutations', () => {
  const xs = List.from('abc')
  const per = permutations(xs)
  const out = List.of(
    List.from('abc'),
    List.from('bac'),
    List.from('cba'),
    List.from('bca'),
    List.from('cab'),
    List.from('acb')
  )

  it('gives a list of all permutations of the argument', () => {
    expect(equals(per, out)).toBeTruthy()
  })

  it('gives a list of length n!', () => {
    expect(per).toHaveLength(3 * 2 * 1)
  })
})

describe('concat', () => {
  const xs = List.of(List.from('abc'), List.from('def'))
  const con = concat(xs)
  const out = List.from('abcdef')

  it('flattens a list of lists', () => {
    expect(equals(con, out)).toBeTruthy()
  })
})

describe('concatMap', () => {
  const xs = List.of(1, 2, 3, 4, 5, 6)
  const con = concatMap((a: number) => List.of(a.toString()))(xs)
  const out = List.from('123456')

  it('maps and flattens the final list', () => {
    expect(equals(con, out)).toBeTruthy()
  })
})

describe('iterate', () => {
  const x = 0
  const f = (num: number) => num + 1
  const nat = iterate(f)(x)

  it('returns an infinite list', () => {
    expect(nat).toHaveLength(Infinity)
  })

  it('returns a list of repeated applications of f to x', () => {
    expect([...take(5)(nat)]).toEqual([0, 1, 2, 3, 4])
  })
})

describe('repeat', () => {
  it('returns an infinite list with x the value of every element', () => {
    const rep = repeat(5)
    expect(rep).toHaveLength(Infinity)
    expect([...take(5)(rep)]).toEqual([5, 5, 5, 5, 5])
  })
})

describe('replicate', () => {
  it('returns a list of length n with x the value of every element', () => {
    const rep = replicate(5)(5)
    expect([...rep]).toEqual([5, 5, 5, 5, 5])
  })
})

describe('cycle', () => {
  const xs = List.of(1, 2, 3)
  const cy = cycle(xs)

  it('gives an infinite list', () => {
    expect(cy).toHaveLength(Infinity)
  })

  it('repeats the list xs', () => {
    expect([...take(2 * xs.length)(cy)]).toEqual([...xs, ...xs])
  })
})

describe('unfoldr', () => {
  it('builds a list from a function returning Option<[A, B]>', () => {
    const toZero = (b: number) => b >= 0 ? some([b, b - 1]) as Option<[number, number]> : none
    const fivetoZero = unfoldr(toZero)(5)
    expect([...fivetoZero]).toEqual([5, 4, 3, 2, 1, 0])
  })
})

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

describe('takeWhile', () => {
  const isOdd = (x: number) => x % 2 !== 0

  it('gives a prefix of xs of elements that satisfy the predicate', () => {
    const xs = List.of(1, 3, 5, 7, 9, 10, 11, 12)
    expect([...takeWhile(isOdd)(xs)]).toEqual([1, 3, 5, 7, 9])
  })
})

describe('zipN', () => {
  it('zips many lists into a list of arrays containing an item from each list', () => {
    const l1 = List.of(1, 2, 3, 4)
    const l2 = List.from('abcd')

    const zipped = zipN<number | string>(l1, l2)
    expect([...zipped]).toEqual([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']])
  })

  const l1 = List.of(1, 2, 3, 4)
  const l2 = List.from('abcdefghijklmnopqrstuvwxyz')
  const zipped = zipN<number | string>(l1, l2)

  it('truncates when a list is short', () => {
    expect([...zipped]).toEqual([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']])
  })

  it('gives the correct length on the new list', () => {
    expect(zipped).toHaveLength(l1.length)
  })
})

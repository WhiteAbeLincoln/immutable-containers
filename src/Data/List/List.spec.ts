import { List, ConstantList } from './List'

// helper functions
const pause = (milli: number) => {
  const now = new Date().getTime()
  while (new Date().getTime() < now + milli) { /* do nothing */ }
}

const time = (fn: () => void): number => {
  const now = Date.now()
  fn()
  const dt = Date.now() - now
  return dt
}

describe('List', () => {
  const array = [0, 1, 2, 3, 4]

  const mapInit = [['a', 1], ['b', 2], ['c', 3]]
  const map = new Map(mapInit as Array<[string, number]>)

  const set = new Set(array)

  const maplist = new List(map)
  const setlist = new List(set)
  const list = new List(array)
  const genlist = new List(function*() {
    // tslint:disable-next-line:prefer-const
    let count = 0
    while (count < 5) {
      yield count++
    }
  }, 5)

  it('constructs without error', () => {
    expect(() => new List()).not.toThrow()
    expect(() => new List([1, 2])).not.toThrow()
  })

  it('can be an empty list', () => {
    expect([...new List()]).toEqual([])
  })

  it('allows iteration multiple times from a generator', () => {
    expect([...genlist]).toEqual([0, 1, 2, 3, 4])
    expect([...genlist]).toEqual([0, 1, 2, 3, 4])
  })

  it('allows iteration multiple times from an iterable structure', () => {
    expect([...list]).toEqual(array)
    expect([...list]).toEqual(array)

    expect([...maplist]).toEqual(mapInit)
    expect([...maplist]).toEqual(mapInit)

    expect([...setlist]).toEqual(array)
    expect([...setlist]).toEqual([...list])
  })

  it('properly sets the length from a finite iterable structure', () => {
    expect(list).toHaveLength(array.length)
    expect(maplist).toHaveLength(map.size)
    expect(setlist).toHaveLength(set.size)
  })

  it('properly sets the length from a generator', () => {
    expect((new List(function*() {
      while (true) yield 5
    }))).toHaveLength(Infinity)
  })

  it('defaults the length to infinity when the size of the input structure cannot be determined', () => {
    const iter = array[Symbol.iterator]()
    const custom = {
      *[Symbol.iterator]() { yield* iter }
    }

    expect(new List(custom)).toHaveLength(Infinity)
  })

  it('properly sets the length when manually defined', () => {
    expect(genlist).toHaveLength(5)
  })

  it('throws when index is too large', () => {
    expect(() => { list.get(100) }).toThrow()
  })

  it('allows index access', () => {
    expect(list.get(1)).toBe(array[1])
    expect(maplist.get(0)).toEqual(mapInit[0])
    expect(set.has(setlist.get(1))).toBeTruthy()
    expect(genlist.get(2)).toBe(2)
  })

  it('sets Symbol.toStringTag', () => {
    expect(Object.prototype.toString.call(maplist)).not.toBe('[object Object]')
  })

  it('Allows constant time access to an index after the first access', () => {
    const gen = function*() {
      // Need to busy wait here
      let waited = 0
      while (true) {
        pause(500)
        waited += 500
        yield waited
      }
    }

    const genlist = new List(gen)

    const dt = time(() => { genlist.get(0) })
    // we wait 500ms in the function when getting the 0th element
    expect(dt).toBeGreaterThanOrEqual(500)

    const dt2 = time(() => { genlist.get(0) })
    // since we cached the result of the last get call, it shouldn't take 500ms to get
    expect(dt2).toBeLessThan(500)
  })

  describe('Functor instance', () => {
    it('defines map', () => {
      expect(genlist.map).not.toBe(undefined)
    })

    it('fulfills the Functor laws', () => {
      const id = <A>(a: A) => a
      const plus = (a: number) => (b: number) => a + b
      const toString = (a: any): string => a.toString()

      expect(new List([1]).map(id)
        .equals(
          new List(id([1]))
      )).toBeTruthy()

      expect(new List([1]).map(plus(1)).map(toString)
        .equals(
          new List([toString(plus(1)(1))])
      ))
    })
  })

  describe('Apply instance', () => {
    it('defines ap', () => {
      expect(genlist.ap).not.toBe(undefined)
    })

    // it('fulfills the Apply laws', () => {
    //   const compose = <A, B, C>(f: (b: B) => C) => (g: (a: A) => B) => (x: A) => f(g(x))
    //   const plus = (a: number) => (b: number) => a + b

    //   const x = new List([1, 2, 3])
    //   const g = new List([plus(1), plus(2)])

    //   // function.map is just composition

    //   expect(x.ap(g.ap()))
    // })
  })
})

describe('ConstantList', () => {
  const list = new List([1, 1, 1, 1, 1, 1, 1, 1])
  const list2 = new List([1, 2, 3, 4, 1, 2, 3, 4])
  const fixedlist = ConstantList(1)(list)
  const fixedlist2 = ConstantList(4)(list2)

  it('sets Symbol.toStringTag', () => {
    expect(Object.prototype.toString.call(fixedlist2)).not.toBe('[object Object]')
  })

  it('properly wraps List.get', () => {
    expect(fixedlist.get(2)).toBe(1)
    expect(fixedlist2.get(2)).toBe(3)
    expect(fixedlist2.get(6)).toBe(3)
  })

  it('throws when List.get would throw', () => {
    expect(() => { fixedlist2.get(1000) }).toThrow()
  })

  it('doesn\'t change other property access', () => {
    expect(fixedlist).toHaveProperty('length')
    expect(fixedlist).toHaveLength(list.length)

    expect((fixedlist as any).undef).toEqual(undefined)
  })

  it('caches the first n items on get', () => {
    const gen = function*() {
      pause(250)
      yield 1
      pause(250)
      yield 2
    }

    const cycle = function*() {
      while (true) {
        yield* gen()
      }
    }

    const flist = ConstantList(2)(new List(cycle))

    const dt = time(() => { flist.get(10) })
    expect(dt).toBeGreaterThanOrEqual(500)

    const dt2 = time(() => { flist.get(0) })
    expect(dt2).toBeLessThan(500)
  })
})

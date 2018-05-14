import { List, ConstantList, list as module } from './List'
import { sequence } from 'fp-ts/lib/Traversable'
import { array } from 'fp-ts/lib/Array'
import { equals } from '../../Prelude'
import { head } from './operators'

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
  const arr = [0, 1, 2, 3, 4]

  const mapInit = [['a', 1], ['b', 2], ['c', 3]]
  const map = new Map(mapInit as Array<[string, number]>)

  const set = new Set(arr)

  const maplist = new List(map)
  const setlist = new List(set)
  const list = new List(arr)
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

  it('constructs using List.of', () => {
    expect([...List.of(1, 2, 3, 4)]).toEqual([1, 2, 3, 4])
  })

  it('constructs using List.from', () => {
    expect([...List.from([1, 2, 3, 4])]).toEqual([1, 2, 3, 4])
  })

  it('can be an empty list', () => {
    expect([...new List()]).toEqual([])
  })

  it('allows iteration multiple times from a generator', () => {
    expect([...genlist]).toEqual([0, 1, 2, 3, 4])
    expect([...genlist]).toEqual([0, 1, 2, 3, 4])
  })

  it('allows iteration multiple times from an iterable structure', () => {
    expect([...list]).toEqual(arr)
    expect([...list]).toEqual(arr)

    expect([...maplist]).toEqual(mapInit)
    expect([...maplist]).toEqual(mapInit)

    expect([...setlist]).toEqual(arr)
    expect([...setlist]).toEqual([...list])
  })

  it('properly sets the length from a finite iterable structure', () => {
    expect(list).toHaveLength(arr.length)
    expect(maplist).toHaveLength(map.size)
    expect(setlist).toHaveLength(set.size)
  })

  it('properly sets the length from a generator', () => {
    expect((new List(function*() {
      while (true) yield 5
    }))).toHaveLength(Infinity)
  })

  it('defaults the length to infinity when the size of the input structure cannot be determined', () => {
    const iter = arr[Symbol.iterator]()
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
    expect(list.get(1)).toBe(arr[1])
    expect(maplist.get(0)).toEqual(mapInit[0])
    expect(set.has(setlist.get(1))).toBeTruthy()
    expect(genlist.get(2)).toBe(2)
  })

  it('sets Symbol.toStringTag', () => {
    expect(Object.prototype.toString.call(maplist)).not.toBe('[object Object]')
  })

  it('allows constant time access to an index after the first access', () => {
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

  it('has List() equal List()', () => {
    const l1 = List.zero()
    const l2 = List.zero()

    expect(l1.equals(l2)).toBeTruthy()
    expect(l2.equals(l1)).toBeTruthy()
  })

  it('has List(1) equal List(1)', () => {
    const l1 = List.of(1)
    const l2 = List.of(1)

    expect(l1.equals(l2)).toBeTruthy()
    expect(l2.equals(l1)).toBeTruthy()
  })

  it('has List() not equal List(1)', () => {
    const l1 = List.zero<number>()
    const l2 = List.of(1)

    expect(l1.equals(l2)).toBeFalsy()
    expect(l2.equals(l1)).toBeFalsy()
  })

  it('has List() not equal List(1..)', () => {
    const nat = (num = 1) => function*() { while (true) yield num++ }
    const l1 = List.from(nat(1))
    const l2 = List.zero<number>()

    expect(l1.equals(l2)).toBeFalsy()
    expect(l2.equals(l1)).toBeFalsy()

  })

  it('has List(1..) not equal List(1)', () => {
    const nat = (num = 1) => function*() { while (true) yield num++ }
    const l1 = List.from(nat(1))
    const l2 = List.of(1)

    expect(l1.equals(l2)).toBeFalsy()
    expect(l2.equals(l1)).toBeFalsy()
  })

  it('has List(1..) not equal List(5..)', () => {
    const nat = (num = 1) => function*() { while (true) yield num++ }
    const l1 = List.from(nat(1))
    const l2 = List.from(nat(5))

    expect(l1.equals(l2)).toBeFalsy()
    expect(l2.equals(l1)).toBeFalsy()
  })

  describe('Functor instance', () => {
    it('defines map', () => {
      expect(genlist.map).not.toBe(undefined)
    })

    it('fulfills the Functor laws', () => {
      const id = <A>(a: A) => a
      const plus = (a: number) => (b: number) => a + b
      const toString = (a: any): string => a.toString()

      const u = List.of(1)

      // u.map(x => x) === u
      expect(
        equals(
          u.map(id),
          u
        )
      ).toBeTruthy()

      const f = plus(1)
      const g = toString

      // u.map(f).map(g) === u.map(x => g(f(x)))
      expect(
        equals(
          u.map(f).map(g),
          u.map(x => g(f(x))
        )
      )).toBeTruthy()

    })
  })

  describe('Apply instance', () => {
    it('defines ap', () => {
      expect(genlist.ap).not.toBe(undefined)
    })

    it('fulfills the Apply laws', () => {
      const compose = <A, B, C>(f: (b: B) => C) => (g: (a: A) => B) => (x: A) => f(g(x))
      const plus = (a: number) => (b: number) => a + b
      const toString = (a: any): string => a.toString()

      const x = List.of(1, 2, 3)
      const g = List.of(plus(1), plus(2))
      const f = List.of(toString)

      // x.ap(g.ap(f.map(compose))) === x.ap(g).ap(f)
      expect(
        equals(
          x.ap(g.ap(f.map(i => compose(i)))),
          x.ap(g).ap(f)
        )
      ).toBeTruthy()
    })
  })

  describe('Applicative instance', () => {
    it('defines of', () => {
      expect(List.of).not.toBe(undefined)
    })

    it('fulfills the Applcative laws', () => {
      const id = <A>(a: A) => a

      const v = List.of(1)

      // Identity.
      // v.ap(A.of(x => x)) === v
      expect(
        equals(
          v.ap(List.of(id)),
          v
        )
      ).toBeTruthy()

      const toString = (a: any): string => a.toString()

      const x = 1
      const f = toString

      // Homomorphism
      // A.of(x).ap(A.of(f)) === A.of(f(x))
      expect(
        equals(
          List.of(1).ap(List.of(f)),
          List.of(f(x))
        )
      ).toBeTruthy()

      const y = 2
      const u = List.of(toString)

      // Interchange
      // A.of(y).ap(u) === u.ap(A.of(f => f(y)))
      expect(
        equals(
          List.of(y).ap(u),
          u.ap(List.of((f: typeof toString) => f(y)))
        )
      ).toBeTruthy()
    })
  })

  describe('Alt instance', () => {
    it('defines alt', () => {
      expect(genlist.alt).not.toBe(undefined)
    })

    it('fulfills the Alt laws', () => {
      const a = List.of(1)
      const b = List.of(2)
      const c = List.of(3)

      // Associativity
      // a.alt(b).alt(c) === a.alt(b.alt(c))
      expect(
        equals(
          a.alt(b).alt(c),
          a.alt(b.alt(c))
        )
      ).toBeTruthy()

      const f = (x: number) => x.toString()

      // Distributivity
      // a.alt(b).map(f) === a.map(f).alt(b.map(f))
      expect(
        equals(
          a.alt(b).map(f),
          a.map(f).alt(b.map(f))
        )
      ).toBeTruthy()
    })
  })

  describe('Plus instance', () => {
    it('defines zero', () => {
      expect(List.zero).not.toBe(undefined)
    })

    it('fulfills the Plus laws', () => {
      const x = List.of(1)

      // Right identity - zero on the right
      // x.alt(A.zero()) === x
      expect(
        equals(
          x.alt(List.zero()),
          x
        )
      ).toBeTruthy()

      // Left identity
      // A.zero().alt(x) === x
      expect(
        equals(
          List.zero<number>().alt(x),
          x
        )
      ).toBeTruthy()

      // Annihilation
      // A.zero().map(f) === A.zero()
      expect(
        equals(
          List.zero().map(x => x.toString()),
          List.zero()
        )
      ).toBeTruthy()
    })
  })

  describe('Alternative instance', () => {
    it('Fulfills the Alternative laws', () => {
      const x = List.of(1)
      const f = List.of((x: number) => x + 1)
      const g = List.of((x: number) => x + 2)

      // Distributivity
      // x.ap(f.alt(g)) === x.ap(f).alt(x.ap(g))
      expect(
        equals(
          x.ap(f.alt(g)),
          x.ap(f).alt(x.ap(g))
        )
      ).toBeTruthy()

      // Annihilation
      // x.ap(A.zero()) === A.zero()
      expect(
        equals(
          x.ap(List.zero()),
          List.zero()
        )
      ).toBeTruthy()
    })
  })

  describe('Chain instance', () => {
    it('defines chain', () => {
      expect(genlist.chain).not.toBe(undefined)
    })

    it('fulfills the Chain laws', () => {
      const m = List.of(1)
      const f = (x: number) => List.of(x + 1)
      const g = (x: number) => List.of(x.toString())

      // Associativity.
      // m.chain(f).chain(g) === m.chain(x => f(x).chain(g))
      expect(
        equals(
          m.chain(f).chain(g),
          m.chain(x => f(x).chain(g))
        )
      ).toBeTruthy()
    })
  })

  describe('Foldable instance', () => {
    it('defines reduce', () => {
      expect(genlist.reduce).not.toBe(undefined)
    })

    /* How does this Foldable law work for infinite
      structures? An infinite list can never be converted
      to an array...
    */
    it('fulfills the Foldable laws', () => {
      const toArray = <A>(xs: List<A>) => xs.reduce(
        (acc, x) => acc.concat([x]), [] as A[]
      )

      const u = List.of(1, 2, 3)
      const f = (a: number, b: number) => a + b

      // u.reduce(f) === toArray(u).reduce(f)
      expect(u.reduce(f, 0)).toBe(toArray(u).reduce(f, 0))
    })
  })

  describe('Traversable instance', () => {
    it('defines traverse', () => {
      expect(genlist.traverse).not.toBe(undefined)
    })

    it('fulfills the Traversable laws', () => {

      const u = List.of(1, 2, 3)

      // Identity
      // u.traverse(F, F.of) === F.of(u)
      expect(
        equals(
          u.traverse(module, List.of),
          List.of(u)
        )
      ).toBeTruthy()

      // t :: List a -> Array a
      const t = <A>(l: List<A>) => l.reduce((xs, x) => xs.concat([x]), [] as A[])

      const v = List.of(List.of(1), List.of(2), List.of(3))

      // Naturality
      // t :: F a -> G a
      // we have F === List and G === Array
      // where F and G are both Functors
      // u is a Traversable. u :: U (F a)
      // t(u.sequence(F)) === u.traverse(F)
      const seq = sequence(module /* F */, module /* U */)
      const first = t(seq(v))
      const second = v.traverse<'Array', number>(array, t)

      expect(
        first.map((v, i) => equals(v, second[i])).every(v => v)
      ).toBeTruthy()

      // Composition
      // FIXME: Implement Composition test

    })
  })

  describe('Monad instance', () => {
    it('Fulfills the Monad laws', () => {
      // f :: Monad m => a -> m a where m === List
      const f = (x: number) => List.of(x.toString())

      // Left identity
      // M.of(a).chain(f) === f(a)
      expect(
        equals(
          List.of(1).chain(f),
          f(1)
        )
      ).toBeTruthy()

      // Right identity
      // ma.chain(M.of) = ma
      expect(
        equals(
          List.of(1).chain(List.of),
          List.of(1)
        )
      ).toBeTruthy()
    })
  })

  describe('Extend instance', () => {
    it('defines extend', () => {
      expect(genlist.extend).not.toBe(undefined)
    })

    it('fulfills the Extend laws', () => {
      // f :: List number -> string
      const f = (x: List<number>) => head(x).toString()

      // g :: List string -> number
      const g = (x: List<string>) => head(x).length

      // w :: List number
      const w = List.of(1, 2, 3)

      // w.extend(f).extend(g) === w.extend(w_ => g(w_.extend(f)))
      expect(
        equals(
          w.extend(f).extend(g),
          w.extend(ww => g(ww.extend(f)))
        )
      ).toBeTruthy()
    })
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

  it('incrementally caches indexes less than size n', () => {
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
    expect(dt).toBeGreaterThanOrEqual(250)

    const dt2 = time(() => { flist.get(11) })
    expect(dt2).toBeGreaterThanOrEqual(250)

    const dt3 = time(() => { flist.get(1) })
    expect(dt3).toBeLessThan(250)
  })
})

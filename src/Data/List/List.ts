import { append, concat, unfoldr, zip, take, cons, drop } from './operators'
import { Monoid } from 'fp-ts/lib/Monoid'
import { Monad1 } from 'fp-ts/lib/Monad'
import { Unfoldable1 } from 'fp-ts/lib/Unfoldable'
import { Traversable1 } from 'fp-ts/lib/Traversable'
import { Alternative1 } from 'fp-ts/lib/Alternative'
import { Extend1 } from 'fp-ts/lib/Extend'
import { Applicative, Applicative2, Applicative3, Applicative1 } from 'fp-ts/lib/Applicative'
import { HKT, URIS3, URIS2, URIS, Type2, Type, Type3 } from 'fp-ts/lib/HKT'
import { equals } from '../../Prelude'
import { liftA2 } from 'fp-ts/lib/Apply'
import { foldr } from 'fp-ts/lib/Foldable'

const getNextN = <A>(n: number, cache: A[], iter: IterableIterator<A>) => {
  let count = 0
  let ddone = false

  while (count < n && !ddone) {
    const { value, done } = iter.next()
    if (!done) {
      cache.push(value)
    }

    ddone = done
    count++
  }
}

/**
 * An iterable data-structure (such as Array, Map, Set, List)
 * @internal
 */
export interface Collection<A> {
  [Symbol.iterator](): IterableIterator<A>
  next?: undefined
}

/**
 * A Collection with a size or length property
 * @internal
 */
type SizedCollection<A> = Collection<A> & ({ size: number } | { length: number })

/**
 * Determines if a Collection is a SizedStructure
 * @param a The iterable structure
 * @internal
 */
const isSizedCollection = <A>(a: Collection<A>): a is SizedCollection<A> => (
  typeof (a as any).size === 'number' || typeof (a as any).length === 'number'
)

/**
 * Gets the value of the size or length property from a SizedStructure
 * @param a The SizedStructure
 * @internal
 */
const getSize = (a: SizedCollection<any>): number => (
  typeof (a as { size?: number }).size === 'number'
    ? (a as { size: number }).size
    : (a as { length: number }).length
)

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT<A> {
    List: List<A>
  }
}

export const URI = 'List'
export type URI = typeof URI

/** A lazy list */
export class List<A> implements Collection<A>, HKT<URI, A> {
  /** @internal */
  readonly _tag: 'List' = 'List'
  /** @internal */
  readonly _A!: A
  /** @internal */
  readonly _URI!: URI

  [Symbol.iterator] = function*(): IterableIterator<A> {
    yield* []
  }

  get [Symbol.toStringTag]() {
    return 'List'
  }

  /** @internal */
  private _length: number = 0

  /**
   * A lower bound for the length of the list
   *
   * This only provides an estimate. Use Data.List.length to get the actual size
   */
  get length() { return this._length }

  /** @internal */
  private cache: A[] = []
  private cachedIter?: IterableIterator<A> = undefined

  // tslint:disable:unified-signatures
  /**
   * Create a list
   */
  constructor()
  /**
   * Create a list from an iterable data-structure (ES6 Map, Set, or Array)
   * @param structure The iterable structure
   * @param length An optional length (defaults to `structure.length` or `structure.size` or `Infinity`)
   */
  constructor(structure: Collection<A>, length?: number)
  /**
   * Create a list from a generator
   * @param generator The generator
   * @param length An optional length (defaults to Infinity)
   */
  constructor(generator: () => IterableIterator<A>, length?: number)
  constructor(ish: Collection<A> | (() => IterableIterator<A>), length?: number)
  constructor(param?: Collection<A> | (() => IterableIterator<A>), length?: number) {
    if (param) {
      this[Symbol.iterator] =
        typeof param === 'function'
          ? param
          : function*() { yield* param }

      if (typeof param === 'function') {
        this._length = Infinity
      } else if (isSizedCollection(param)) {
        this._length = getSize(param)
      } else {
        this._length = Infinity
      }
    }

    if (typeof length === 'number') {
      this._length = length
    }
  }

  /**
   * Construct a list from a variadic array
   * @param items The items to make a list of
   */
  static of<A>(...items: A[]): List<A> {
    return new List(items)
  }

  /**
   * Construct a List from a List-like structure
   * @param ish The List-like structure
   */
  static from<A>(ish: Collection<A> | (() => IterableIterator<A>)) {
    return new List(ish)
  }

  /**
   * Construct the empty List
   */
  static zero<A>(): List<A> {
    return new List()
  }

  /**
   * Get an item at an index of the list
   *
   * Throws if the index is too large
   * @param i The index
   */
  get(i: number): A {
    if (i < 0) throw new Error('List.get: negative index')

    if (!this.cachedIter) {
      this.cachedIter = this[Symbol.iterator]()
    }

    // evaluating at an index in Haskell also requires calculating all the previous
    // try: (iterate (^2) 2) !! 9223372036854775807
    if (i >= this.cache.length) {
      getNextN((i + 1) - this.cache.length, this.cache, this.cachedIter)
    }

    if (i >= this.cache.length) {
      // the actual size of the list is less than the index
      this._length = this.cache.length
      throw new Error('List.get: index too large')
    }

    return this.cache[i]
  }

  /**
   * Applies f to every element of the list
   * @param f The mapping function
   */
  map<B>(f: (a: A) => B): List<B> {
    // tslint:disable-next-line:no-this-assignment
    const xs = this
    return new List(function*() {
      for (const x of xs) {
        yield f(x)
      }
    }, this.length)
  }

  /**
   * Applies a function to every element of the list
   * @param callbackfn A Array.prototype.map compatible mapping function
   * @param thisArg The list to map over. Defaults to this
   */
  map1<B>(callbackfn: (value: A, index: number, list: List<A>) => B, thisArg = this): List<B> {
    let i = 0
    return thisArg.map(x => callbackfn(x, i++, thisArg))
  }

  ap<B>(fab: List<(a: A) => B>): List<B> {
    const inner = fab.map(f => this.map(f))
    return concat(inner)
  }

  // TODO: make this a lazy foldr
  reduce(f: (acc: A, curr: A) => A): A
  reduce(f: (acc: A, curr: A) => A, init: A): A
  reduce<B>(f: (acc: B, curr: A) => B, init: B): B
  reduce<B>(f: (b: A | B, a: A) => A | B, init?: A | B): A | B {
    const hasSeed = arguments.length >= 2
    const iter = this[Symbol.iterator]()

    // remove undefined coming from optional init since we fix with the hasSeed check
    let acc = init as any as A | B

    if (!hasSeed) {
      for (const x of iter) {
        acc = x
        break
      }
    }

    for (const x of iter) {
      acc = f(acc, x)
    }

    return acc
  }

  chain<B>(f: (a: A) => List<B>): List<B> {
    return concat(this.map(f))
  }

  traverse<F extends URIS3, U, L, B>(F: Applicative3<F>, f: (a: A) => Type3<F, U, L, B>): Type3<F, U, L, List<B>>
  traverse<F extends URIS2, L, B>(F: Applicative2<F>, f: (a: A) => Type2<F, L, B>): Type2<F, L, List<B>>
  traverse<F extends URIS, B>(F: Applicative1<F>, f: (a: A) => Type<F, B>): Type<F, List<B>>
  traverse<F, B>(F: Applicative<F>, f: (a: A) => HKT<F, B>): HKT<F, List<B>>
  traverse<F, B>(F: Applicative<F>, f: (a: A) => HKT<F, B>): HKT<F, List<B>> {
    const consf = (x: A, ys: HKT<F, List<B>>) => liftA2(F)((a: B) => (b: List<B>) => cons(a)(b))(f(x))(ys)
    return foldr(list)(this, F.of(List.zero()), consf)
  }

  extend<B>(f: (fa: List<A>) => B): List<B> {
    return this.map1((_, i, as) => f(drop(i)(as)))
  }

  alt(fy: List<A>): List<A> {
    return append(this)(fy)
  }

  /**
   * Checks if this list is equal to another
   * @param other The other list
   */
  equals(other: List<A>) {
    if (this.length !== other.length) {
      return false
    }

    const zipped = zip(this)(other)

    for (const pair of zipped) {
      if (!equals(pair[0], pair[1])) {
        return false
      }
    }

    return true
  }

  inspect() {
    return this.toString()
  }

  toString(): string {
    if (this.length !== Infinity) {
      return `${this[Symbol.toStringTag]} [${[...this].toString()}]`
    } else {
      return `${this[Symbol.toStringTag]} [${[...take(25)(this)].toString()}...]`
    }
  }
}

/**
 * A wrapper for List that allows getting elements without calculating a whole infinite list
 *
 * For use with cycle and repeat, where we know that the elements
 * of an infinite list will be repeated lists of some constant size
 * @param size The size of the repeated section
 * @param list The list to wrap
 * @returns A wrapped list
 */
// tslint:disable-next-line:variable-name
export const ConstantList = (size: number) => <A>(list: List<A>): List<A> => {
  const cache: A[] = []
  const iter = list[Symbol.iterator]()

  return new Proxy(list, {
    get(target, p) {
      if (p === 'get') {
        // if the passed list size is infinite, don't attempt to redefine get
        if (size === Infinity) return list.get

        return (i: number) => {
          if (i < 0) throw new Error('List.get: negative index')
          if (i >= target.length) throw new Error('List.get: index too large')

          if (i % size >= cache.length) {
            getNextN((i % size + 1) - cache.length, cache, iter)
          }

          return cache[i % size]
        }
      }

      if (p === Symbol.toStringTag) {
        return `ConstantList(${size})`
      }

      return (target as any)[p]
    }
  })
}

/**
 * Gives List's Monoid instance
 */
export const getMonoid = <A = never>(): Monoid<List<A>> => ({
  concat: (x, y) => append(x)(y)
, empty: new List()
})

/**
 * The List module for [fp-ts](https://github.com/gcanti/fp-ts)
 */
export const list: Monad1<URI>
  & Unfoldable1<URI>
  & Traversable1<URI>
  & Alternative1<URI>
  & Extend1<URI>
= { URI
  , of: List.of
  , map: (fa, f) => fa.map(f)
  , ap: (fab, fa) => fa.ap(fab)
  , chain: (fa, f) => fa.chain(f)
  , reduce: (fa, b, f) => fa.reduce(f, b)
  , unfoldr: (b, f) => unfoldr(f)(b)
  , traverse: F => (ta, f) => ta.traverse(F, f)
  , zero: List.zero
  , alt: (fx, fy) => fx.alt(fy)
  , extend: (ea, f) => ea.extend(f)
}

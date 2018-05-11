import { append, concat, unfoldr, zip } from './operators'
import { Monoid } from 'fp-ts/lib/Monoid'
import { Monad1 } from 'fp-ts/lib/Monad'
import { Foldable1 } from 'fp-ts/lib/Foldable'
import { Unfoldable1 } from 'fp-ts/lib/Unfoldable'
import { Traversable1 } from 'fp-ts/lib/Traversable'
import { Alternative1 } from 'fp-ts/lib/Alternative'
import { Plus1 } from 'fp-ts/lib/Plus'
import { Extend1 } from 'fp-ts/lib/Extend'
import { Applicative } from 'fp-ts/lib/Applicative'
import { HKT } from 'fp-ts/lib/HKT'

const equal = (a: any, b: any): boolean => {
  if (a && typeof a.equals === 'function') {
    return a.equals(b)
  }

  return a === b
}

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
export class List<A> implements Collection<A> {
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
   * An upper bound for the length of the list
   *
   * This only provides an estimate. Use Data.List.length to get the actual size
   *
   * When the list is constructed from a generator, there is no
   * way of knowing the total number of yields.
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

    if (length) {
      this._length = length
    }
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
    }, xs._length)
  }

  ap<B>(fab: List<(a: A) => B>): List<B> {
    return concat(fab.map(f => this.map(f)))
  }

  reduce<B>(b: B, f: (b: B, a: A) => B): B {
    let r = b

    for (const x of this) {
      r = f(r, x)
    }

    return r
  }

  chain<B>(_f: (a: A) => List<B>): List<B> {
    throw new Error('Not Implemented')
  }

  traverse<F>(_F: Applicative<F>): <B>(f: (a: A) => HKT<F, B>) => HKT<F, List<B>> {
    return _f => {
      throw new Error('Not Implemented')
    }
  }

  extend<B>(_f: (fa: List<A>) => B): List<B> {
    throw new Error('Not Implemented')
  }

  /**
   * Checks if this list is equal to another
   * @param other The other list
   */
  equals(other: List<A>) {
    if (this._length !== other.length) {
      return false
    }

    const zipped = zip(this)(other)

    for (const pair of zipped) {
      if (!equal(pair[0], pair[1])) {
        return false
      }
    }

    return true
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

export const of = <A>(a: A): List<A> => new List([a])

/**
 * The List module for [fp-ts](https://github.com/gcanti/fp-ts)
 */
export const list: Monad1<URI>
  & Foldable1<URI>
  & Unfoldable1<URI>
  & Traversable1<URI>
  & Alternative1<URI>
  & Plus1<URI>
  & Extend1<URI>
= { URI
  , of: a => new List([a])
  , map: (fa, f) => fa.map(f)
  , ap: (fab, fa) => fa.ap(fab)
  , chain: (fa, f) => fa.chain(f)
  , reduce: (fa, b, f) => fa.reduce(b, f)
  , unfoldr: (b, f) => unfoldr(f)(b)
  , traverse: F => (ta, f) => ta.traverse(F)(f)
  , zero: () => new List()
  , alt: (fx, fy) => append(fx)(fy)
  , extend: (ea, f): any => ea.extend(f)
}

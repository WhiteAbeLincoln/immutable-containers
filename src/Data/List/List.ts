import { append, concat, unfoldr, take, cons, drop, length, map, foldl, foldl1 } from './operators'
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
import { Collection, isSizedCollection, getSize } from '../../Collection'
import { getNextN, xor } from '../../util'
import { constant } from 'fp-ts/lib/function'

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

  /**
   * Private length for caching purposes
   * @internal
   */
  _length: undefined | number

  /**
   * The length of the list
   *
   * Not safe to call on infinite lists
   */
  length(): number {
    if (typeof this._length === 'undefined') {
      this._length = length(this)
    }

    return this._length
  }

  /** @internal */
  private cache: A[] = []
  private cachedIter?: IterableIterator<A> = undefined

  // tslint:disable:unified-signatures
  /**
   * Create an empty list
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

      if (typeof param !== 'function' && isSizedCollection(param)) {
        this._length = getSize(param)
      }
    } else {
      this._length = 0
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
    return map(f)(this)
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

  foldl(f: (acc: A, curr: A) => A): A
  foldl<B>(f: (acc: B, curr: A) => B, init: B): B
  foldl<B>(f: (b: A | B, a: A) => A | B, init?: A | B): A | B {
    const hasSeed = arguments.length >= 2
    return hasSeed
      ? foldl(f as (b: B, a: A) => B)(init as any as B)(this)
      : foldl1(f as (b: A, a: A) => A)(this)
  }

  reduce = this.foldl

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
    const iter1 = this[Symbol.iterator]()
    const iter2 = other[Symbol.iterator]()

    let done1 = false
    let done2 = false

    // while neither iterator is finished
    while (!(done1 || done2)) {
      const it1 = iter1.next()
      const it2 = iter2.next()

      done1 = !!it1.done
      done2 = !!it2.done

      // if any one is finished but the other isn't
      if (xor(constant(done1), constant(done2))(0)) {
        return false
      } else {
        // otherwise check value equality
        const v1 = it1.value
        const v2 = it2.value

        if (!equals(v1, v2)) return false
      }
    }

    return true
  }

  inspect() {
    return this.toString()
  }

  toString(): string {
    return `${this[Symbol.toStringTag]}(${[...take(250)(this)].toString()}...)`
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
  const tag = `ConstantList(${size})`

  return new Proxy(list, {
    get(target, p) {
      if (p === 'get') {
        // if the passed list size is infinite, don't attempt to redefine get
        if (size === Infinity) return list.get

        return (i: number) => {
          if (i < 0) throw new Error('List.get: negative index')
          if (target._length && i >= target._length) throw new Error('List.get: index too large')

          if (i % size >= cache.length) {
            getNextN((i % size + 1) - cache.length, cache, iter)
          }

          return cache[i % size]
        }
      }

      if (p === Symbol.toStringTag) {
        return tag
      }

      if (p === 'toString') {
        return () => `${tag}(${list.toString()})`
      }

      return (target as any)[p]
    }
  })
}

/**
 * Gives List's Monoid instance
 */
export function getMonoid<A = never>(): Monoid<List<A>> {
  return {
    concat: (x, y) => append(x)(y)
  , empty: List.zero()
  }
}

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

/** @module Data/List/operators  */
import { concatMap as cm, length as len, empty as empt } from '../Foldable'
import { array } from 'fp-ts/lib/Array'
import { List, ConstantList, list } from './List'
import { None, Some } from 'fp-ts/lib/Option'

/**
 * Prepend `x` at the beginning of a list
 * @param x The value to prepend
 * @param xs The list to prepend to
 * @returns x:xs
 */
export const cons = <A>(x: A) => (xs: List<A>) => (
  new List(function*() {
    yield x
    yield* xs
  }, xs.length + 1)
)

/**
 * Append two lists. If the first list is not finite, the result is the first list.
 * @see [Data.List (++)](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:-43--43-)
 * @param xs The first list
 * @param ys The second list
 */
export const append = <A>(xs: List<A>) => (ys: List<A>) => (
  new List(function*() {
    yield* xs
    yield* ys
  }, xs.length + ys.length)
)

/**
 * Concatenate a list of lists
 * @param xss The list of lists
 */
export const concat = <A>(xss: List<List<A>>) => {
  const finite = xss.length !== Infinity

  let length = 0
  if (finite) {
    for (const xs of xss) {
      length += xs.length
    }
  }

  return new List(function*() {
    for (const xs of xss) {
      yield* xs
    }
  }, finite ? length : Infinity)
}

/**
 * Extract the first element of a list, which must be non-empty.
 * @see [Data.List head](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:head)
 * @param xs The list
 */
export const head = <A>(xs: List<A>): A => {
  for (const it of xs) {
    return it
  }

  throw new Error('head: Empty list')
}

/**
 * Extract the last element of a list, which must be finite and non-empty.
 * @see [Data.List last](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:last)
 * @param xs The finite list
 */
export const last = <A>(xs: List<A>) => {
  const lst = [...xs]
  if (lst.length === 0) throw new Error('last: Empty list')
  return lst[lst.length - 1]
}

/**
 * Extract the elements after the head of a list, which must be non-empty.
 * @see [Data.List tail](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:tail)
 * @param xs The list
 */
export const tail = <A>(xs: List<A>): List<A> => (
  new List(function*() {
    const iter = xs[Symbol.iterator]()

    let hitFirst = false

    // ignore the first
    for (const _ of iter) {
      hitFirst = true
      break
    }

    // yield the rest
    for (const x of iter) {
      yield x
    }

    if (!hitFirst) throw new Error('tail: Empty list')
  }, xs.length - 1)
)

/**
 * Return all the elements of a list except the last one. The list must be non-empty.
 * @see [Data.List init](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:init)
 * @param xs The list
 */
export const init = <A>(xs: List<A>): List<A> => (
  new List(function*() {
    const iter = xs[Symbol.iterator]()

    let hitFirst = false
    let prev = null

    for (const x of iter) {
      prev = x
      hitFirst = true
      break
    }

    for (const it of iter) {
      yield prev as A
      prev = it
    }

    if (!hitFirst) throw new Error('init: Empty list')
  }, xs.length - 1)
)

export const length = len(list)
export const empty = empt(list)

/**
 * Applies f to every element of xs.
 * @see [Data.List map](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:map)
 * @param f The mapping function
 * @param xs The list
 */
export const map = <A, B>(f: (a: A) => B) => (xs: List<A>) => (
  xs.map(f)
)

/**
 * Returns the elements of xs in reverse order. xs must be finite.
 * @see [Data.List reverse](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:reverse)
 * @param xs The finite list
 */
export const reverse = <A>(xs: List<A>): List<A> => (
  new List([...xs].reverse())
)

/**
 * Takes an element and a list and `intersperses' that element between the elements of the list.
 * @see [Data.List intersperse](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:intersperse)
 * @param sep The element
 * @param xs The list
 */
export const intersperse = <A>(sep: A) => (xs: List<A>) => (
  new List(function*() {
    const iter = xs[Symbol.iterator]()
    // yield the first element
    for (const x of iter) {
      yield x
      break
    }

    // yield the rest with sep prepended
    for (const x of iter) {
      yield sep
      yield x
    }
  }, xs.length + xs.length - 1)
)

/**
 * Inserts the list xs in between the lists in xss and concatenates the result.
 * @see [Data.List intercalate](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:intercalate)
 * @param xs The first list
 * @param xss The list of lists
 */
export const intercalate = <A>(xs: List<A>) => (xss: List<List<A>>) =>
  concat(intersperse(xs)(xss))

/**
 * Transposes the rows and columns of list
 *
 * If some of the rows are shorter than following rows the extra elements are skipped
 * @see [Data.List transpose](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:transpose)
 * @param list The list of lists to transpose
 */
export const transpose = <A>(list: List<List<A>>): List<List<A>> => {
  if (list.length === 0) return list

  const first = head(list)
  const xss = tail(list)

  if (first.length === 0) return transpose(xss)

  const x = head(first)
  const xs = tail(first)

  return cons(
          cons(x)(map<List<A>, A>(head)(xss))
         )(
          transpose(
            cons(xs)(map<List<A>, List<A>>(tail)(xss))
          )
         )
}

/**
 * Returns a list of all subsequences of the parameter list
 * @see [Data.List subsequences](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:subsequences)
 * @param list The list to get subsequences for
 */
export const subsequences = <A>(_list: List<A>): List<List<A>> => {
  throw new Error('Not Implemented')
}

export const permutations = <A>(_list: List<A>): List<List<A>> => {
  throw new Error('Not Implemented')
}

/**
 * Returns an infinite list of repeated applications of f to x.
 * @see [Data.List iterate](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:iterate)
 * @param f The function to apply
 * @param x The initial value
 */
export const iterate = <A>(f: (a: A) => A) => (x: A) => (
  new List(function*() {
    let last = x
    while (true) {
      yield last
      last = f(last)
    }
  })
)

/**
 * Returns an infinite list with x the value of every element.
 * @param x The value
 */
export const repeat = <A>(x: A) => (
  /* Here we improve upon haskell:
    We know how many repeated elements there are (1), so we can access any index
    in O(1) time by wrapping with ConstantList(1)
  */
  ConstantList(1)(new List(function*() {
    while (true) {
      yield x
    }
  }))
)

/**
 * Returns a list of length n with x the value of every element.
 * @param n The value
 */
export const replicate = (n: number) => <A>(x: A) =>
  take(n)(repeat(x))

/**
 * Ties a finite list into a circular one, or in other words, infinitely repeats the finite list
 * @param xs The finite list
 */
export const cycle = <A>(xs: List<A>) => (
  /* we can access any index in O(xs.length) time by wrapping with FixedList
    This doesn't account for construction time: if xs was a lazy list that took O(2^k)
    time to emit n elements then it would actually take O(n*2^k) to access the
    first element, and O(n) to emit all subsequent
    List caches to avoid recalculating the new elements
  */
  ConstantList(xs.length)(new List(function*() {
    while (true) yield* xs
  }))
)

export const unfoldr = <A, B>(_f: (b: B) => None<[A, B]> | Some<[A, B]>) => (_b: B): List<A> => {
  throw new Error('Not Implemented')
}

/**
 * Returns the prefix of xs of length n, or xs if n > length(xs)
 * @param n The desired length
 * @param xs The list
 */
export const take = (n: number) => <A>(xs: List<A>) => (
  new List(function*() {
    if (n < 1) {
      return
    }
    let count = 0
    for (const x of xs) {
      yield x
      if (++count >= n) break
    }
  })
)

export const concatMap = cm(array)

export const takeWhile = <A>(pred: (a: A) => boolean) => (xs: List<A>) => (
  new List(function*() {
    for (const x of xs) {
      if (!pred(x)) break
      yield x
    }
  })
)

export const zip = <A>(as: List<A>) => <B>(bs: List<B>) => zipN<A | B>(as, bs) as List<[A, B]>

export const zip3 = <A>(as: List<A>) => <B>(bs: List<B>) => <C>(cs: List<C>) => (
  zipN<A | B | C>(as, bs, cs) as List<[A, B, C]>
)

export const zip4 = <A>(as: List<A>) => <B>(bs: List<B>) => <C>(cs: List<C>) => <D>(ds: List<D>) => (
  zipN<A | B | C | D>(as, bs, cs, ds) as List<[A, B, C, D]>
)

export const zip5 = <A>(as: List<A>) =>
                    <B>(bs: List<B>) =>
                    <C>(cs: List<C>) =>
                    <D>(ds: List<D>) =>
                    <E>(es: List<E>) => (
  zipN<A | B | C | D | E>(as, bs, cs, ds, es) as List<[A, B, C, D, E]>
)

export const zip6 = <A>(as: List<A>) =>
                    <B>(bs: List<B>) =>
                    <C>(cs: List<C>) =>
                    <D>(ds: List<D>) =>
                    <E>(es: List<E>) =>
                    <F>(fs: List<F>) => (
  zipN<A | B | C | D | E | F>(as, bs, cs, ds, es, fs) as List<[A, B, C, D, E, F]>
)

export const zip7 = <A>(as: List<A>) =>
                    <B>(bs: List<B>) =>
                    <C>(cs: List<C>) =>
                    <D>(ds: List<D>) =>
                    <E>(es: List<E>) =>
                    <F>(fs: List<F>) =>
                    <G>(gs: List<G>) => (
  zipN<A | B | C | D | E | F | G>(as, bs, cs, ds, es, fs, gs) as List<[A, B, C, D, E, F, G]>
)

export const zipN = <A>(...lists: Array<List<A>>): List<A[]> => (
  new List(function*() {
    const iterators = lists.map(i => i[Symbol.iterator]())
    // tslint:disable-next-line:prefer-const
    let done = false

    while (!done) {
      const items = iterators.map(i => i.next())
      done = items.some(item => item.done)
      if (!done) {
        yield items.map(i => i.value)
      }
    }

    for (const it of iterators) {
      if (typeof it.return === 'function') {
        it.return()
      }
    }
  }, Math.min(...lists.map(l => l.length)))
)

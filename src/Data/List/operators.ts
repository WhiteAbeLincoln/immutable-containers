/** @module Data/List/operators  */
import { List, ConstantList } from './List'
import { None, Some, isSome } from 'fp-ts/lib/Option'
import { Suspension, delay, isSuspension } from '../../Suspension'
import { EmptyListError } from '../../util'

/**
 * Prepend `x` at the beginning of a list
 * @param x The value to prepend
 * @param xs The list to prepend to
 * @returns x:xs
 */
export const cons = <A>(x: A | Suspension<A>) => (xs: List<A> | Suspension<List<A>>): List<A> => (
  new List(function*() {
    isSuspension(x) ? yield x() : yield x
    isSuspension(xs) ? yield* xs() : yield* xs
  }, typeof (xs as any)._length === 'number' ? (xs as any)._length + 1 : undefined)
)

/**
 * Append two lists. If the first list is not finite, the result is the first list.
 * @see [Data.List (++)](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:-43--43-)
 * @param xs The first list
 * @param ys The second list
 */
export const append = <A>(xs: List<A> | Suspension<List<A>>) => (ys: List<A> | Suspension<List<A>>) => (
  new List(function*() {
    isSuspension(xs) ? yield* xs() : yield* xs
    isSuspension(ys) ? yield* ys() : yield* ys
  }, typeof ((xs as any)._length === 'number' && typeof (ys as any)._length) === 'number'
      ? (xs as any)._length + (ys as any)._length
      : undefined
  )
)

/**
 * Extract the first element of a list, which must be non-empty.
 * @see [Data.List head](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:head)
 * @param xs The list
 */
export const head = <A>(xs: List<A>): A => {
  for (const it of xs) {
    return it
  }

  throw new EmptyListError('head')
}

/**
 * Extract the last element of a list, which must be finite and non-empty.
 * @see [Data.List last](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:last)
 * @param xs The finite list
 */
export const last = <A>(xs: List<A>) => {
  if (empty(xs)) throw new EmptyListError('last')
  const lst = [...xs]
  return lst[lst.length - 1]
}

/**
 * Extract the elements after the head of a list, which must be non-empty.
 * @see [Data.List tail](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:tail)
 * @param xs The list
 */
export const tail = <A>(xs: List<A>): List<A> => {
  if (empty(xs)) throw new EmptyListError('tail')
  return new List(function*() {
    let hitFirst = false

    // ignore the first
    for (const x of xs) {
      if (hitFirst) {
        yield x
      } else {
        hitFirst = true
      }
    }
  }, typeof xs._length === 'number' ? xs._length - 1 : undefined)
}

/**
 * Return all the elements of a list except the last one. The list must be non-empty.
 * @see [Data.List init](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:init)
 * @param xs The list
 */
export const init = <A>(xs: List<A>): List<A> => {
  if (empty(xs)) throw new EmptyListError('init')
  return new List(function*() {
    let hitFirst = false
    let prev = null

    for (const x of xs) {
      if (hitFirst) {
        yield prev as any as A
      } else {
        hitFirst = true
      }
      prev = x
    }

  }, typeof xs._length === 'number' ? xs._length - 1 : undefined)
}

export function length<A>(xs: List<A>) {
  return foldl((c: number, _) => c + 1)(0)(xs)
}

export const empty = <A>(xs: List<A>) => {
  let hitFirst = false
  for (const _ of xs) { hitFirst = true; break }
  return !hitFirst
}

/**
 * Applies f to every element of xs.
 * @see [Data.List map](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:map)
 * @param f The mapping function
 * @param xs The list
 */
export const map = <A, B>(f: (a: A) => B) => (xs: List<A>) => (
  new List(function*() {
    for (const x of xs) {
      yield f(x)
    }
  }, xs._length)
)

/**
 * Returns the elements of xs in reverse order. xs must be finite.
 * @see [Data.List reverse](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:reverse)
 * @param xs The finite list
 */
export const reverse = <A>(xs: List<A>): List<A> => {
  return new List([...xs].reverse())
}

/**
 * Takes an element and a list and `intersperses' that element between the elements of the list.
 * @see [Data.List intersperse](http://hackage.haskell.org/package/base-4.11.1.0/docs/Data-List.html#v:intersperse)
 * @param sep The element
 * @param xs The list
 */
export const intersperse = <A>(sep: A) => (xs: List<A>) => (
  new List(function*() {
    let hitFirst = false
    for (const x of xs) {
      if (hitFirst) {
        yield sep
      }
      yield x
      if (!hitFirst) hitFirst = true
    }
  }, typeof xs._length === 'number' ? xs._length + xs._length - 1 : undefined)
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
  if (empty(list)) return list

  const first = head(list)
  const xss = tail(list)

  if (empty(first)) return transpose(xss)

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

export const foldl = <A, B>(f: (acc: B, curr: A) => B) => (init: B) => (xs: List<A>): B => {
  let acc = init
  for (const x of xs) {
    acc = f(acc, x)
  }

  return acc
}

export const foldl1 = <A>(f: (acc: A, curr: A) => A) => (xs: List<A>) => {
  if (empty(xs)) throw new EmptyListError('foldl1')
  return foldl(f)(head(xs))(tail(xs))
}

export const foldr = <A, B>(f: (curr: A, acc: Suspension<B>) => B) => (init: B) => (xs: List<A>): B => {
  if (empty(xs)) {
    return init
  }

  const x = head(xs)
  const rest = tail(xs)

  return f(x, delay(() => foldr(f)(init)(rest)))
}

export const foldr1 = <A>(f: (curr: A, acc: Suspension<A>) => A) => (xs: List<A>): A => {
  if (empty(xs)) throw new EmptyListError('foldr1')
  return foldr(f)(head(xs))(tail(xs))
}

/**
 * Concatenate a list of lists
 * @param xss The list of lists
 */
export const concat = <A>(xss: List<List<A>>) => {
  return new List(function*() {
    for (const xs of xss) {
      yield* xs
    }
  })
}

export const concatMap = <A, B>(f: (a: A) => List<B>) => (xs: List<A>): List<B> => {
  return foldr((curr: A, acc: Suspension<List<B>>) => append(f(curr))(acc))(List.zero())(xs)
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
  /* Here we improve on haskell:
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
export const cycle = <A>(xs: List<A>) => {
  const list = new List(function*() {
    while (true) yield* xs
  })
  /* If we know the list is finite,
    we can access any index in O(xs.length) time by wrapping with ConstantList
    This doesn't account for construction time: if xs was a lazy list that took O(2^k)
    time to emit n elements then it would actually take O(n*2^k) to access the
    first element, and O(n) to emit all subsequent
    List caches to avoid recalculating the new elements
  */
  return typeof xs._length !== 'undefined' ?
    ConstantList(xs._length)(list) : list
}

/**
 * Builds a list from a seed value
 *
 * Takes a function that takes an element and returns `None`
 * if it is done building the list, or `Some (a, b)` in which
 * case `a` is prepended to the list and the function is called
 * again with `b` as the parameter
 * @param _f The build function
 */
export const unfoldr = <A, B>(f: (b: B) => None<[A, B]> | Some<[A, B]>) => (b: B): List<A> => (
  new List(function*() {
    let x = f(b)
    while (isSome(x)) {
      const [a, b] = x.value
      yield a
      x = f(b)
    }
  })
)

/**
 * Returns the prefix of xs of length n, or xs if n >= length(xs)
 * @param n The desired length
 * @param xs The list
 */
export const take = (n: number) => <A>(xs: List<A>) => {
  const len = xs._length && n > xs._length
    ? xs._length
    : n < 1 ? 0
    : n
  return new List(function*() {
    if (n < 1) {
      return
    }
    let count = 0
    for (const x of xs) {
      yield x
      if (++count >= n) break
    }
  }, len)
}

export const drop = (n: number) => <A>(xs: List<A>) => {
  const len = xs._length && (
    xs._length - n < 0 ? 0 : xs._length - n
  )

  return new List(function*() {
    let count = 0
    for (const x of xs) {
      if (count === n) {
        yield x
      } else {
        count++
      }
    }
  }, len)
}

/**
 * Returns the longest prefix of `xs` composed of elements that satisfy the predicate `p`
 * @param p The predicate
 * @param xs The list
 */
export const takeWhile = <A>(p: (a: A) => boolean) => (xs: List<A>) => (
  new List(function*() {
    for (const x of xs) {
      if (!p(x)) break
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
  })
)

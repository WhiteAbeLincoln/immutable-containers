import { Predicate } from 'fp-ts/lib/function'

/**
 * @internal
 * Gets the next n items from an iterable and appends them to the cache in place
 * @param n The number of items to get
 * @param cache The array to add items to
 * @param iter The iterable to get items from
 */
export const getNextN = <A>(n: number, cache: A[], iter: IterableIterator<A>) => {
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

export class EmptyListError extends Error {
  constructor(thrower: string) {
    super(`${thrower}: empty list`)
  }
}

export const xor = <A>(p1: Predicate<A>, p2: Predicate<A>): Predicate<A> =>
  a => {
    const v1 = p1(a)
    const v2 = p2(a)

    return (v1 || v2) && !(v1 && v2)
  }

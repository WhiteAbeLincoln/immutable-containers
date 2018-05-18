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
export type SizedCollection<A> = Collection<A> & ({ size: number } | { length: number })

/**
 * Determines if a Collection is a SizedCollection
 * @param a The iterable structure
 * @internal
 */
export const isSizedCollection = <A>(a: Collection<A>): a is SizedCollection<A> => (
  typeof (a as any).size === 'number' || typeof (a as any).length === 'number'
)

/**
 * Gets the value of the size or length property from a SizedStructure
 * @param a The SizedStructure
 * @internal
 */
export const getSize = (a: SizedCollection<any>): number => (
  typeof (a as { size?: number }).size === 'number'
    ? (a as { size: number }).size
    : (a as { length: number }).length
)

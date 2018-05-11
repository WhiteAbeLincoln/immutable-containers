import { Foldable, foldr, foldMap, Foldable3, Foldable2, Foldable2C, Foldable1, Foldable3C } from 'fp-ts/lib/Foldable'
import { HKT, URIS3, Type3, Type2, URIS2, URIS, Type } from 'fp-ts/lib/HKT'
import { getMonoid } from 'fp-ts/lib/Array'

/**
 * Test whether the structure is empty.
 * @see https://hackage.haskell.org/package/base-4.9.0.0/docs/src/Data.Foldable.html#null
 * @param T The foldable module
 * @param ta A foldable structure
 */
export const empty = <T, A>(T: Foldable<T>) => (ta: HKT<T, A>) =>
  foldr(T)(ta, true, (_1: any, _2: any) => false)

/**
 * Returns the size/length of a finite structure as an Int.
 * @param T The foldable module
 * @param ta A foldable structure
 */
export const length = <T, A>(T: Foldable<T>) => (ta: HKT<T, A>) =>
  foldr(T)(ta, 0, (_, c) => c + 1)

/**
 * Map a function over all the elements of a container and concatenate the resulting lists
 * @param T The foldable module
 * @param f The mapping function
 * @param xs The foldable structure
 */
// tslint:disable:max-line-length
export function concatMap<F extends URIS3>(F: Foldable3<F>): <U, L, A, B>(fa: Type3<F, U, L, A>, f: (a: A) => B[]) => B[]
export function concatMap<F extends URIS3, U, L>(F: Foldable3C<F, U, L>): <A, B>(fa: Type3<F, U, L, A>, f: (a: A) => B[]) => B[]
export function concatMap<F extends URIS2>(F: Foldable2<F>): <L, A, B>(fa: Type2<F, L, A>, f: (a: A) => B[]) => B[]
export function concatMap<F extends URIS2, L>(F: Foldable2C<F, L>): <A, B>(fa: Type2<F, L, A>, f: (a: A) => B[]) => B[]
export function concatMap<F extends URIS>(F: Foldable1<F>): <A, B>(fa: Type<F, A>, f: (a: A) => B[]) => B[]
export function concatMap<F>(F: Foldable<F>): <A, B>(fa: HKT<F, A>, f: (a: A) => B[]) => B[]
export function concatMap<F>(F: Foldable<F>): <A, B>(fa: HKT<F, A>, f: (a: A) => B[]) => B[] {
  return <A, B>(fa: HKT<F, A>, f: ((a: A) => B[])) => foldMap(F, getMonoid<B>())(fa, f)
}
// tslint:enable:max-line-length

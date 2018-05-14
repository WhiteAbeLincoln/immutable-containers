import { equals } from './Prelude'
import { Monad1 } from 'fp-ts/lib/Monad'
import { Functor1 } from 'fp-ts/lib/Functor'
import { Applicative1, Applicative3, Applicative2, Applicative } from 'fp-ts/lib/Applicative'
import { Foldable1 } from 'fp-ts/lib/Foldable'
import { Traversable1 } from 'fp-ts/lib/Traversable'
import { HKT, URIS3, URIS2, URIS, Type, Type2, Type3 } from 'fp-ts/lib/HKT'
import { Extend1 } from 'fp-ts/lib/Extend'

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT<A> {
    Identity: Identity<A>
  }
}

export const URI = 'Identity'
export type URI = typeof URI

export class Identity<A> implements HKT<URI, A> {
  readonly _tag: 'Identity' = 'Identity'
  readonly _A!: A
  readonly _URI!: URI

  constructor(public value: A) {}

  static of<A>(value: A) {
    return new Identity(value)
  }

  map<B>(f: (a: A) => B): Identity<B> {
    return new Identity(f(this.value))
  }

  ap<B>(fab: Identity<(a: A) => B>) {
    return this.map(fab.value)
  }

  reduce<B>(f: (acc: B, curr: A) => B, init: B): B {
    return f(init, this.value)
  }

  traverse<F extends URIS3, U, L, B>(F: Applicative3<F>, f: (a: A) => Type3<F, U, L, B>): Type3<F, U, L, Identity<B>>
  traverse<F extends URIS2, L, B>(F: Applicative2<F>, f: (a: A) => Type2<F, L, B>): Type2<F, L, Identity<B>>
  traverse<F extends URIS, B>(F: Applicative1<F>, f: (a: A) => Type<F, B>): Type<F, Identity<B>>
  traverse<F, B>(F: Applicative<F>, f: (a: A) => HKT<F, B>): HKT<F, Identity<B>>
  traverse<F, B>(F: Applicative<F>, f: (a: A) => HKT<F, B>): HKT<F, Identity<B>> {
    return F.map(f(this.value), Identity.of)
  }

  chain<B>(f: (a: A) => Identity<B>) {
    return f(this.value)
  }

  extend<B>(f: (fa: Identity<A>) => B): Identity<B> {
    return new Identity(f(this))
  }

  equals(other: Identity<A>): boolean {
    return equals(this.value, other.value)
  }

}

export const identity: Functor1<URI>
  & Applicative1<URI>
  & Foldable1<URI>
  & Traversable1<URI>
  & Monad1<URI>
  & Extend1<URI>
= { URI
  , map: (fa, f) => fa.map(f)
  , of: Identity.of
  , ap: (fab, fa) => fa.ap(fab)
  , reduce: (fa, b, f) => fa.reduce(f, b)
  , traverse: F => (ta, f) => ta.traverse(F, f)
  , chain: (fa, f) => fa.chain(f)
  , extend: (ea, f) => ea.extend(f)
}

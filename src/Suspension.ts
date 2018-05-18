import { Lazy } from 'fp-ts/lib/function'

export interface Suspension<T> {
  // the kind is on here so that we can require that the user provides a memoized thunk
  kind: 'suspension'
  (): T
}

const memoize = <A>(thunk: Lazy<A>) => {
  let value: ReturnType<typeof thunk>
  let isForced = false
  // tslint:disable-next-line:only-arrow-functions
  const fun = function() {
    if (!isForced) {
      value = thunk()
      isForced = true
    }
    return value
  } as Suspension<typeof value>

  fun.kind = 'suspension'

  return fun
}

export const delay = <A>(t: Lazy<A>): Suspension<A> => memoize(t)
export const force = <A>(t: Suspension<A> | Lazy<A>) => t()
export const isSuspension = <A>(a: any): a is Suspension<A> =>
  typeof (a as any).kind !== 'undefined' && (a as any).kind === 'suspension'

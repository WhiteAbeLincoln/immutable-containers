
export const lines = (s: string): string[] => s.split('\n')
export const unlines = (xs: string[]): string => xs.join('\n')
export const words = (s: string): string[] => s.split(' ')
export const unwords = (s: string[]) => s.join(' ')

export const isSetoid = (ref: any): ref is { equals: (other: any) => boolean } =>
  !!(ref && typeof ref.equals === 'function')

// from FunFix
// https://github.com/funfix/funfix/blob/a32278985220002c6e68d6aa29f43c7d569a2ba0/packages/funfix-core/src/std.ts#L91
export const equals = <A>(a: A, b: A): boolean => {
  if (a === b || (a !== a && b !== b)) {
    return true
  }

  if (!a || !b) {
    return false
  }

  if (typeof (a as any).valueOf === 'function' && typeof (b as any).valueOf === 'function') {
    const a2 = (a as any).valueOf()
    const b2 = (b as any).valueOf()
    if (a2 === b2 || (a2 !== a2 && b2 !== b2)) {
      return true
    }
    if (!a2 || ! b2) {
      return false
    }
  }

  return !!(isSetoid(a) && a.equals(b))
}

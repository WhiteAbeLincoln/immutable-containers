/**
 * @module Data.Tree
 * Multi-way trees (/aka/ rose trees) and forests.
 *
 * Implements the Rose Tree as found at https://hackage.haskell.org/package/containers-0.5.11.0/docs/Data-Tree.html
 */
import { toString } from 'fp-ts/lib/function'
import { Monad1 } from 'fp-ts/lib/Monad'
import { Functor1 } from 'fp-ts/lib/Functor'
import { Applicative1, Applicative, Applicative3, Applicative2 } from 'fp-ts/lib/Applicative'
import { Foldable1, foldr } from 'fp-ts/lib/Foldable'
import { Traversable1 } from 'fp-ts/lib/Traversable'
import { liftA2 } from 'fp-ts/lib/Apply'
import { iterate, concatMap, takeWhile, map as mapL, List, cons, empty } from '../List/'
import { Extend1 } from 'fp-ts/lib/Extend'
import { HKT, URIS3, URIS2, URIS, Type3, Type2, Type } from 'fp-ts/lib/HKT'
import { list, Collection } from '../List/List'
import { equals } from '../../Prelude'

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT<A> {
    Tree: Tree<A>
  }
}

export const URI = 'Tree'
export type URI = typeof URI

export type Forest<A> = List<Tree<A>>

/**
 * A rose-tree with instance methods
 */
export class Tree<A> implements Collection<A>, HKT<URI, A> {
  readonly _tag: 'Node' = 'Node'
  readonly _A!: A
  readonly _URI!: URI

  get [Symbol.toStringTag]() {
    return 'Tree'
  }

  [Symbol.iterator] = () => (function*(obj: Tree<A>) {
    yield* obj.flatten()
  }(this))

  /**
   * A data constructor for Tree
   * @param rootLabel The tree data for the root
   * @param subForest The children of the root
   */
  // tslint:disable-next-line:variable-name
  static Node = <A>(rootLabel: A) => (subForest: Forest<A>) => new Tree(rootLabel, subForest)

  private constructor(readonly rootLabel: A, readonly subForest: Forest<A>) {}

  inspect(): string {
    return this.toString()
  }

  toString(): string {
    // tslint:disable-next-line:max-line-length
    return `Node {rootLabel = ${toString(this.rootLabel)}, subForest = ${this.subForest.map(t => t.toString())}}`
  }

  static of<A>(rootLabel: A) {
    return Node(rootLabel)(List.zero())
  }

  map<B>(f: ((a: A) => B)): Tree<B> {
    const x = this.rootLabel
    const ts = this.subForest
    /* fmapTree :: (a -> b) -> Tree a -> Tree b
        fmapTree f (Node x ts) = Node (f x) (map (fmapTree f) ts)
    */

    return Node(f(x))(ts.map(t => t.map(f)))
  }

  chain<B>(f: (a: A) => Tree<B>): Tree<B> {
    const x = this.rootLabel
    const ts = this.subForest

    const apply = f(x)
    const x1 = apply.rootLabel
    const ts1 = apply.subForest

    /* Node x ts >>= f = case f x of
          Node x' ts' -> Node x' (ts' ++ map (>>= f) ts)
    */
    return Node(x1)(ts1.alt(ts.map(t => t.chain(f))))
  }

  ap<B>(fab: Tree<(a: A) => B>): Tree<B> {
    // const f = fab.rootLabel
    // const tfs = fab.subForest
    // const tx = this
    // const x = this.rootLabel
    // const txs = this.subForest

    // const rest = txs.map(t => t.map(f)).concat(tfs.map(t => tx.ap(t)))

    // return new Node(f(x), rest)

    return fab.chain(f => this.map(f))
  }

  // This is a foldl. Should be a foldr?
  reduce<B>(b: B, f: (b: B, a: A) => B): B {
    const x = this.rootLabel
    const ts = this.subForest
    const first = f(b, x)

    return ts.reduce((p, c) => c.reduce(p, f), first)
  }

  traverse<F extends URIS3, U, L, B>(F: Applicative3<F>, f: (a: A) => Type3<F, U, L, B>): Type3<F, U, L, Tree<B>>
  traverse<F extends URIS2, L, B>(F: Applicative2<F>, f: (a: A) => Type2<F, L, B>): Type2<F, L, Tree<B>>
  traverse<F extends URIS, B>(F: Applicative1<F>, f: (a: A) => Type<F, B>): Type<F, Tree<B>>
  traverse<F, B>(F: Applicative<F>, f: (a: A) => HKT<F, B>): HKT<F, Tree<B>>
  traverse<F, B>(F: Applicative<F>, f: (a: A) => HKT<F, B>): HKT<F, Tree<B>> {
    const x = this.rootLabel
    const ts = this.subForest
    /* traverse f (Node x ts) = liftA2 Node (f x) (traverse (traverse f) ts) */
    return liftA2(F)((b: B) => Node(b))(f(x))(ts.traverse(F, t => t.traverse(F, f)))
  }

  extend<B>(f: (t: Tree<A>) => B): Tree<B> {
    return new Tree(f(this), this.subForest.map(ts => ts.extend(f)))
  }

  flatten(): List<A> {
    return flatten(this)
  }

  levels(): List<List<A>> {
    return levels(this)
  }

  foldTree<B>(f: ((a: A) => (b: List<B>) => B)): B {
    return foldTree(f)(this)
  }

  drawTree(f?: (a: A) => string): string {
    return drawTree(this.map(f || toString))
  }

  drawForest(f?: (a: A) => string): string {
    return drawForest(this.subForest.map(t => t.map(f || toString)))
  }

  equals(other: Tree<A>) {
    return equals(this.rootLabel, other.rootLabel) && equals(this.subForest, other.subForest)
  }
}

/**
 * A data constructor for Tree
 * @param rootLabel The tree data for the root
 * @param subForest The children of the root
 */
export const Node = Tree.Node
/**
 * Extracts the rootLabel from a tree
 * @param t The tree
 */
export const rootLabel = <A>(t: Tree<A>) => t.rootLabel
/**
 * Extracts the subForest from a tree
 * @param t The tree
 */
export const subForest = <A>(t: Tree<A>) => t.subForest

/* * * * * * * * * * * * * *
 * Two-dimensional drawing *
 * * * * * * * * * * * * * */
export const drawTree = (_tree: Tree<string>): string => {
  throw new Error('Not Implemented')
}

export const drawForest = (_forest: Forest<string>): string => {
  throw new Error('Not Implemented')
}

/* * * * * * * *
 * Extraction  *
 * * * * * * * */

/**
 * The elements of a tree in pre-order.
 * @param tree The tree to flatten
 */
export const flatten = <A>(tree: Tree<A>): List<A> => squish(tree)(List.zero())

const squish = <A>(tree: Tree<A>) => (xs: List<A>): List<A> => {
  const x = tree.rootLabel
  const ts = tree.subForest
  return cons(x)(foldr(list)(ts, xs, (a, b) => squish(a)(b)))
}

/**
 * Lists of nodes at each level of the tree.
 * @param tree The tree
 */
export const levels = <A>(tree: Tree<A>): List<List<A>> => {
  const one = iterate((xs: List<Tree<A>>) => concatMap(xs, subForest))(List.of(tree))
  const two = takeWhile<List<Tree<A>>>(x => !empty(x))(one)
  return mapL((t: List<Tree<A>>) => t.map(rootLabel))(two)
}

/**
 * Catamorphism on trees.
 */
export const foldTree = <A, B>(f: ((a: A) => (b: List<B>) => B)) => {
  return function go(tree: Tree<A>): B {
    const x = tree.rootLabel
    const ts = tree.subForest

    return f(x)(ts.map(go))
  }
}

/* * * * * * * * * *
 * Building trees  *
 * * * * * * * * * */

/**
 * Build a tree from a seed value
 * @param _f A function to build the tree
 * @param _b The seed value
 */
export const unfoldTree = <A, B>(_f: (b: B) => [A, B[]]) => (_b: B): Tree<A> => {
  throw new Error('Not Implemented')
}

/**
 * Build a forest from a list of seed values
 * @param _f A function to build the forest
 * @param _b The list of seed values
 */
export const unfoldForest = <A, B>(_f: (b: B) => [A, B[]]) => (_b: B[]): Forest<A> => {
  throw new Error('Not Implemented')
}

/* * * * * * * * *
 * fp-ts module  *
 * * * * * * * * */

export const tree: Monad1<URI>
                 & Functor1<URI>
                 & Applicative1<URI>
                 & Foldable1<URI>
                 & Extend1<URI>
                 & Traversable1<URI> = {
  URI
, of: Tree.of
, map: (fa, f) => fa.map(f)
, ap: (fab, fa) => fa.ap(fab)
, chain: (fa, f) => fa.chain(f)
, reduce: (fa, b, f) => fa.reduce(b, f)
, traverse: F => (ta, f) => ta.traverse(F, f)
, extend: (ea, f) => ea.extend(f)
}

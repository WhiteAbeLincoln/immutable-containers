import { Tree, Node, tree as module } from './Tree'
import { List } from '../List'
import { functorTest } from '../../test/utils'

describe('Tree', () => {
  const tree = Node('hi')(List.of(
    Node('there')(List.zero()),
    Node('you')(List.of(
      Tree.of('man')
    )),
    Node('man')(List.zero()),
  ))

  it('constructs using Tree.of', () => {
    expect(() => { Tree.of(1) }).not.toThrow()
  })

  it('constructs using Tree.Node', () => {
    expect(() => { Tree.Node(1)(List.zero()) }).not.toThrow()
  })

  it('allows iteration multiple times and gives a preorder traversal', () => {

    expect([...tree]).toEqual(['hi', 'there', 'you', 'man', 'man'])
    expect([...tree]).toEqual(['hi', 'there', 'you', 'man', 'man'])
  })

  it('sets Symbol.toStringTag', () => {
    expect(Object.prototype.toString.call(Tree.of(1))).not.toBe('[object Object]')
  })

  it('has Node(1, []) equal Node(1, []', () => {
    const t1 = Node(1)(List.zero())
    const t2 = Node(1)(List.zero())

    expect(t1.equals(t2)).toBeTruthy()
    expect(t2.equals(t1)).toBeTruthy()
  })

  it('has Node(1, [Node(2, [])]) equal Node(1, [Node(2, [])])', () => {
    const t1 = Node(1)(List.of(Tree.of(2)))
    const t2 = Node(1)(List.of(Tree.of(2)))

    expect(t1.equals(t2)).toBeTruthy()
    expect(t2.equals(t1)).toBeTruthy()
  })

  describe('Functor instance', () => {
    it('defines map', () => {
      expect(tree.map).not.toBe(undefined)
    })

    it('fulfills the Functor laws', () => {
      functorTest(module, Tree.of(1))
    })
  })
})

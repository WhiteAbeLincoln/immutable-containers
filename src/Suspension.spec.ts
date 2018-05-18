import { delay, force } from './Suspension'

describe('Suspension', () => {
  it('calls the inner function only once', () => {
    const fun = jest.fn(() => Math.random())
    const sus = delay(fun)
    force(sus)
    force(sus)
    expect(fun).toHaveBeenCalledTimes(1)
  })

  it('memoizes the returned value', () => {
    const fun = () => Math.random()
    const sus = delay(fun)
    expect(force(sus)).toEqual(force(sus))
  })

  it('creates a suspension', () => {
    const fun = () => Math.random()
    const sus = delay(fun)
    expect(sus.kind).toEqual('suspension')
  })
})

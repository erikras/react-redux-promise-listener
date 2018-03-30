import React from 'react'
import TestUtils from 'react-dom/test-utils'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import createListener from 'redux-promise-listener'
import MakeAsyncFunction from './MakeAsyncFunction'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const minimalMockProps = {
  listener: {
    createAsyncFunction: () => {}
  },
  start: 'mock',
  resolve: 'mock',
  reject: 'mock'
}

describe('MakeAsyncFunction', () => {
  it('should print a warning with no children render function specified', () => {
    const spy = jest.spyOn(global.console, 'error').mockImplementation(() => {})
    TestUtils.renderIntoDocument(<MakeAsyncFunction {...minimalMockProps} />)
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(
      'Warning: Must provide a render function as children'
    )
    spy.mockRestore()
  })

  it('should dispatch start action, and resolve on resolve action', async () => {
    const reducer = jest.fn((state, action) => state)
    const resolve = jest.fn()
    const reject = jest.fn()
    const initialState = {}
    const listener = createListener()

    const store = createStore(
      reducer,
      initialState,
      applyMiddleware(listener.middleware)
    )
    expect(reducer).toHaveBeenCalled()
    expect(reducer).toHaveBeenCalledTimes(1)
    expect(reducer.mock.calls[0][0]).toBe(initialState)
    expect(reducer.mock.calls[0][1]).toEqual({ type: '@@redux/INIT' })

    const dom = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <MakeAsyncFunction
          listener={listener}
          start="SAVE"
          resolve="SAVE_SUCCESS"
          reject="SAVE_ERROR"
        >
          {save => {
            expect(save).toBeDefined()
            expect(typeof save).toBe('function')
            return (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    save().then(resolve, reject)
                  }}
                />
              </div>
            )
          }}
        </MakeAsyncFunction>
      </Provider>
    )
    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    expect(button).toBeDefined()

    TestUtils.Simulate.click(button)

    expect(reducer).toHaveBeenCalledTimes(2)
    expect(reducer.mock.calls[1][1]).toEqual({ type: 'SAVE' })

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).not.toHaveBeenCalled()

    await sleep(1)

    store.dispatch({ type: 'SAVE_SUCCESS', payload: 'Awesome!' })

    await sleep(1)

    expect(resolve).toHaveBeenCalled()
    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve.mock.calls[0][0]).toBe('Awesome!')
    expect(reject).not.toHaveBeenCalled()
  })

  it('should dispatch start action, and reject on reject action', async () => {
    const reducer = jest.fn((state, action) => state)
    const resolve = jest.fn()
    const reject = jest.fn()
    const initialState = {}
    const listener = createListener()

    const store = createStore(
      reducer,
      initialState,
      applyMiddleware(listener.middleware)
    )
    expect(reducer).toHaveBeenCalled()
    expect(reducer).toHaveBeenCalledTimes(1)
    expect(reducer.mock.calls[0][0]).toBe(initialState)
    expect(reducer.mock.calls[0][1]).toEqual({ type: '@@redux/INIT' })

    const dom = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <MakeAsyncFunction
          listener={listener}
          start="SAVE"
          resolve="SAVE_SUCCESS"
          reject="SAVE_ERROR"
        >
          {save => {
            expect(save).toBeDefined()
            expect(typeof save).toBe('function')
            return (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    save().then(resolve, reject)
                  }}
                />
              </div>
            )
          }}
        </MakeAsyncFunction>
      </Provider>
    )
    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    expect(button).toBeDefined()

    TestUtils.Simulate.click(button)

    expect(reducer).toHaveBeenCalledTimes(2)
    expect(reducer.mock.calls[1][1]).toEqual({ type: 'SAVE' })

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).not.toHaveBeenCalled()

    await sleep(1)

    store.dispatch({ type: 'SAVE_ERROR', payload: 'Bummer!' })

    await sleep(1)

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).toHaveBeenCalled()
    expect(reject).toHaveBeenCalledTimes(1)
    expect(reject.mock.calls[0][0]).toBe('Bummer!')
  })

  it('should accept changes to action props', async () => {
    const reducer = jest.fn((state, action) => state)
    const resolve = jest.fn()
    const reject = jest.fn()
    const initialState = {}
    const listener = createListener()

    const store = createStore(
      reducer,
      initialState,
      applyMiddleware(listener.middleware)
    )
    expect(reducer).toHaveBeenCalled()
    expect(reducer).toHaveBeenCalledTimes(1)
    expect(reducer.mock.calls[0][0]).toBe(initialState)
    expect(reducer.mock.calls[0][1]).toEqual({ type: '@@redux/INIT' })

    class Container extends React.Component {
      state = {
        resolveAction: 'SAVE_SUCCESS'
      }

      render() {
        return (
          <div>
            <MakeAsyncFunction
              listener={listener}
              start="SAVE"
              resolve={this.state.resolveAction}
              reject="SAVE_ERROR"
            >
              {save => {
                expect(save).toBeDefined()
                expect(typeof save).toBe('function')
                return (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        save().then(resolve, reject)
                      }}
                    />
                  </div>
                )
              }}
            </MakeAsyncFunction>
            <span
              onClick={() =>
                this.setState({ resolveAction: 'OTHER_SAVE_SUCCESS' })
              }
            >
              Change Action
            </span>
          </div>
        )
      }
    }

    const dom = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Container />
      </Provider>
    )

    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    const changeAction = TestUtils.findRenderedDOMComponentWithTag(dom, 'span')
    expect(button).toBeDefined()
    expect(changeAction).toBeDefined()

    TestUtils.Simulate.click(button)

    expect(reducer).toHaveBeenCalledTimes(2)
    expect(reducer.mock.calls[1][1]).toEqual({ type: 'SAVE' })

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).not.toHaveBeenCalled()

    await sleep(1)

    store.dispatch({ type: 'SAVE_SUCCESS', payload: 'Great!' })

    await sleep(1)

    expect(resolve).toHaveBeenCalled()
    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve.mock.calls[0][0]).toBe('Great!')
    expect(reject).not.toHaveBeenCalled()

    TestUtils.Simulate.click(changeAction)

    // Click save again

    TestUtils.Simulate.click(button)

    expect(reducer).toHaveBeenCalledTimes(4)
    expect(reducer.mock.calls[3][1]).toEqual({ type: 'SAVE' })

    await sleep(1)

    // old save action should not trigger resolve
    expect(resolve).toHaveBeenCalledTimes(1)
    store.dispatch({ type: 'SAVE_SUCCESS', payload: 'Great again!' })
    await sleep(1)
    expect(resolve).toHaveBeenCalledTimes(1)

    // new save action should
    store.dispatch({ type: 'OTHER_SAVE_SUCCESS', payload: 'Also great!' })

    await sleep(1)
    expect(resolve).toHaveBeenCalledTimes(2)
    expect(resolve.mock.calls[1][0]).toBe('Also great!')
    expect(reject).not.toHaveBeenCalled()
  })

  it('should unsubscribe on unmount', async () => {
    const reducer = jest.fn((state, action) => state)
    const initialState = {}
    const listener = createListener()

    const store = createStore(
      reducer,
      initialState,
      applyMiddleware(listener.middleware)
    )

    class Container extends React.Component {
      state = {
        showComponent: true
      }

      render() {
        return (
          <div>
            {this.state.showComponent && (
              <MakeAsyncFunction
                listener={listener}
                start="SAVE"
                resolve="SAVE_SUCCESS"
                reject="SAVE_ERROR"
              >
                {save => <div />}
              </MakeAsyncFunction>
            )}
            <button onClick={() => this.setState({ showComponent: false })}>
              Unmount
            </button>
          </div>
        )
      }
    }

    const dom = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Container />
      </Provider>
    )

    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    expect(button).toBeDefined()

    TestUtils.Simulate.click(button)
  })
})

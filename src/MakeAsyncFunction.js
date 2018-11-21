// @flow
import * as React from 'react'
import PropTypes from 'prop-types'
import type {
  AsyncFunction,
  Config,
  PromiseListener
} from 'redux-promise-listener'

type ChildrenAndListener = {
  children: ((any) => Promise<any>) => void,
  listener: PromiseListener
}

type Props = Config & ChildrenAndListener
type State = { asyncFunction?: AsyncFunction }

export default class MakeAsyncFunction extends React.Component<Props, State> {
  props: Props
  state: State

  static propTypes = {
    children: PropTypes.func.isRequired,
    listener: PropTypes.object.isRequired,
    start: PropTypes.string.isRequired,
    resolve: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    reject: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    setPayload: PropTypes.func,
    getPayload: PropTypes.func,
    getError: PropTypes.func
  }

  constructor(props: Props) {
    super(props)
    if (
      process.env.NODE_ENV !== 'production' &&
      typeof props.children !== 'function'
    ) {
      console.error('Warning: Must provide a render function as children')
    }
    const {
      listener,
      start,
      resolve,
      reject,
      setPayload,
      getPayload,
      getError
    } = props
    this.state = {
      asyncFunction: listener.createAsyncFunction({
        start,
        resolve,
        reject,
        setPayload,
        getPayload,
        getError
      })
    }
  }

  unsubscribe = () => {
    if (this.state.asyncFunction) {
      this.state.asyncFunction.unsubscribe()
    }
  }

  createAsyncFunction = () => {
    const {
      listener,
      start,
      resolve,
      reject,
      setPayload,
      getPayload,
      getError
    } = this.props
    this.unsubscribe()
    this.setState({
      asyncFunction: listener.createAsyncFunction({
        start,
        resolve,
        reject,
        setPayload,
        getPayload,
        getError
      })
    })
  }

  componentDidMount() {
    this.createAsyncFunction()
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.start !== this.props.start ||
      prevProps.resolve !== this.props.resolve ||
      prevProps.reject !== this.props.reject
    ) {
      this.createAsyncFunction()
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    return this.props.children && this.state.asyncFunction
      ? this.props.children(this.state.asyncFunction.asyncFunction)
      : null
  }
}

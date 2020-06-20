import { hot } from 'react-hot-loader/root'
import React from 'react'

import SnakePage from './pages/snake/SnakePage'

const App = () => {
  return (
    <div className="app">
      <SnakePage />
    </div>
  )
}

export default hot(App)

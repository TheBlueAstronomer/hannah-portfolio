import { useState } from 'react'

import { About, Footer, Header, Testimonial, Portfolio} from './container'
import { Navbar } from './components'

import './App.scss'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className = "app">
      <Navbar />
      <Header />
      <About />
      <Portfolio />
      <Testimonial />
      <Footer />
    </div>
  )
}

export default App

import React from 'react'
import { easeIn, motion } from 'framer-motion'
import { images } from '../../constants'

import './Header.scss'

const scaleVariants = {
  whileInView: {
    scale: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 1,
      ease: 'easeInOut'
    }
  }
}

function Header() {
  return (
    <div className='app__header app__flex' id = 'home'>
      <motion.div
        whileInView={{ x: [-100, 0], opacity: [0, 1] }}
        transition={{ duration: 0.5 }}
        className="app__header-info"
      >
        <div className='app__header-badge'>
          <div className='badge-cmp'>
              <p className='p-text'>Hello there, Nice to meet you ❤️, I AM</p>
              <h1 className='head-text'>Hannah</h1>
          </div>
          <div className='tag-cmp '>
            <p className='p-text'>Freelance Writer and film critic with a history of working in the publishing industry.</p>

          </div>
        </div>
      </motion.div>

      <motion.div
        whileInView={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, delayChildren: 0.5 }}
        className="app__header-img"
      >
        <img src={images.profile} alt="profile_bg" />
      </motion.div>

    </div>
  )
}

export default Header
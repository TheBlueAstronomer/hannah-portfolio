import React, { useState } from 'react';
import { images } from '../../constants';
import { HiMenu, HiX } from 'react-icons/hi'
import { BsTwitter, BsInstagram, BsLinkedin, BsFacebook } from 'react-icons/bs'
import { motion } from 'framer-motion'

import './Navbar.scss'

export default function Navbar() {

  const [toggle, setToggle] = useState(false)


  return (
    <nav className="app__navbar">
      <div className="app__navbar-logo">
        <img src={images.logoSimple} alt="logo" />
      </div>
      <ul className="app__navbar-links">
        {['portfolio', 'about me', 'testimonials', 'contact'].map((item) => (
          <li className="app__flex p-text" key={`link-${item}`}>
            <a href={`#${item}`}>{item}</a>
          </li>
        ))}
      </ul>

      <div className='app__navbar-social'>
        <ul className='app__navbar-social-icons'>
          <li className="app__flex p-text">
            <a href="https://www.linkedin.com/in/hannahrachelabraham/" target="_blank">
              <BsLinkedin />
            </a>
          </li>

          <li className="app__flex p-text">
            <a href="https://twitter.com/HAN_NA_NA_NAH" target="_blank">
              <BsTwitter />
            </a>
          </li>

          <li className="app__flex p-text">
            <a href="https://www.instagram.com/han_na_na_nah/" target="_blank">
              <BsInstagram />
            </a>
          </li>
        </ul>
      </div>

      <div className="app__navbar-menu">
        <HiMenu onClick={() => setToggle(true)} />

        {toggle && (
          <motion.div
            whileInView={{ x: [300, 0] }}
            transition={{ duration: 0.85, ease: 'easeInOut' }}
          >
            <HiX onClick={() => setToggle(false)} />
            <ul>
              {['home', 'about', 'work', 'skills', 'contact'].map((item) => (
                <li key={item}>
                  <a href={`#${item}`} onClick={() => setToggle(false)}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>

            <ul className='app__navbar-menu-social-icons' id = "app__navbar-menu-social-icons">
              <li className="app__flex p-text">
                <a href="https://www.linkedin.com/in/hannahrachelabraham/" target="_blank">
                  <BsLinkedin />
                </a>
              </li>

              <li className="app__flex p-text">
                <a href="https://twitter.com/HAN_NA_NA_NAH" target="_blank">
                  <BsTwitter />
                </a>
              </li>

              <li className="app__flex p-text">
                <a href="https://www.instagram.com/han_na_na_nah/" target="_blank">
                  <BsInstagram />
                </a>
              </li>
            </ul>


          </motion.div>
        )}
      </div>
    </nav>
  )
}

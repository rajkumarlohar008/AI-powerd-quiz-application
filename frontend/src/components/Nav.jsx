import React from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react';

const Nav = () => {
  let user = JSON.parse(localStorage.getItem('user'));
  function handleMenu(){
    console.log("hello");
  }
  return (
    <div className='bg-[#093C5D] py-5 px-8 flex items-center justify-between md:justify-start md:gap-10'>
      <Link to={'/'}
        className=' text-white self-center text-xl font-bold hover:text-gray-400 active:scale-95'>
        Home</Link>

      <div>
        <Menu
        onClick={handleMenu}
        className='hidden text-white hover:text-gray-400 active:scale-85' />
        {localStorage.getItem('user') ?
        user.role == 'admin' ?
          <Link to={'/admin'}
            className=' text-white self-center text-xl font-bold hover:text-gray-400 active:scale-95 '
          >Admin</Link>
          : ''
        : ''}
      </div>
    </div>
  )
}

export default Nav

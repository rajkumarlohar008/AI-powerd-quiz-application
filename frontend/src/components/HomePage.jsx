import React from 'react'
import Scene from './Scene'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Link } from 'react-router-dom'

const HomePage = () => {
    return (
        <div className='relative
            h-screen
            w-full
            overflow-hidden
            bg-linear-to-br
            from-black
            via-slate-900
            to-purple-950
            flex
            flex-col
            items-center
            justify-around'>
            <h1
                className='z-10
                mt-10
                pt-10
                px-4
                text-3xl
                md:text-5xl
                lg:text-6xl
                font-extrabold
                text-center
                leading-tight
                bg-linear-to-r
                from-cyan-400
                via-blue-500
                to-purple-500
                bg-clip-text
                text-transparent
                drop-shadow-lg'
            >Welcome to Quiz Application</h1>
             <div className='h-[70vh] w-full '>

                <Canvas camera={{ fav: 30, position: [0, 2, 5] }}>

                    <OrbitControls enableZoom={false}/>

                    <Scene />

                    {/* <EffectComposer> */}

                    {/* </EffectComposer> */}

                </Canvas>

            </div>
            <Link
                to={'/dashboard'}
                className=' z-10
                mb-10
                px-10
                py-4
                rounded-full
                text-lg
                md:text-2xl
                font-bold
                text-white
                bg-linear-to-r
                from-cyan-500
                to-purple-600
                hover:scale-105
                active:scale-95
                transition-all
                duration-300
                shadow-lg
                hover:shadow-[0_0_40px_rgba(168,85,247,0.8)]'
            >Get Started</Link>
        </div>
    )
}

export default HomePage

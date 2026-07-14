import React from 'react'
import Scene from './Scene'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Link } from 'react-router-dom'
import { GenerateButton } from './ui/GenerateButton';

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
            to={"/dashboard"}
            >
                <GenerateButton 
                className='mb-10'
                />
            </Link>
        </div>
    )
}

export default HomePage

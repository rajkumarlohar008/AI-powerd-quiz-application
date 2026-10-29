import React from 'react'
import Scene from './Scene'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Link } from 'react-router-dom'
import { GenerateButton } from './ui/GenerateButton';
import ThemeToggle from './ThemeToggle';

const HomePage = () => {
    return (
        <div className='relative h-screen w-full overflow-hidden theme-page-bg flex flex-col items-center justify-around'>
              <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none' />
          
            <div className='theme-fab'>
                <ThemeToggle />
            </div>
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
                gradient-heading
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

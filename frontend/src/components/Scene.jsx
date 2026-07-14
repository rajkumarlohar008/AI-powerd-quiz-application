import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const CurvedText = ({ text, radius }) => {
    // Duplicate or pad the text if you want it to wrap tightly all around the cylinder
    // const repeatedText = `${text} • ${text} • `; 
    const letters = (text + "   ").split('');

    return letters.map((letter, i) => {
        const angle = (i / letters.length) * Math.PI * 2;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
            <Text
                key={i}
                position={[x, 0, z]}
                rotation={[0, -angle + Math.PI / 2, 0]}
                // 1. Significantly increased font size
                fontSize={0.55} 
                // 2. Added a heavy weight system font fallback
                // font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLte5LY6dfjaWff97AgA.woff" 
                fontWeight="900" // Maximum thickness
                color="white"
                anchorX="center"
                anchorY="middle"
                // 3. Optional: Add an outline to make letters look even thicker/heavier
                outlineWidth={0.02}
                outlineColor="white"
            >
                {letter}
            </Text>
        );
    });
};

const Scene = () => {
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * -0.25;
        }
    });

    return (
        <group ref={ref}>
            {/* Cylinder */}
            <mesh>
                <cylinderGeometry args={[2, 2, 2, 64, 1, true]} />
                <meshBasicMaterial
                    color="#4f46e5" 
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0} 
                />
            </mesh>

            {/* Wrapped Text */}
            <CurvedText
                // Pro-Tip: If you want it to perfectly blanket the whole cylinder, 
                // repeat the text string once like: "WELCOME TO QUIZ APPLICATION • WELCOME TO QUIZ APPLICATION"
                text=" ^_^ YSAE GNINRAEL RUOY EKAM"
                radius={2.1} 
            />
        </group>
    );
};

export default Scene;
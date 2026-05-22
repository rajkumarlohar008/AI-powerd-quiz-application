import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const CurvedText = ({ text, radius }) => {
    const letters = text.split('');

    return letters.map((letter, i) => {
        const angle =
            (i / letters.length) * Math.PI - Math.PI / 2;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
            <Text
                key={i}
                position={[x, 0, z]}
                rotation={[0, -angle, 0]}
                fontSize={0.25}
                color="white"
                anchorX="center"
                anchorY="middle"
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
            ref.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <group ref={ref}>

            {/* Cylinder */}
            <mesh>
                <cylinderGeometry args={[2, 2, 2, 64, 1, true]} />
                <meshBasicMaterial
                    color="orange"
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Wrapped Text */}
            <CurvedText
                text="WELCOME TO QUIZ APPLICATION"
                radius={2.05}
            />

        </group>
    );
};

export default Scene;
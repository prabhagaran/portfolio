"use client";

import { Component, Suspense, useMemo, type ReactNode } from "react";
import type * as THREE from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { STLLoader } from "three-stdlib";

function STLMesh({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url) as THREE.BufferGeometry;

  const scale = useMemo(() => {
    geometry.center();
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere?.radius || 1;
    return radius > 0 ? 1.6 / radius : 1;
  }, [geometry]);

  return (
    // STL files are conventionally Z-up; rotate onto three.js's Y-up.
    <mesh geometry={geometry} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#3b82f6" metalness={0.2} roughness={0.4} />
    </mesh>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-2 whitespace-nowrap font-mono text-xs text-muted">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-line border-t-accent" />
        Loading model…
      </div>
    </Html>
  );
}

class ViewerErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function STLModelViewer({ url }: { url: string }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card border border-line bg-background/60 sm:aspect-video">
      <ViewerErrorBoundary
        fallback={
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm text-muted">
              Couldn&apos;t load this model — the host may not allow cross-origin access.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent underline underline-offset-4"
            >
              Open the .stl file directly
            </a>
          </div>
        }
      >
        <Canvas camera={{ position: [2.4, 1.8, 2.4], fov: 42 }} dpr={[1, 2]}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 4]} intensity={1.4} color="#fff4e0" />
          <directionalLight position={[-4, -1, -3]} intensity={0.35} color="#3b82f6" />
          <gridHelper args={[4, 8, "#1e293b", "#141b26"]} position={[0, -1, 0]} />
          <Suspense fallback={<Loader />}>
            <STLMesh url={url} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            autoRotate
            autoRotateSpeed={1.1}
            minDistance={1.2}
            maxDistance={8}
          />
        </Canvas>
      </ViewerErrorBoundary>
    </div>
  );
}

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import GUI from "lil-gui";
import {Text} from  'troika-three-text'

const uniforms = {
  uTime: { value: 0 },
  uPositionFrequency: { value: 1.19 },
  uPositionStrength: { value: 0.69 },
  uTimeFrequency: { value: 0.51 },
  uSmallWavePositionFrequency: { value: 1.64 },
  uSmallWavePositionStrength: { value: 0.13 },
  uSmallWaveTimeFrequency: { value: 0.41 },
};

export default function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    // Remove existing children to prevent duplicate renders
    while (mount.firstChild) {
      mount.removeChild(mount.firstChild);
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Setup renderer clock (fix: add clock, otherwise getElapsedTime will fail)
    renderer.clock = new THREE.Clock();

    // Load HDRI environment
    let disposed = false;
    const rgbeLoader = new RGBELoader();

    rgbeLoader.load(
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        // scene.background = texture
      },
      undefined,
      (err) => {
        console.error("Error loading HDRI:", err);
      }
    );

    const material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      // color: "#ff0000", // ensure pure red color
      map: new THREE.TextureLoader().load('./gradient/4.png'),
      metalness: 0,
      roughness: 0.3, // higher roughness makes diffuse color more prominent
      vertexShader,
      // fragmentShader,
      uniforms,
    });

    // Fix: create tangents for geometry and use merged geometry for smooth animation
    const mergedGeometry = mergeVertices(new THREE.IcosahedronGeometry(1, 70));
    mergedGeometry.computeTangents();
    const sphere = new THREE.Mesh(mergedGeometry, material);
    scene.add(sphere);

    // LIL-GUI SETUP
    const gui = new GUI();
    // Folder for Main Wave
    const mainWaveFolder = gui.addFolder("Large Wave");
    mainWaveFolder.add(uniforms.uPositionFrequency, "value", 0, 5, 0.01).name("Position Frequency");
    mainWaveFolder.add(uniforms.uPositionStrength, "value", 0, 2, 0.01).name("Position Strength");
    mainWaveFolder.add(uniforms.uTimeFrequency, "value", 0, 5, 0.01).name("Time Frequency");
    mainWaveFolder.close();

    // Folder for Small Wave
    const smallWaveFolder = gui.addFolder("Small Wave");
    smallWaveFolder.add(uniforms.uSmallWavePositionFrequency, "value", 0, 10, 0.01).name("Position Freq");
    smallWaveFolder.add(uniforms.uSmallWavePositionStrength, "value", 0, 2, 0.01).name("Position Strength");
    smallWaveFolder.add(uniforms.uSmallWaveTimeFrequency, "value", 0, 10, 0.01).name("Time Freq");
    smallWaveFolder.close();

    // Animation loop
    let frameId;
    function animate() {
      uniforms.uTime.value = renderer.clock.getElapsedTime();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    // Handle window resize
    function handleResize() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      mergedGeometry.dispose();
      material.dispose();
      gui.destroy();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}

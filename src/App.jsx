import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import CustomShaderMaterial from "three-custom-shader-material/vanilla"; // using this for shineness ,vertex and fragment shaders
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export default function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    // Prevent duplicate renderer DOM element
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

    // Load HDRI environment
    let disposed = false;
    const rgbeLoader = new RGBELoader();

    rgbeLoader.load(
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr",
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
      },
      undefined,
      (err) => {
        console.error("Error loading HDRI:", err);
      }
    );

    // Geometry and Material

    // Use MeshPhysicalMaterial for reflections, but cannot use custom shaders here
    // const material = new THREE.MeshPhysicalMaterial({
    //   metalness: 1.0,
    //   roughness: 0.05,
    //   clearcoat: 1.0,
    //   clearcoatRoughness: 0.05,
    //   color:'red'
    //   // envMap is set automatically from scene.environment
    // });

    // If you want to use custom vertex/fragment shader instead:
    // const material = new THREE.ShaderMaterial({
    //   vertexShader,
    //   fragmentShader,
    // });

    const material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      // metalness: 1.0,
      // roughness: 0.05,
      // clearcoat: 1.0,
      // clearcoatRoughness: 0.05,
      color: "red",
      vertexShader,
      fragmentShader,
      // envMap handled by scene.environment
    });

    // creating tangents here for animating at each point
    const mergedeGeometry = mergeVertices(new THREE.IcosahedronGeometry(1, 70)); //  for smooth curves an animation bcz the are closely packed
    mergedeGeometry.computeTangents();
    const sphere = new THREE.Mesh(mergedeGeometry, material);
    scene.add(sphere);

    // Animation loop
    let frameId;
    function animate() {
      sphere.rotation.y += 0.01;
      sphere.rotation.x += 0.005;
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
      mergedeGeometry.dispose();
      material.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}

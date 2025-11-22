import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import GUI from "lil-gui";
import { Text } from "troika-three-text";
import textVertexShader from "./shaders/textVertexShader.glsl";
import gsap from "gsap";

let isAnimating = false;
let currentIndex = 0;

const blobs = [
  {
    name: "Color Fusion",
    background: "#9D73F7",
    config: {
      uPositionFrequency: 1,
      uPositionStrength: 0.3,
      uSmallWavePositionFrequency: 0.5,
      uSmallWavePositionStrength: 0.7,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.5,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "cosmic-fusion",
    },
  },
  {
    name: "Purple Mirror",
    background: "#5300B1",
    config: {
      uPositionFrequency: 0.584,
      uPositionStrength: 0.276,
      uSmallWavePositionFrequency: 0.899,
      uSmallWavePositionStrength: 1.266,
      roughness: 0,
      metalness: 1,
      envMapIntensity: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "purple-Rain",
    },
  },
  {
    name: "Alien Goo",
    background: "#45ACD8",
    config: {
      uPositionFrequency: 1.022,
      uPositionStrength: 0.99,
      uSmallWavePositionFrequency: 0.378,
      uSmallWavePositionStrength: 0.341,
      roughness: 0.292,
      metalness: 0.73,
      envMapIntensity: 0.86,
      clearcoat: 1,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "lucky-Day",
    },
  },
];

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

    // Three.js Loading Manager
    const loadingManager = new THREE.LoadingManager();

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#333");

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

    // Load HDRI environment using loadingManager
    let disposed = false;
    const rgbeLoader = new RGBELoader(loadingManager);

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

    // Load texture using TextureLoader and loadingManager
    const textureLoader = new THREE.TextureLoader(loadingManager);

    const material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      // color: "#ff0000", // ensure pure red color
      map: textureLoader.load(
        `./gradient/${blobs[currentIndex].config.map}.png`
      ),
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
    mainWaveFolder
      .add(uniforms.uPositionFrequency, "value", 0, 5, 0.01)
      .name("Position Frequency");
    mainWaveFolder
      .add(uniforms.uPositionStrength, "value", 0, 2, 0.01)
      .name("Position Strength");
    mainWaveFolder
      .add(uniforms.uTimeFrequency, "value", 0, 5, 0.01)
      .name("Time Frequency");
    mainWaveFolder.close();

    // Folder for Small Wave
    const smallWaveFolder = gui.addFolder("Small Wave");
    smallWaveFolder
      .add(uniforms.uSmallWavePositionFrequency, "value", 0, 10, 0.01)
      .name("Position Freq");
    smallWaveFolder
      .add(uniforms.uSmallWavePositionStrength, "value", 0, 2, 0.01)
      .name("Position Strength");
    smallWaveFolder
      .add(uniforms.uSmallWaveTimeFrequency, "value", 0, 10, 0.01)
      .name("Time Freq");
    smallWaveFolder.close();

    // Animation loop
    let frameId;
    function animate() {
      uniforms.uTime.value = renderer.clock.getElapsedTime();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    const textMaterial = new THREE.ShaderMaterial({
      vertexShader: textVertexShader,
      fragmentShader: "void main(){ gl_FragColor = vec4(1.0);}",
      side: THREE.DoubleSide,
      uniforms: {
        progress: { value: 0 }, // animate from 0.0 to 0.5
        direction: { value: 1 },
      },
    });

    const texts = blobs.map((blob, idx) => {
      const myText = new Text({});
      myText.text = blob.name;
      myText.font = "./aften_screen.woff";
      myText.anchorX = "center";
      myText.anchorY = "middle";
      myText.material = textMaterial;
      myText.position.set(0, 0, 2);
      myText.letterSpacing = -0.08;
      myText.fontSize = window.innerWidth / 6000;
      myText.glyphGeometryDetail = 20;
      myText.sync(); // sync all the stuff and properties
      scene.add(myText);
      return myText;
    });

    loadingManager.onLoad = function () {
      const bg = new THREE.Color(blobs[currentIndex].background);
      gsap.to(scene.background, {
        r: bg.r,
        g: bg.g,
        b: bg.b,
        duration: 1,
        ease: "linear",
      });
      animate();
    };

    window.addEventListener("wheel", (e) => {
      if (isAnimating) return;

      isAnimating = true;

      let direction = Math.sign(e.deltaY); // it tells in which direction we are scrolling
      let next = (currentIndex + direction + blobs.length) % blobs.length; // equation to get the next blob

      texts[next].scale(1, 1, 1);
      texts[next].position.x = direction * 3.5;

      gsap.to(textMaterial.uniforms.progress, {
        value: 0.5,
        duration: 1,
        ease: "linear",
        onComplete: () => {
          currentIndex = next;
          isAnimating = false;
          textMaterial.uniforms.progress.value = 0;
        },
      });

      gsap.to(texts[currentIndex].position, {
        x: -direction * 3,
        duration: 1,
        ease: "linear",
      });

      gsap.to(texts[next].position, {
        x: 0,
        duration: 1,
        ease: "linear",
      });

      const bg = new THREE.Color(blobs[next].background);
      gsap.to(scene.background, {
        r: bg.r,
        g: bg.g,
        b: bg.b,
        duration: 1,
        ease: "linear",
      });

      setTimeout(() => {
        isAnimating = false;
      }, 2000);
    });
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

  return (
    <div
      ref={mountRef}
      style={{ width: "100vw", height: "100vh", background: "#333" }}
    />
  );
}

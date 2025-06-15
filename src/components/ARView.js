import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight';
import { useParams, useNavigate } from 'react-router-dom';
import './ARView.css';
import furnitureData from '../data/furnitureData';

function ARView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [arSupported, setArSupported] = useState(true);
  const [arActive, setArActive] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  // Model dan scale - menggunakan useMemo untuk mencegah re-creation pada setiap render
  const models = useMemo(() => [
    "/Kabinet_AjengDiahPramesti.glb",
    "/Kasur_HariOctavianDelrossi.glb", 
    "/Lemari_FarlyhaydyH.Djalil.glb",
    "/Meja_TrisnaCahyaPermadi.glb",
    "/Qohary_Lamp.glb",
    "/Armchair_PiolaEvania.glb",
  ], []);
  
  const modelScaleFactor = useMemo(() => [0.01, 0.01, 0.005, 0.01, 0.01, 0.01], []);
  
  // Use refs for THREE.js objects that persist across renders
  const itemsRef = useRef([]);
  const reticleRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const hitTestSourceRequestedRef = useRef(false);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  const initialIndex = furnitureData.findIndex(f => f.id === Number(id));
  const [itemSelectedIndex, setItemSelectedIndex] = useState(initialIndex !== -1 ? initialIndex : 0);

  // Check AR support
  useEffect(() => {
    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setArSupported(supported);
      });
    } else {
      setArSupported(false);
    }
  }, []);

  const cleanupAR = useCallback(async () => {
    try {
      // Stop animation loop
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
      }

      // End XR session
      if (rendererRef.current && rendererRef.current.xr && rendererRef.current.xr.getSession()) {
        const session = rendererRef.current.xr.getSession();
        await session.end();
      }

      // Clean up hit test source
      if (hitTestSourceRef.current) {
        hitTestSourceRef.current = null;
      }
      hitTestSourceRequestedRef.current = false;

      // Remove event listeners from furniture selection
      for (let i = 0; i < models.length; i++) {
        const el = document.querySelector(`#item` + i);
        if (el) {
          el.removeEventListener("beforexrselect", () => {});
          el.removeEventListener("click", () => {});
          el.classList.remove("clicked");
        }
      }

      // Dispose Three.js objects
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        sceneRef.current.clear();
      }

      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current = null;
      }

      // Clear refs
      sceneRef.current = null;
      cameraRef.current = null;
      reticleRef.current = null;
      itemsRef.current = [];

      setIsSessionStarted(false);
    } catch (error) {
      console.warn('Error during AR cleanup:', error);
      setIsSessionStarted(false);
    }
  }, [models]);

  const onSelect = useCallback(() => {
    if (reticleRef.current && reticleRef.current.visible && itemsRef.current[itemSelectedIndex]) {
      let newModel = itemsRef.current[itemSelectedIndex].clone();
      newModel.visible = true;
      reticleRef.current.matrix.decompose(
        newModel.position,
        newModel.quaternion,
        newModel.scale
      );
      let scaleFactor = modelScaleFactor[itemSelectedIndex];
      newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
      sceneRef.current.add(newModel);
    }
  }, [itemSelectedIndex, modelScaleFactor]);

  const onClicked = useCallback((e, selectItem, index) => {
    setItemSelectedIndex(index);
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      if (el) el.classList.remove("clicked");
    }
    e.target.classList.add("clicked");
  }, [models.length]);

  const setupFurnitureSelection = useCallback(() => {
    const eventListeners = []; // Track event listeners for cleanup
    
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      if (el) {
        const beforeXRSelectHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
        };
        
        const clickHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          onClicked(e, itemsRef.current[i], i);
        };

        el.addEventListener("beforexrselect", beforeXRSelectHandler);
        el.addEventListener("click", clickHandler);
        
        // Store listeners for cleanup
        eventListeners.push({
          element: el,
          event: "beforexrselect",
          handler: beforeXRSelectHandler
        });
        eventListeners.push({
          element: el,
          event: "click", 
          handler: clickHandler
        });
      }
    }
    
    // Return cleanup function
    return () => {
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    };
  }, [models.length, onClicked]);

  const render = useCallback((timestamp, frame) => {
    if (frame) {
      const referenceSpace = rendererRef.current.xr.getReferenceSpace();
      const session = rendererRef.current.xr.getSession();

      if (hitTestSourceRequestedRef.current === false) {
        session.requestReferenceSpace("viewer").then(function (referenceSpace) {
          session
            .requestHitTestSource({ space: referenceSpace })
            .then(function (source) {
              hitTestSourceRef.current = source;
            });
        });

        session.addEventListener("end", function () {
          hitTestSourceRequestedRef.current = false;
          hitTestSourceRef.current = null;
          setIsSessionStarted(false);
        });

        hitTestSourceRequestedRef.current = true;
      }

      if (hitTestSourceRef.current) {
        const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticleRef.current.visible = true;
          reticleRef.current.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
        } else {
          reticleRef.current.visible = false;
        }
      }
    }
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  const animate = useCallback(() => {
    rendererRef.current.setAnimationLoop(render);
  }, [render]);

  const init = useCallback(async () => {
    let myCanvas = document.getElementById("canvas");
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    sceneRef.current.add(light);

    rendererRef.current = new THREE.WebGLRenderer({
      canvas: myCanvas,
      antialias: true,
      alpha: true,
    });
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.xr.enabled = true;

    const xrLight = new XREstimatedLight(rendererRef.current);
    xrLight.addEventListener("estimationstart", () => {
      sceneRef.current.add(xrLight);
      sceneRef.current.remove(light);
      if (xrLight.environment) {
        sceneRef.current.environment = xrLight.environment;
      }
    });

    xrLight.addEventListener("estimationend", () => {
      sceneRef.current.add(light);
      sceneRef.current.remove(xrLight);
    });

    // Auto-start AR session
    if (arSupported && !isSessionStarted) {
      try {
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay', 'light-estimation'],
          domOverlay: { root: document.body }
        });
        await rendererRef.current.xr.setSession(session);
        setIsSessionStarted(true);
      } catch (error) {
        console.error('Error starting AR session:', error);
        setArSupported(false);
      }
    }

    for (let i = 0; i < models.length; i++) {
      const idx = i;
      const loader = new GLTFLoader();
      loader.load(models[idx], function (glb) {
        let model = glb.scene;
        itemsRef.current[idx] = model;
      });
    }

    const controller = rendererRef.current.xr.getController(0);
    controller.addEventListener("select", onSelect);
    sceneRef.current.add(controller);

    reticleRef.current = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticleRef.current.matrixAutoUpdate = false;
    reticleRef.current.visible = false;
    sceneRef.current.add(reticleRef.current);
  }, [arSupported, isSessionStarted, models, onSelect]);

  // Main useEffect with proper dependencies
  useEffect(() => {
    if (initialIndex !== -1) setItemSelectedIndex(initialIndex);

    if (arActive) {
      let cleanupFurnitureSelection = null;
      
      const waitForCanvas = setInterval(() => {
        const myCanvas = document.getElementById("canvas");
        if (myCanvas) {
          clearInterval(waitForCanvas);
          init();
          cleanupFurnitureSelection = setupFurnitureSelection();
          animate();
        }
      }, 50);

      return () => {
        clearInterval(waitForCanvas);
        if (cleanupFurnitureSelection) {
          cleanupFurnitureSelection();
        }
      };
    }
  }, [id, arActive, initialIndex, init, setupFurnitureSelection, animate]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanupAR();
    };
  }, [cleanupAR]);

  const product = furnitureData.find(f => f.id === Number(id));
  if (!product) return <div>Produk tidak ditemukan.</div>;

  const handleBackToGallery = async () => {
    try {
      setArActive(false);
      
      // Wait for cleanup to complete
      await cleanupAR();
      
      // Small delay to ensure everything is cleaned up
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reset AR support state
      setArSupported(true);
      
      // Navigate back to furniture list
      navigate('/furniture', { replace: true });
    } catch (error) {
      console.error('Error during back to gallery:', error);
      // Force navigation even if cleanup fails
      navigate('/furniture', { replace: true });
    }
  };

  return (
    <div className="ar-view">
      <button
        className="back-to-gallery-btn"
        onClick={handleBackToGallery}
      >
        ← Back to Gallery
      </button>
      {arActive && <canvas id="canvas"></canvas>}
      <div className="arview-product-info">
        <img src={product.image} alt={product.name} className="arview-product-image" />
        <div className="arview-product-meta">
          <h3 className="arview-product-title">{product.name}</h3>
          <div className="arview-product-size">Size: {product.size}</div>
          <div className="arview-product-desc">{product.description}</div>
        </div>
      </div>
    </div>
  );
}

export default ARView;
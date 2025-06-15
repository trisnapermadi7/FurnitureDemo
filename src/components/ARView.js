import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
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

  // Model dan scale
  const models = [
    "/Kabinet_AjengDiahPramesti.glb",
    "/Kasur_HariOctavianDelrossi.glb", 
    "/Lemari_FarlyhaydyH.Djalil.glb",
    "/Meja_TrisnaCahyaPermadi.glb",
    "/Qohary_Lamp.glb",
    "/Armchair_PiolaEvania.glb",
  ];
  const modelScaleFactor = [0.01, 0.01, 0.005, 0.01, 0.01, 0.01];

  // Gunakan useRef untuk instance Three.js dan array items
  const itemsRef = useRef([]);
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const reticleRef = useRef();
  const hitTestSourceRef = useRef(null);
  const hitTestSourceRequestedRef = useRef(false);
  // const animationIdRef = useRef();
  const controllerRef = useRef();
  const arButtonRef = useRef();

  // Cari index model berdasarkan id furniture
  const initialIndex = furnitureData.findIndex(f => f.id === Number(id));
  const [itemSelectedIndex, setItemSelectedIndex] = useState(initialIndex !== -1 ? initialIndex : 0);

  useEffect(() => {
    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setArSupported(supported);
      });
    } else {
      setArSupported(false);
    }
  }, []);

  // Cleanup AR session dan resource
  function cleanupAR() {
    // End XR session jika masih aktif
    if (rendererRef.current && rendererRef.current.xr && rendererRef.current.xr.getSession()) {
      rendererRef.current.xr.getSession().end();
    }
    // Dispose renderer
    if (rendererRef.current && rendererRef.current.dispose) {
      rendererRef.current.dispose();
    }
    // Hapus ARButton jika ada
    if (arButtonRef.current && arButtonRef.current.parentNode) {
      arButtonRef.current.parentNode.removeChild(arButtonRef.current);
      arButtonRef.current = null;
    }
    // Cancel animation loop
    if (rendererRef.current) {
      rendererRef.current.setAnimationLoop(null);
    }
    // Reset hit test
    hitTestSourceRef.current = null;
    hitTestSourceRequestedRef.current = false;
    // Hapus event listener controller
    if (controllerRef.current) {
      controllerRef.current.removeEventListener("select", onSelect);
      controllerRef.current = null;
    }
    // Kosongkan items
    itemsRef.current = [];
    // Hapus scene, camera, reticle
    sceneRef.current = null;
    cameraRef.current = null;
    reticleRef.current = null;
  }

  // Inisialisasi AR
  function init() {
    let myCanvas = document.getElementById("canvas");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    const renderer = new THREE.WebGLRenderer({
      canvas: myCanvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // Simpan ke ref
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Light estimation
    const xrLight = new XREstimatedLight(renderer);
    xrLight.addEventListener("estimationstart", () => {
      scene.add(xrLight);
      scene.remove(light);
      if (xrLight.environment) {
        scene.environment = xrLight.environment;
      }
    });
    xrLight.addEventListener("estimationend", () => {
      scene.add(light);
      scene.remove(xrLight);
    });

    // ARButton hanya dibuat sekali
    if (arSupported && !arButtonRef.current) {
      const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay", "light-estimation"],
        domOverlay: { root: document.body },
      });
      arButton.style.bottom = "22%";
      document.body.appendChild(arButton);
      arButtonRef.current = arButton;
    }

    // Load semua model ke itemsRef
    for (let i = 0; i < models.length; i++) {
      const idx = i;
      const loader = new GLTFLoader();
      loader.load(models[idx], function (glb) {
        let model = glb.scene;
        itemsRef.current[idx] = model;
      });
    }

    // Controller
    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);
    controllerRef.current = controller;

    // Reticle
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;
  }

  // Fungsi select untuk menaruh model
  function onSelect() {
    const reticle = reticleRef.current;
    const scene = sceneRef.current;
    const items = itemsRef.current;
    if (reticle && reticle.visible && items[itemSelectedIndex]) {
      let newModel = items[itemSelectedIndex].clone();
      newModel.visible = true;
      reticle.matrix.decompose(
        newModel.position,
        newModel.quaternion,
        newModel.scale
      );
      let scaleFactor = modelScaleFactor[itemSelectedIndex];
      newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
      scene.add(newModel);
    }
  }

  // Setup event untuk pilih furniture
  function setupFurnitureSelection() {
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      if (el) {
        el.addEventListener("beforexrselect", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          onClicked(e, itemsRef.current[i], i);
        });
      }
    }
  }

  const onClicked = (e, selectItem, index) => {
    setItemSelectedIndex(index);
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      if (el) el.classList.remove("clicked");
    }
    e.target.classList.add("clicked");
  };

  // Animation loop
  function animate() {
    if (rendererRef.current) {
      rendererRef.current.setAnimationLoop(render);
    }
  }

  // Render loop
  function render(timestamp, frame) {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const reticle = reticleRef.current;

    if (frame && renderer && scene && camera && reticle) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if (!hitTestSourceRequestedRef.current) {
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
        });

        hitTestSourceRequestedRef.current = true;
      }

      if (hitTestSourceRef.current) {
        const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
    }
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Efek utama: inisialisasi dan cleanup AR
  useEffect(() => {
    // Update index jika id berubah
    if (initialIndex !== -1) setItemSelectedIndex(initialIndex);

    if (arActive) {
      const waitForCanvas = setInterval(() => {
        const myCanvas = document.getElementById("canvas");
        if (myCanvas) {
          clearInterval(waitForCanvas);
          init();
          setupFurnitureSelection();
          animate();
        }
      }, 50);
    }
    return () => {
      cleanupAR();
    };
    // eslint-disable-next-line
  }, [id, navigate, arActive]);

  const product = furnitureData.find(f => f.id === Number(id));
  if (!product) return <div>Produk tidak ditemukan.</div>;

  // Tombol kembali ke galeri (stop AR)
  const handleBackToGallery = () => {
    setArActive(false); // Akan trigger cleanupAR lewat useEffect
    setTimeout(() => {
      navigate('/furniture');
    }, 100);
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
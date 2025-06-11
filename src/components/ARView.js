import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight';
import { useParams, useNavigate } from 'react-router-dom';
import './ARView.css';

function ARView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [navbarOpen, setNavbarOpen] = useState(true);
  const [arSupported, setArSupported] = useState(true);

  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  let scene, camera, renderer;

  let models = [
    "./Kabinet_AjengDiahPramesti.glb",
    "./Kasur_HariOctavianDelrossi.glb", 
    "./Lemari_FarlyhaydyH.Djalil.glb",
    "./Meja_TrisnaCahyaPermadi.glb",
    "./Qohary_Lamp.glb",
  ];
  let modelScaleFactor = [0.01, 0.01, 0.005, 0.01, 0.01, 0.01];
  let items = [];
  let itemSelectedIndex = 0;

  // Cek support AR hanya sekali saat mount
  useEffect(() => {
    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setArSupported(supported);
      });
    } else {
      setArSupported(false);
    }
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    init();
    setupFurnitureSelection();
    animate();

    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Gallery';
    backButton.className = 'back-button';
    backButton.onclick = () => navigate('/furniture');
    document.body.appendChild(backButton);

    return () => {
      document.body.removeChild(backButton);
    };
  }, [id, navigate]);
  /* eslint-enable react-hooks/exhaustive-deps */

  function init() {
    let myCanvas = document.getElementById("canvas");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({
      canvas: myCanvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

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

    let arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation"],
      domOverlay: { root: document.body },
    });
    arButton.style.bottom = "22%";
    document.body.appendChild(arButton);

    for (let i = 0; i < models.length; i++) {
      const loader = new GLTFLoader();
      loader.load(models[i], function (glb) {
        let model = glb.scene;
        items[i] = model;
      });
    }

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
  }

  function onSelect() {
    if (reticle.visible) {
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
          onClicked(e, items[i], i);
        });
      }
    }
  }

  const onClicked = (e, selectItem, index) => {
    itemSelectedIndex = index;
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      if (el) el.classList.remove("clicked");
    }
    e.target.classList.add("clicked");
  };

  function animate() {
    renderer.setAnimationLoop(render);
  }

  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if (hitTestSourceRequested === false) {
        session.requestReferenceSpace("viewer").then(function (referenceSpace) {
          session
            .requestHitTestSource({ space: referenceSpace })
            .then(function (source) {
              hitTestSource = source;
            });
        });

        session.addEventListener("end", function () {
          hitTestSourceRequested = false;
          hitTestSource = null;
        });

        hitTestSourceRequested = true;
      }

      if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
    }
    renderer.render(scene, camera);
  }

  return (
    <div className="ar-view">
      <canvas id="canvas"></canvas>
      {/* AR Status */}
      {!arSupported && (
        <div className={`ar-status${navbarOpen ? '' : ' closed'}`}>
          AR NOT SUPPORTED
        </div>
      )}
      <div className={`navbar${navbarOpen ? '' : ' closed'}`}>
        <button
          className="navbar-toggle"
          onClick={() => setNavbarOpen((open) => !open)}
          aria-label={navbarOpen ? "Tutup Navbar" : "Buka Navbar"}
        >
          <span className="arrow">{navbarOpen ? "▼" : "▲"}</span>
        </button>
        <div className="button-list">
          <div className="button-container">
            <img className="button-image" id="item0" src="/Kabinet.png" alt="Kabinet" />
            <div className="item-label">Kabinet</div>
          </div>
          <div className="button-container">
            <img className="button-image" id="item1" src="/Kasur.png" alt="Kasur" />
            <div className="item-label">Kasur</div>
          </div>
          <div className="button-container">
            <img className="button-image" id="item2" src="/Lemari.png" alt="Lemari" />
            <div className="item-label">Lemari</div>
          </div>
          <div className="button-container">
            <img className="button-image" id="item3" src="/Meja.png" alt="Meja" />
            <div className="item-label">Meja</div>
          </div>
          <div className="button-container">
            <img className="button-image" id="item4" src="/Lamp.png" alt="Lamp" />
            <div className="item-label">Lamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ARView;
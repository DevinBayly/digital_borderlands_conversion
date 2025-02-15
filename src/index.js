// component definitions


AFRAME.registerComponent("my-mesh",{
  init() {
    console.log("self is ",self)
    let el = this.el
    let loader = new THREE.GLTFLoader()
    loader.load("../assets/processed_files/intersectable_landscape_model.glb",function(gltf) {
      console.log(gltf)
      el.setObject3D("landscape",gltf.scene)
      let cam = document.querySelector("#camera")
      let repeatPlace = ()=> {
        // create raycaster from 
        let start = new THREE.Vector3(cam.object3D.position.x,-100,cam.object3D.position.z)
        let end = new THREE.Vector3(0,1,0)
        let ray = new THREE.Raycaster(start,end)
        // calculate intersections
        // // set recursive children check
        let intersects = ray.intersectObject(gltf.scene.children[0],true)
        console.log(intersects)
        makeBox(intersects[0].point)
        setTimeout(repeatPlace,4000)
      }
      repeatPlace()
    })
  }
})


AFRAME.registerComponent('cross-loader', {
  async init() {
    let crossDistanceMax = 2000
    let loader = new THREE.GLTFLoader()
    let el = this.el
    loader.load("../assets/processed_files/cross_placement_landscape_nonvisible.glb",async function(gltf) {

      // use the bb on the landscape to correctly scale the 0-1 values from the death data json 
      let scene = gltf.scene
      // set object for other systems to load off of
      console.log("starting crosses")
      el.setObject3D('rayland',gltf.scene)
      let geometry = gltf.scene.children[0].geometry
      let data = await fetch("../assets/processed_files/death_points_n33_w113.json").then(res=> res.json())
      let bb = geometry.boundingBox
      console.log(bb)
      let crossesInMeshSpace =[]
      let representation =[]
      for (let datum of data) {
        let nlat = datum['norm_lat']
        let nlng = datum['norm_lng']
        // long is x lat is z
        let singleConverted = {
          position: new THREE.Vector3(nlng*(bb.max.x - bb.min.x) +bb.min.x, bb.min.y - 10,nlat*(bb.max.z - bb.min.z) +bb.min.z),
          displayData:datum
        }
        crossesInMeshSpace.push(singleConverted)
      }
      let removeCrosses =()=> {
        let cam = document.querySelector("#camera")
        // if there are crosses in the active crosses then create a function promise to remove it whenever the scene isn't doing much 
        let removeExecute =(crossEntity) => {
          let crossPoint = crossEntity.object3D.position
          let xzCross = new THREE.Vector3().copy(crossPoint)
          xzCross.y = 0
          let camPoint = cam.object3D.position
          if (camPoint.distanceTo(xzCross) > crossDistanceMax) {
            crossEntity.remove()
          }
        }
        let stage =(el,i)=>{
          return new Promise(resolve=> {
            setTimeout(()=> resolve(el),100*i)
          })
        }
        //
        let promiseList = []
        let i = 0
        for (let crossEntity of document.querySelectorAll(".cross") ) {
          promiseList.push(stage(crossEntity,i))
          i+=1
        }
        promiseList.map(prom=> prom.then(removeExecute))

      }
      let placeCrosses = ()=> {
        let cam = document.querySelector("#camera")
        let sequentialLoads = []
        let crossExecute = (i)=> {
          let cross = crossesInMeshSpace[i]
          let xzCross = new THREE.Vector3().copy(cross.position)
          xzCross.y = 0
          let dst = cam.object3D.position.distanceTo(xzCross) 
          if (dst < crossDistanceMax && representation.indexOf(i) == -1) {
            // make the crosses in the desert
            representation.push(i)
            let intersect = raycastOnLandscape(gltf.scene,cross.position)
            if (intersect != undefined) {
              cross.position.y = intersect.point.y
              // place the cross
              addCrossToScene(cross.position,cross.displayData)
            }
          }
        }
        let stage = (i)=> {
          return new Promise(resolve=> {
            setTimeout(()=> resolve(i),i*50)
          })
        }
        for (let i = 0 ; i < crossesInMeshSpace.length; i+=1) {
          // space out the creation of the crosses so the scene doesn't lag
          sequentialLoads.push(stage(i))
        }
        sequentialLoads.map(
          e=> e.then(i=> crossExecute(i))
        )
      }
      let update =()=> {
        console.log("cycling crosses")
        removeCrosses()
        placeCrosses()
        setTimeout(update,4000)
      }
      update()
    })
  }
})

AFRAME.registerComponent('collider-check', {
  dependencies: ['raycaster'],

  init: function () {
    let el = this.el
    el.shift = false

    let avatar = document.querySelector("#avatar")
    let cam = document.querySelector("#camera")
    let landscapeEl = document.querySelector("#actual-landscape")
    let shrineEl = document.querySelector("#shrineEL")
    this.el.addEventListener('click', (e)=>  {
      let point =  e.detail.intersection.point
      let intersectedEl = e.detail.intersectedEl
      console.log("el shift is",el,el.shift)
      if ((intersectedEl === landscapeEl || intersectedEl === shrineEl) && el.shift) {
        console.log('Player hit something!',e.detail);

        // make a little box at location if on landscapee
        if (intersectedEl === landscapeEl ) {
          makeBox(point)
          avatar.object3D.position.y = point.y + 2
        } else {
          // change height adjust for indoor
          avatar.object3D.position.y = point.y +.05
        }
        cam.object3D.position.x = point.x
        cam.object3D.position.z = point.z
      }
      //
    });
    window.addEventListener("keydown",
      (e)=> {
        let el = this.el
        if (e.key === 'Shift') {
          el.shift = !el.shift
        } else if (e.key === 'Control') {
          el.shift = false
        }
      }
    )
    window.addEventListener("keyup",(e)=> {
      if (e.key === 'Shift') {
        el.shift = !el.shift
      }
    }
    )
  },
});

AFRAME.registerComponent('my-gltf-model',{
  init() { 
    let el = this.el
    let loader = new THREE.GLTFLoader()
    loader.load('../assets/processed_files/visible_landscape_model.glb',function (gltf) {
      // goal of doing things this way is to modify the uv's in the geometry so that we eliminate the patterns that appear over the landscape
      let geo = gltf.scene.children[0].geometry
      let inds = geo.index.array
      let uvs = geo.attributes.uv
      // go through inds getting groups of three
      for (let i = 0 ; i < inds.length;i+=3) {
        let faceInds = inds.slice(i,i+3)
        // this will be the amount we add to each of the uv thetas so they remain relative to each other except rotated
        let thetaBump = Math.random()*2*Math.PI
        let sqrt3 = 1/Math.sqrt(3)
        let a = new THREE.Vector2(0,sqrt3)
        let b = new THREE.Vector2(1/2,-1/2*sqrt3)
        let c = new THREE.Vector2(-1/2,-1/2*sqrt3)
        let triangleUV = [a,b,c]
        let randRotation = Math.random()*2*Math.PI
        let center = new THREE.Vector2(0,0)
        for (let [i,fi] of faceInds.entries()) {
          let point = triangleUV[i].clone()
          let rotated =  point.rotateAround(center,randRotation)
          uvs.setXY(fi,rotated.x*10,rotated.y*10)
        }
      }
      // set the object as our entity
      el.setObject3D('landscape',gltf.scene)
      //geo.attributes.uv.needsUpdate = true


    })

  }
})

// Component to change to a sequential color on click.
AFRAME.registerComponent('cursor-listener', {
  init: function () {
    this.el.addEventListener('click', function (evt) {
      console.log('I was clicked at: ',point);
    });
  }
});

AFRAME.registerComponent('stairs-loader',{
  init () {
    // 
    this.el.addEventListener('click',function(e) {
      // transport to the portal
      console.log("clicked stairs",e)
      let portal = document.querySelector("#portalEL").object3D.children[0].children[0].position
      let cam = document.querySelector("#camera").object3D.position
      let avatar = document.querySelector("#avatar").object3D.position
      cam.x = portal.x-2
      cam.z = portal.z + 1
      avatar.y = portal.y+2
    })
  }
})
AFRAME.registerComponent('portal-loader',{
  init () {
    // 
    this.el.addEventListener('click',function(e) {
      // transport to the shrine
      console.log("clicked portal",e)
      let shrine = document.querySelector("#shrineEL").object3D.children[0].children[0].position
      let cam = document.querySelector("#camera").object3D.position
      let avatar = document.querySelector("#avatar").object3D.position
      cam.x = shrine.x
      cam.y = 0
      cam.z = shrine.z
      avatar.y = shrine.y
    })
  }
})
let beaconCount = 0
AFRAME.registerComponent('cross-beacon',{
  init() {
    // goal is to attach a line straight up from the cross so that users can see them and go towards them on the landscape
    // 
    const material = new THREE.LineBasicMaterial({
      color:"white"
    });

    const points = [];
    points.push( new THREE.Vector3(0,0,0 ));
    points.push( new THREE.Vector3( 0,200,0) );

    const geometry = new THREE.BufferGeometry().setFromPoints( points );

    const line = new THREE.Line( geometry, material );
    this.el.setObject3D('crossbeacon'+beaconCount,line)
    beaconCount +=1
  }
})
// helper functions 
function makeBox(p) {
  let box = document.createElement("a-box")
  box.setAttribute("scale","1 1 1")
  box.object3D.position.x = p.x
  box.object3D.position.y = p.y
  box.object3D.position.z = p.z
  document.querySelector("a-scene").append( box )
}

// point will only include x,z
// mesh will be the el.object3D, with a second argument True for recursion
function raycastOnLandscape(scene,point) {
  // could use the min z for the bb on the landscape also
  let start = point
  let dir = new THREE.Vector3(0,1,0)
  let ray = new THREE.Raycaster(start,dir)
  let intersects = ray.intersectObject(scene.children[0],true)
  return intersects[0]
}

function addCrossToScene(point,data) {
  let scene = document.querySelector("a-scene")
  let cross = document.createElement("a-entity")
  let beacon = document.createElement("a-entity")
  // create a line into the sky starting at point
  beacon.setAttribute("cross-beacon","")
  cross.setAttribute("scale","10 10 10")
  cross.setAttribute("gltf-model","#cross")
  cross.classList.add("clickable")
  cross.classList.add("cross")
  cross.addEventListener("click",function(e) {
    // render text 
    let text = document.createElement("a-entity")
    text.setAttribute("text","value",`${JSON.stringify(data)}`)
    text.setAttribute("text","side","double")
    // make text above the cross"
    text.setAttribute("position","0 1 0")
    cross.append(text)
    beacon.remove()
  })
  beacon.object3D.position.x = point.x
  beacon.object3D.position.y = point.y
  beacon.object3D.position.z = point.z
  cross.object3D.position.x = point.x
  cross.object3D.position.y = point.y
  cross.object3D.position.z = point.z
  scene.append(cross)
  scene.append(beacon)
}
function makeBox(p) {
  let box = document.createElement("a-box")
  box.setAttribute("color","red")
  box.setAttribute("scale","1 1 1")
  box.object3D.position.x = p.x
  box.object3D.position.y = p.y
  box.object3D.position.z = p.z
  document.querySelector("a-scene").append( box )
}


AFRAME.registerComponent("my-mesh",{
  init() {
    console.log("self is ",self)
    let el = this.el
    let loader = new THREE.GLTFLoader()
    loader.load("../assets/processed_files/test_collision_box6.glb",function(gltf) {
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

function addCrossToScene(point) {
  let scene = document.querySelector("a-scene")
  let cross = document.createElement("a-entity")
  cross.setAttribute("gltf-model","#cross")
  cross.object3D.position.x = point.x
  cross.object3D.position.y = point.y
  cross.object3D.position.z = point.z
  scene.append(cross)
}
/*
let mouse = new THREE.Vector2()

document.body.addEventListener("mousemove",function(event) {
  
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
})
*/

AFRAME.registerComponent("raycasttest",{
  init() {

    
  }
})

AFRAME.registerComponent('cross-loader', {
  async init() {
    let loader = new THREE.GLTFLoader()
    let el = this.el
    loader.load("../assets/processed_files/test_collision_box6_cross_placements.glb",async function(gltf) {

      // use the bb on the landscape to correctly scale the 0-1 values from the death data json 
      let scene = gltf.scene
      let geometry = gltf.scene.children[0].geometry
      let data = await fetch("../assets/processed_files/death_points_n33_w113.json").then(res=> res.json())
      let bb = geometry.boundingBox
      console.log(bb)
      let crossesInMeshSpace =[]
      for (let datum of data) {
        let nlat = datum['norm_lat']
        let nlng = datum['norm_lng']
        // shoot which one is for x vs z? I think long is x
        //console.log(nlat,nlng,nlng*(bb.max.x - bb.min.x) +bb.min.x,nlat*(bb.max.z - bb.min.z) +bb.min.z)
        let singleConverted = {
          position: new THREE.Vector3(nlng*(bb.max.x - bb.min.x) +bb.min.x, bb.min.y - 10,nlat*(bb.max.z - bb.min.z) +bb.min.z),
          displayData:datum
        }
        crossesInMeshSpace.push(singleConverted)
      }
      let cam = document.querySelector("#camera")
      for (let cross of crossesInMeshSpace) {
        let dst = cam.object3D.position.distanceTo(cross.position) 
        if (dst < 8000) {
          // make the crosses in the desertt
          let intersect = raycastOnLandscape(gltf.scene,cross.position)
          if (intersect != undefined) {
          cross.position.y = intersect.point.y
          // place the cross
          addCrossToScene(cross.position)
          }
        }
      }
    })
  }
})

AFRAME.registerComponent('collider-check', {
  dependencies: ['raycaster'],

  init: function () {
    let avatar = document.querySelector("#avatar")
    let cam = document.querySelector("#camera")
    this.el.addEventListener('click', function (e) {
      let point =  e.detail.intersection.point
      console.log('Player hit something!',e.detail);
      // make a little box at location
      makeBox(point)
      cam.object3D.position.x = point.x
      avatar.object3D.position.y = point.y +.5
      cam.object3D.position.z = point.z
      //
    });
  }
});

// Component to change to a sequential color on click.
AFRAME.registerComponent('cursor-listener', {
  init: function () {
    this.el.addEventListener('click', function (evt) {
      console.log('I was clicked at: ',point);
    });
  }
});

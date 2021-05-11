function makeBox(p) {
  let box = document.createElement("a-box")
  box.setAttribute("color","red")
  box.setAttribute("scale","10 10 10")
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
    loader.load("../assets/processed_files/demo_mesh.glb",function(gltf) {
      console.log(gltf)
      el.setObject3D("landscape",gltf.scene)
      let cam = document.querySelector("#camera")
      let repeatPlace = ()=> {
        // create raycaster from 
        let start = new THREE.Vector3(cam.object3D.position.x,-10,cam.object3D.position.z)
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
      avatar.object3D.position.y = point.y + 1.9
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

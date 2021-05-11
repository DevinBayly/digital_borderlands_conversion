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
    this.el.addEventListener('raycaster-intersection', function (e) {
      //console.log('Player hit something!',e.detail.intersections[0]);
      // make a little box at location
      makeBox(e.detail.intersections[0].point)
      //
    });
  }
});

// Component to change to a sequential color on click.
AFRAME.registerComponent('cursor-listener', {
  init: function () {
    var lastIndex = -1;
    var COLORS = ['red', 'green', 'blue'];
    this.el.addEventListener('click', function (evt) {
      lastIndex = (lastIndex + 1) % COLORS.length;
      this.setAttribute('material', 'color', COLORS[lastIndex]);
      console.log('I was clicked at: ', evt.detail.intersection.point);
      makeBox(evt.detail.intersection.point)
    });
  }
});

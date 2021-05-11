AFRAME.registerComponent("my-mesh",{
  init() {
    console.log("self is ",self)
    let el = this.el
    let loader = new THREE.GLTFLoader()
    // test if this setts the url?
    loader.load("../assets/processed_files/test_collision_box4.glb",function(gltf) {
      console.log(gltf)
      el.setObject3D("landscape",gltf.scene)
      //addSecondCamera()
      //let second = document.querySelector("#head")
      //second.setAttribute("camera","active",true)
    })
  }
})

function moveBoxes(face) {
  console.log("moving boxes for face",face)
  for (let i=0 ; i < face.length;i+=1)  {
    let pt = face[i]
    let box = document.querySelector(`#box${i+1}`)
    console.log("box",box)
    box.object3D.position.x = pt.x
    box.object3D.position.y = pt.y
    box.object3D.position.z = pt.z
  }
}

function makeBoxes(face) {
  let scene = document.querySelector("a-scene")
  for (let pt of face) {
    let box = document.createElement("a-box")
    box.object3D.position.x = pt.x
    box.object3D.position.y = pt.y
    box.object3D.position.z = pt.z
    box.setAttribute("scale",".03 .03 .03")
    box.setAttribute("color","red")
    scene.append(box)

  }

}


AFRAME.registerComponent("nav-mesh",{
  init() {

    this.el.addEventListener("model-loaded",function (e) {
      console.log("loaded",e)
      let points =[]
      let faces = []
      let mesh = e.detail.model.children[0].geometry
      console.log("mesh",mesh)
      let values = mesh.attributes.position.array
      //console.log(values)
      let indices = mesh.index.array
      for (let i = 0; i < values.length; i += 3) {
        let p = new THREE.Vector3(values[i]  ,values[i + 1] , values[i + 2])
        points.push(p)
      }
      //console.log("points", points)
      // in theory we have 64 faces, and 81 vertices
      for (let i = 0; i < indices.length; i += 3) {
        // use the values in the first 4 to create a face
        let face = []
        let faceIndices = indices.slice(i, i + 3)
        for (let ind of faceIndices) {
          face.push(points[ind])
        }
        faces.push(face)

      }
      console.log("points",points,"faces",faces)
      // 
      for (let f of faces ) {
        makeBoxes(f)
      }
      let cam = document.querySelector("#camera")
      let testCamPos = ()=> {
        let test_point = new THREE.Vector3(cam.object3D.position.x,
        cam.object3D.position.y,
        cam.object3D.position.z)
        console.log("test_point is ",test_point)
        for (let f of faces) {
          let t = new THREE.Triangle(f[0],f[1],f[2])
          if (t.containsPoint(test_point)) {
            // make boxes at face points
            moveBoxes(f)
          }
        }
        setTimeout(testCamPos,4000) 
      }
      testCamPos()

    })
  }
}
)

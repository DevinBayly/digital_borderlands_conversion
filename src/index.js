AFRAME.registerComponent('player',{
  init() {
    console.log("creating player")
    let el = this.el
    let scene = el.sceneEl
    window.addEventListener("keydown",(e)=> {
      let sign = 1
      if (e.shiftKey) {
        sign=-1
      }
      if (e.code.match(/space/i)) {
        el.object3D.position.y += .1*sign
      }
    })
    let ele = this.el
    window.addEventListener("shrine-placed",(e)=> {
      let shrine_pos =  e.detail.srcElement.object3D.children[0].children[0].position
      ele.object3D.position.x = shrine_pos.x
      ele.object3D.position.y = shrine_pos.y+.5
      ele.object3D.position.z = shrine_pos.z
      console.log(ele.object3D.position,"position now")
    })
  }
})

// raycasting collisin check, add this to something and it will alert when the raycaster hits something
//
AFRAME.registerComponent('collider-check', {
  dependencies:['raycaster'],
  init: function () {
    this.el.addEventListener('raycaster-intersection',function(e) {
      console.log('player hit something',e)
    })
  }
})

// this function will make it so that our camera rig gets an event to place at the right location
AFRAME.registerComponent("loader-listener",{
  init: function () {
    this.el.addEventListener('model-loaded',function(e){ 
      console.log("loaded model",e)
      let event = new CustomEvent('shrine-placed',{detail:e})
      window.dispatchEvent(event)
    })
  }
})

AFRAME.registerComponent("crosses",{
  init:function() {
    // load the elementsjson, then append a box for each 
    let sEl = this.el.sceneEl
    fetch("../assets/processed_files/elements.json").then(res=> res.json()).then(j=> {
      for(let cross of j){
        //let b = document.createElement("a-gltf-model")
        let b = document.createElement("a-box")
        //b.setAttribute("src","../assets/processed_files/cross.glb")
      b.setAttribute("position",`${cross.pt.x} ${cross.pt.y} ${cross.pt.z}`)
      b.setAttribute("color","red")
      b.setAttribute("scale",".1 .1 .1")
      sEl.append(b)
      }
      
    })
  }
})

let pt = function(x,y,z) {
  this.x = x
  this.y = y
  this.z = z
}
pt.prototype.distXZ = function (o) {
  return Math.sqrt(Math.pow(o.x - this.x,2) + Math.pow(o.z - this.z,2))
}

AFRAME.registerComponent('nav-mesh',{
  init() {
    let navEl = this.el
    let nav = this
    this.el.addEventListener("model-loaded",function (e) {
      console.log("loaded",e)
      let mesh = e.detail.model.children[0].geometry
      let positions = mesh.attributes.position.array
      // go through and create points from everything
      console.log(positions)
      let points = []
      for (let i = 0; i < positions.length; i+=3) {
        let p = new pt(positions[i],positions[i+1],positions[i+2])

        points.push(p)
      }
      console.log(points)
      let pairedDown = points.reduce((acc,cur)=> {
        if (acc.indexOf(JSON.stringify(cur)) == -1) {
          acc.push(JSON.stringify(cur))
        }
        return acc
      },[])
      pairedDown = pairedDown.map(e=> {
        let xyz = JSON.parse(e)
        return new pt(xyz.x,xyz.y,xyz.z)
      })
      console.log(pairedDown)
      nav.Points = pairedDown
      // calculate position for starting point
      // query the 
      let updateHeight =() => {
      let avatar = document.querySelector("#avatar").object3D
      console.log(avatar)
      let avatarPoint = new pt(avatar.position.x,0,avatar.position.z)
      let min
      for (let meshPoint of nav.Points) {
        // calculate the minimum distance
        let dst = meshPoint.distXZ(avatarPoint)
        if (min == undefined || min.v > dst) {
          min = {v:dst,y:meshPoint.y}
        }
      }
      avatar.position.y = min.y
      setTimeout(()=> {
        updateHeight()
      },5000)
      }
      updateHeight()
    })
  }
})

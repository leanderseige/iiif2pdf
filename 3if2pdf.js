

function recSearch(uri,data) {
  var retval = false
  for(e in data) {
      if(data[e] instanceof Object ) {
        if('@id' in data[e]) {
          if(data[e]['@id'] == uri) {
            return data[e]
          }
        }
        retval = recSearch(uri,data[e])
        if(retval!=false) return retval
      }
    }
    return retval
  }


function iiifManifest(manifest, data) {
  this.uri = manifest
  this.data = data
}

iiifManifest.prototype.getURI = function() {
  console.log("Hello, I'm " + this.uri)
  console.log(this.data['@id'])
}

iiifManifest.prototype.getSubset = function(uri) {
  var subset = recSearch(uri, this.data)
  console.log(subset)
}




$(document).ready(function () {
  var manifest = "https://iiif.ub.uni-leipzig.de/0000009283/manifest.json"
  var uri = "https://iiif.ub.uni-leipzig.de/0000009283/range/LOG_0009"

  $.getJSON(manifest,function(result){
    var m = new iiifManifest(manifest,result)
    m.getURI()
    m.getSubset(uri)
  })



/*
  var op = document.getElementById("output")
  var data = $.getJSON(manifest).response
  console.log(data)

  var m = new iiifManifest(manifest,data)

  m.getURI()

  op.innerHTML="ok!"
*/

})

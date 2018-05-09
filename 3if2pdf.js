// Function

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

// Class iiifRange

function iiifRange(data) {
  this.data = data
}

iiifRange.prototype.getCanvases = function() {
  var retval = []
  for(e in this.data['canvases']) {
    retval.push(this.data['canvases'][e])
  }
  return retval
}

// Class iiifManifest

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
  // console.log(subset)
  return subset
}

// Class iiifCanvas

function iiifCanvas(data) {
  this.data = data
}

iiifCanvas.prototype.getB64Image = function() {
  var surl = this.data['images'][0]['resource']['service']['@id']
  
}

// Class docPDF

function pdfDoc(canvases,m) {
  this.canvases = canvases
  for(c in canvases) {
    var subset = m.getSubset(canvases[c])
    var canvobj = new iiifCanvas(subset)
    var image = canvobj.getB64Image()
  }
}

// Start

$(document).ready(function () {
  var manifest = "https://iiif.ub.uni-leipzig.de/0000009283/manifest.json"
  var uri = "https://iiif.ub.uni-leipzig.de/0000009283/range/LOG_0009"

  $.getJSON(manifest,function(result){
    var m = new iiifManifest(manifest,result)
    m.getURI()
    var subset = m.getSubset(uri)
    var iiifobj = new iiifRange(subset)
    var canvases = iiifobj.getCanvases()
    var doc = new pdfDoc(canvases,m)
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

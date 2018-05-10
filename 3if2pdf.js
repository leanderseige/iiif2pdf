/*
 * (c) Leander Seige, 2018, GPL Version 3, leander@seige.name
 */

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
  this.img = null
}

iiifCanvas.prototype.addImage = function(pdfobj) {
  var surl = this.data['images'][0]['resource']['service']['@id']
  var iurl = surl+"/full/1024,/0/default.jpg"
  this.img = new Image;
  this.img.crossOrigin = "";
  this.img.onload = function() {
    var width = pdfobj.document.internal.pageSize.width;
    var height = pdfobj.document.internal.pageSize.height
    if(pdfobj.cd!=pdfobj.mx) {
      pdfobj.document.addPage()
    }
    pdfobj.document.addImage(this, 0, 0, width, height  );
    pdfobj.cd--
    console.log(pdfobj.cd)
    $("#progressbar").progressbar({value: ((pdfobj.mx-pdfobj.cd)*100)/pdfobj.mx});
    if(pdfobj.cd==0) {
      // pdfobj.document.save("test.pdf")
    }
  };
  this.img.src = iurl;
}

// Class docPDF

function pdfDoc(canvases,m) {
  this.canvases = canvases
  this.cd = canvases.length
  this.mx = canvases.length
  this.document = new jsPDF()

  for(c in canvases) {
    var subset = m.getSubset(canvases[c])
    var canvobj = new iiifCanvas(subset)
    var image = canvobj.addImage(this)
  }

}

// Start

$("#progressbar").progressbar()
$("#buttondl").button("disable");

$(document).ready(function () {
  // var manifest = "https://iiif.ub.uni-leipzig.de/0000009283/manifest.json"
  // var uri = "https://iiif.ub.uni-leipzig.de/0000009283/range/LOG_0009"
  var manifest = "https://iiif.ub.uni-leipzig.de/0000002636/manifest.json"
  var uri = "https://iiif.ub.uni-leipzig.de/0000002636/range/0-2-15"

  $.getJSON(manifest,function(result){
    var m = new iiifManifest(manifest,result)
    m.getURI()
    var subset = m.getSubset(uri)
    var iiifobj = new iiifRange(subset)
    var canvases = iiifobj.getCanvases()
    var doc = new pdfDoc(canvases,m)
  })


})

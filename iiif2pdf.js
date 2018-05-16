/*
 *
 * (c) Leander Seige, 2018, GPL Version 3, leander@seige.name
 *
 */


function iiif2pdf(config) {

  var ctrl

  var setup = {
    "id":"myWidget",
    "resolution":"1024",
    "mode":"gui",
    "resolutions" : ["Max","2048","1024","512"],
    "orientation" : "portrait",
    "orientations": ["portrait","landscape"],
    "format":"a4",
    "formats":["a4","letter","legal","a3"],
    "quality":0.72
  }

  $(document).ready(function () {
    for(c in config) {
      setup[c]=config[c]
    }
    switch(setup['mode']) {
      case 'gui':
        ctrl = new controllerGUI()
        break;
      case 'auto':
        ctrl = new controllerAuto()
        break;
    }
  })

  // Class controllerGUI

  function controllerGUI() {
    var prog
    var btns
    var btnc
    var selr
    var stat

    var m

    var divid = document.getElementById(setup["id"])

    this.selr = document.createElement("select")
    this.selr.onchange=function() { setup['resolution']=ctrl.selr.value }
    divid.appendChild(this.selr)

    for (var i = 0; i < setup.resolutions.length; i++) {
        var option = document.createElement("option")
        option.value = setup.resolutions[i]
        option.text = setup.resolutions[i]
        if(setup.resolutions[i]==config["resolution"]) {
          option.setAttribute("selected",true)
        }
        this.selr.appendChild(option)
    }

    this.prog = document.createElement("progress")
    this.prog.setAttribute("value", "0")
    this.prog.setAttribute("max", "100")
    divid.appendChild(this.prog)

    this.btnc = document.createElement("button")
    var create_txt = document.createTextNode("Create PDF")
    this.btnc.appendChild(create_txt)
    divid.appendChild(this.btnc)
    this.btnc.onclick=function(){ctrl.loadData()}

    this.btns = document.createElement("button")
    this.btns.setAttribute("disabled","true")
    var save_txt = document.createTextNode("Save PDF")
    this.btns.appendChild(save_txt)
    divid.appendChild(this.btns)

    this.stat = document.createElement("input")
    this.stat.setAttribute("readonly","true")
    this.stat.setAttribute("type", "text")
    this.stat.setAttribute("value", "Status")
    divid.appendChild(this.stat)
  }

  controllerGUI.prototype.loadData = function() {
    this.btnc.setAttribute("disabled","true")
    this.selr.setAttribute("disabled","true")
    this.m = new iiifManifest()
  }

  controllerGUI.prototype.parseData = function() {
    this.m.parseManifest()
  }

  controllerGUI.prototype.getImageSuffix = function() {
    if(setup['resolution']=="Max") {
      return "/full/full/0/default.jpg"
    } else {
      return "/full/"+setup['resolution']+",/0/default.jpg"
    }
  }

  controllerGUI.prototype.updateProgressbar = function(value) {
    this.prog.setAttribute("value",value)
  }

  controllerGUI.prototype.createPDF = function(pdfobj) {
    pdfobj.addImages()
    this.btns.onclick=function(){pdfobj.savePDF()}
    this.btns.removeAttribute("disabled","true")
  }

  // Class controllerAuto

  function controllerAuto() {
    var prog

    var m

    var divid = document.getElementById(setup["id"])

    this.prog = document.createElement("progress")
    this.prog.setAttribute("value", "0")
    this.prog.setAttribute("max", "100")
    divid.appendChild(this.prog)

    this.loadData()
  }

  controllerAuto.prototype.loadData = function() {
    this.m = new iiifManifest()
  }

  controllerAuto.prototype.parseData = function() {
    this.m.parseManifest()
  }

  controllerAuto.prototype.getImageSuffix = function() {
    if(setup['resolution']=="Max") {
      return "/full/full/0/default.jpg"
    } else {
      return "/full/"+setup['resolution']+",/0/default.jpg"
    }
  }

  controllerAuto.prototype.updateProgressbar = function(value) {
    this.prog.setAttribute("value",value)
  }

  controllerAuto.prototype.createPDF = function(pdfobj) {
    pdfobj.addImages()
    pdfobj.savePDF()
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

  // Class iiifSequence

  function iiifSequence(data) {
    this.data = data
  }

  iiifSequence.prototype.getCanvases = function() {
    var retval = []
    for(e in this.data['canvases']) {
      retval.push(this.data['canvases'][e]['@id'])
    }
    return retval
  }

  // Class iiifManifest

  function iiifManifest() {
    var manifest = this
    $.getJSON(setup["manifest"], function(result  ) {
      manifest.data = result
      ctrl.parseData()
    })
  }

  iiifManifest.prototype.parseManifest = function() {
    var subset = this.getSubset(setup["uri"])
    if(subset['@type']=="sc:Range") {
      var iiifobj = new iiifRange(subset)
    } else if(subset['@type']=="sc:Sequence") {
      var iiifobj = new iiifSequence(subset)
    } else if(subset['@type']=="sc:Canvas") {
      var iiifobj = new iiifCanvas(subset)
    }

    var canvases = iiifobj.getCanvases()
    var doc = new pdfDoc(iiifobj,canvases,this)
  }

  iiifManifest.prototype.getURI = function() {
    console.log("Hello, I'm " + this.uri)
    console.log(this.data['@id'])
  }

  iiifManifest.prototype.getSubset = function(uri) {
    var subset = this.recSearch(uri, this.data)
    return subset
  }

  iiifManifest.prototype.recSearch = function(uri,data) {
      var retval = false
      for(e in data) {
        if(data[e] instanceof Object ) {
          if('@id' in data[e]) {
            if(data[e]['@id'] == uri) {
              return data[e]
            }
          }
          retval = this.recSearch(uri,data[e])
          if(retval!=false) return retval
        }
      }
      return retval
    }

  // Class iiifCanvas

  function iiifCanvas(data) {
    this.data = data
    this.img = null
  }

  iiifCanvas.prototype.getCanvases = function() {
    var retval = []
    retval.push(this.data['@id'])
    return retval
  }

  iiifCanvas.prototype.getImage = function(pdfobj) {
    var surl = this.data['images'][0]['resource']['service']['@id']
    var iurl = surl+ctrl.getImageSuffix()
    this.img = new Image
    this.img.crossOrigin = "Anonymous"
    this.img.onload = function() {
      pdfobj.cd--
      ctrl.updateProgressbar(((pdfobj.mx-pdfobj.cd)*100)/pdfobj.mx)
      if(pdfobj.cd==0) {
        ctrl.createPDF(pdfobj)
      }
    }
    this.img.src = iurl
  }

  // Class docPDF

  function pdfDoc(o,canvases,m) {

    var margin=20; //margin in mm
    var pdfInMM=210;  // width of A4 in mm

    this.canvases = canvases
    this.canvobjs = []
    this.cd = canvases.length
    this.mx = canvases.length
    this.document = new jsPDF("p","mm","a4")
    var cursor = 20

    this.document.setFontSize(16)
    var lines = this.document.splitTextToSize(m.data['label'], (pdfInMM-margin-margin));
    this.document.text(margin,20,lines);

    cursor+=8*lines.length
    this.document.setFontSize(14)
    if('label' in o.data) {
      this.document.text(20, cursor, o.data['label'])
      cursor+=12
    }
    this.document.setFontSize(10)
    this.document.text(20, cursor, m.data['@id'])
    if('attribution' in m.data) {
      cursor+=8
      this.document.text(20, cursor, m.data['attribution'])
    }
    if('license' in m.data) {
      cursor+=8
      this.document.text(20, cursor, m.data['license'])
    }
    cursor+=12
    this.document.setFontSize(14)
    this.document.text(20, cursor, "Metadaten")
    this.document.setFontSize(10)
    cursor+=12
    for(md in m.data.metadata) {
      var label = m.data['metadata'][md]['label']
      this.document.text(20, cursor, label+": "+m.data['metadata'][md]['value'])
      cursor+=8
    }

    for(c in canvases) {
      var subset = m.getSubset(canvases[c])
      var canvobj = new iiifCanvas(subset)
      this.canvobjs.push(canvobj)
      canvobj.getImage(this)
    }

  }

  pdfDoc.prototype.savePDF = function() {
    this.document.save("test.pdf")
  }

  pdfDoc.prototype.reencodeImg = function(img,q) {
    var canvas = document.createElement('canvas')
    canvas.id     = "delme"
    canvas.width  = img.naturalWidth
    canvas.height = img.naturalHeight
    var ctx = canvas.getContext("2d")
    ctx.drawImage(img,0,0)
    var retimg = canvas.toDataURL('image/jpeg',q)
    return retimg
  }

  pdfDoc.prototype.addImages = function() {
    for(c in this.canvobjs) {
      var pw = this.document.internal.pageSize.width
      var ph = this.document.internal.pageSize.height
      var iw = this.canvobjs[c].img.naturalWidth
      var ih = this.canvobjs[c].img.naturalHeight
      var pr = pw/ph
      var ir = iw/ih
      if(pr<ir) {
        var w = pw
        var h = pw/ir
      } else {
        var h = ph
        var w = ph*ir
      }
      this.document.addPage()
      // this.document.addImage(this.canvobjs[c].img, (pw-w)/2, (ph-h)/2, w, h )
      this.document.addImage(this.reencodeImg(this.canvobjs[c].img,setup["quality"]), (pw-w)/2, (ph-h)/2, w, h )
    }
  }

}

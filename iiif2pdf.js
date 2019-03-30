/*
 *
 * (c) Leander Seige, 2018, GPL Version 3, leander@seige.name
 *
 */


function iiif2pdf(config) {

  var ctrl
  
  var i18n = {
    de: {
      selectResolution: 'Auflösung wählen',
      selectQuality: 'Qualität wählen',
      createPdf: 'PDF erzeugen',
      savePdf: 'PDF speichern',
      status: 'Status',
      downloading: 'Herunterladen:',
      merging: 'Füge zusammen',
      metadata: 'Metadaten',
      ready: 'Fertig.',
      firstCanvas: 'Seiten von',
      lastCanvas: 'bis',
      numberOfPagesWarning: 'Sie haben eine große Anzahl von Seiten ausgewählt. Das Erzeugen des PDF kann je nach Größe eine längere Zeit in Anspruch nehmen und den Browser erheblich auslasten.',
    },
    en: {
      selectResolution: 'Select Resolution',
      selectQuality: 'Select Quality',
      createPdf: 'Create PDF',
      savePdf: 'Save PDF',
      status: 'Status',
      downloading: 'Downloading',
      merging: 'Merging',
      metadata: 'Metadata',
      ready: 'Ready.',
      firstCanvas: 'Pages from',
      lastCanvas: 'to',
      numberOfPagesWarning: 'You have selected a large number of pages. The PDF generation might take some time and severely affect your browser\'s performance, depending on the size.',
    }
  }

  var setup = {
    "id":"myWidget",
    "resolution":"1024",
    "mode":"gui",
    "resolutions" : ["Max","2048","1024","512"],
    "orientation" : "portrait",
    "orientations": ["portrait","landscape"],
    "format":"a4",
    "formats":["a4","letter","legal","a3"],
    "quality":0.7,
    "i18n": i18n.en,
    "selectFromTo": false,
    "showWarning": false,
    "warningNumberOfPages": 100,
  }

  // Class controllerGUI

  function controllerGUI() {
    var prog
    var btns
    var btnc
    var selr
    var selq
    var stat

    var m
    var firstCanvas
    var lastCanvas
    var hint

    var tmp

    var divid = document.getElementById(setup["id"])
    
    tmp = document.createElement("label")
    tmp.setAttribute("for", "iiif2pdf_selr")
    tmp.classList.add("iiif2pdf");
    tmp.innerHTML=setup.i18n.selectResolution
    divid.appendChild(tmp)

    this.selr = document.createElement("select")
    this.selr.setAttribute("id", "iiif2pdf_selr")
    this.selr.onchange=function() { setup['resolution']=ctrl.selr.value }
    this.selr.classList.add("iiif2pdf");
    divid.appendChild(this.selr)

    for (var i = 0; i < setup.resolutions.length; i++) {
        var option = document.createElement("option")
        option.value = setup.resolutions[i]
        option.text = setup.resolutions[i]
        if(setup.resolutions[i]==setup["resolution"]) {
          option.setAttribute("selected",true)
        }
        this.selr.appendChild(option)
    }

    divid.appendChild(document.createElement("br"))

    tmp = document.createElement("label")
    tmp.setAttribute("for", "iiif2pdf_selq")
    tmp.classList.add("iiif2pdf");
    tmp.innerHTML=setup.i18n.selectQuality
    divid.appendChild(tmp)

    this.selq = document.createElement("input")
    this.selq.setAttribute("id", "iiif2pdf_selq")
    this.selq.setAttribute("type", "range")
    this.selq.setAttribute("min", "10")
    this.selq.setAttribute("max", "100")
    this.selq.setAttribute("value", setup['quality']*100)
    this.selq.classList.add("iiif2pdf");
    this.selq.oninput=function() {
      setup['quality']=ctrl.selq.value/100
      ctrl.quad.innerHTML=setup['quality']
    }
    this.quad = document.createElement("span")
    this.quad.setAttribute("id", "iiif2pdf_quad")
    this.quad.classList.add("iiif2pdf");
    this.quad.innerHTML=setup['quality']
    divid.appendChild(this.selq)
    divid.appendChild(this.quad)

    divid.appendChild(document.createElement("br"))

    if (setup["showWarning"]) {
      this.hint = document.createElement("span")
      this.hint.setAttribute("id", "iiif2pdf_hint")
      this.hint.classList.add("iiif2pdf")
      divid.appendChild(this.hint)
      divid.appendChild(document.createElement("br"))
    }
    
    this.btnc = document.createElement("button")
    var create_txt = document.createTextNode(setup.i18n.createPdf)
    this.btnc.appendChild(create_txt)
    this.btnc.classList.add("iiif2pdf");
    divid.appendChild(this.btnc)
    this.btnc.onclick=function(){ctrl.renderPdf()}

    this.btns = document.createElement("button")
    this.btns.setAttribute("disabled","true")
    var save_txt = document.createTextNode(setup.i18n.savePdf)
    this.btns.appendChild(save_txt)
    this.btns.classList.add("iiif2pdf");
    divid.appendChild(this.btns)

    divid.appendChild(document.createElement("br"))

    this.prog = document.createElement("progress")
    this.prog.setAttribute("value", "0")
    this.prog.setAttribute("max", "100")
    this.prog.classList.add("iiif2pdf");
    divid.appendChild(this.prog)

    this.stat = document.createElement("p")
    this.stat.setAttribute("readonly","true")
    this.stat.setAttribute("type", "text")
    this.stat.innerHTML=setup.i18n.status
    this.stat.classList.add("iiif2pdf");
    divid.appendChild(this.stat)

    this.loadData()
  }

  controllerGUI.prototype.loadData = function() {
    this.m = new iiifManifest()
  }

  controllerGUI.prototype.updateControls = function() {
    this_ = this
    this.firstCanvas = this.m.canvases[0];
    this.lastCanvas = this.m.canvases[this.m.canvases.length-1];
    if (!setup["selectFromTo"]) return;
    if (this.firstCanvas != this.lastCanvas)
    {
      this.selectFirst = this.createCanvasSelect(this.firstCanvas, "iiif2pdf_first")
      this.selectFirst.onchange = function(event) {
        this_.firstCanvas = this.value;
        if (this_.m.canvases.indexOf(this.value) > this_.m.canvases.indexOf(this_.lastCanvas)) {
          this_.lastCanvas = this.value;
          this_.selectLast.value = this.value
        }
        this_.updateSizeHint()
      }
      this.selectLast = this.createCanvasSelect(this.lastCanvas, "iiif2pdf_last")
      this.selectLast.onchange = function(event) {
        this_.lastCanvas = this.value;
        if (this_.m.canvases.indexOf(this.value) < this_.m.canvases.indexOf(this_.firstCanvas)) {
          this_.firstCanvas = this.value;
          this_.selectFirst.value = this.value
        }
        this_.updateSizeHint()
      }
      var nextBr = this.quad.nextSibling
      this.quad.parentNode.insertBefore(document.createElement("br"), nextBr)
      this.quad.parentNode.insertBefore(this.createLabel(setup.i18n.firstCanvas, "iiif2pdf_first"), nextBr)
      this.quad.parentNode.insertBefore(this.selectFirst, nextBr)
      this.quad.parentNode.insertBefore(this.createLabel(setup.i18n.lastCanvas, "iiif2pdf_last"), nextBr)
      this.quad.parentNode.insertBefore(this.selectLast, nextBr)
      this.updateSizeHint()
    }
  }
  
  controllerGUI.prototype.createLabel = function(label, labelFor) {
    var labelElement = document.createElement("label")
    labelElement.setAttribute("for", labelFor)
    labelElement.classList.add("iiif2pdf");
    labelElement.innerHTML=label
    return labelElement;
  }

  controllerGUI.prototype.createCanvasSelect = function(canvasId, elementId) {
    var select = document.createElement("select")
    select.setAttribute("id", elementId)
    select.classList.add("iiif2pdf")
    for (var c in this.m.canvases) {
      var label = this.m.sequenceCanvasLabels[this.m.canvases[c]]+" ("+(this.m.sequenceCanvases.indexOf(this.m.canvases[c])+1)+")";
      var option = document.createElement("option")
      option.setAttribute("value", this.m.canvases[c])
      if (canvasId == this.m.canvases[c]) {
        option.setAttribute("selected", "true")
      }
      option.innerHTML=label;
      select.appendChild(option)        
    }
    return select
  }
  
  controllerGUI.prototype.updateSizeHint = function() {
    if (!setup["showWarning"]) return;
    if (this.m.canvases.indexOf(this.lastCanvas) - this.m.canvases.indexOf(this.firstCanvas) + 1 > setup["warningNumberOfPages"]) {
      this.hint.innerHTML = setup.i18n.numberOfPagesWarning
    } else {
      this.hint.innerHTML = ''
    }
  }

  controllerGUI.prototype.parseData = function() {
    this.m.parseManifest()
  }

  controllerGUI.prototype.renderPdf = function() {
    this.btnc.setAttribute("disabled","true")
    this.selr.setAttribute("disabled","true")
    if (setup["selectFromTo"] && this.m.canvases.length>1) {
      this.selectFirst.setAttribute("disabled","true")
      this.selectLast.setAttribute("disabled","true")
      var actualCanvases = []
      for (var i = this.m.canvases.indexOf(this.firstCanvas); i<=this.m.canvases.indexOf(this.lastCanvas); i++) {
        actualCanvases.push(this.m.canvases[i])
      }
      this.m.canvases = actualCanvases
    }
    this.m.renderPdf();
  }

  controllerGUI.prototype.getImageSuffix = function() {
    if(setup['resolution']=="Max") {
      return "/full/full/0/default.jpg"
    } else {
      return "/full/"+setup['resolution']+",/0/default.jpg"
    }
  }

  controllerGUI.prototype.update = function(value,text) {
    this.prog.setAttribute("value",value)
    this.stat.innerHTML=text
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
    this.renderPdf()
  }

  controllerAuto.prototype.renderPdf = function() {
    this.m.renderPdf();
  }

  controllerAuto.prototype.updateControls = function() {}

  controllerAuto.prototype.getImageSuffix = function() {
    if(setup['resolution']=="Max") {
      return "/full/full/0/default.jpg"
    } else {
      return "/full/"+setup['resolution']+",/0/default.jpg"
    }
  }

  controllerAuto.prototype.update = function(value,text) {
    this.prog.setAttribute("value",value)
    this.stat.innerHTML=text
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
      ctrl.updateControls()
    })
  }

  iiifManifest.prototype.parseManifest = function() {
    this.sequenceCanvasLabels = {};
    this.sequenceCanvases = [];

    var subset = this.getSubset(setup["uri"])
    if(subset['@type']=="sc:Range") {
      this.iiifobj = new iiifRange(subset)
      for (var cv in this.data.sequences[0].canvases) {
        this.sequenceCanvasLabels[this.data.sequences[0].canvases[cv]['@id']] = this.data.sequences[0].canvases[cv]['label'];
        this.sequenceCanvases.push(this.data.sequences[0].canvases[cv]['@id']);
      }
    } else if(subset['@type']=="sc:Sequence") {
      this.iiifobj = new iiifSequence(subset)
      for(var cv in this.iiifobj.data['canvases']) {
        this.sequenceCanvasLabels[this.iiifobj.data['canvases'][cv]['@id']] = this.iiifobj.data['canvases'][cv]['label'];
        this.sequenceCanvases.push(this.iiifobj.data['canvases'][cv]['@id']);
      }
    } else if(subset['@type']=="sc:Canvas") {
      this.iiifobj = new iiifCanvas(subset)
    }
    this.canvases = this.iiifobj.getCanvases()
  }
  
  iiifManifest.prototype.renderPdf = function() {
    var doc = new pdfDoc(this.iiifobj,this.canvases,this)
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
      var msg = setup.i18n.downloading+" "+(pdfobj.mx-pdfobj.cd)+" / "+pdfobj.mx
      var prg = ((pdfobj.mx-pdfobj.cd)*100)/pdfobj.mx
      ctrl.update(prg,msg)
      if(pdfobj.cd==0) {
        ctrl.update(100,setup.i18n.merging)
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
      cursor+=this.filterHtmlTags(this.document, cursor+8, m.data['attribution']);
    }
    if('license' in m.data) {
      cursor+=8
      this.document.text(20, cursor, m.data['license'])
    }
    cursor+=12
    this.document.setFontSize(14)
    this.document.text(20, cursor, setup.i18n.metadata)
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
    this.pdfFilename = m.data['label'];
    if('label' in o.data) {
      this.pdfFilename += ' - '+o.data['label'];
    }
    this.pdfFilename = (this.pdfFilename.replace(/[^a-zA-Z0-9-_\.äüöÄÜÖß]/g, ' ')+'.pdf').replace(/\s+/g, ' '); 
  }
  
  pdfDoc.prototype.filterHtmlTags = function(document, cursor, text) {
    var moveCursor = 0;
    var texts=text.split(/<br\s*\/?>/g);
    for (var t in texts) {
      document.text(20, cursor+moveCursor, texts[t].replace(/(<([^>]+)>)/g, ''));
      moveCursor+=8;
    }
    return moveCursor;
  };

  pdfDoc.prototype.savePDF = function() {
    this.document.save(this.pdfFilename);
  }

  pdfDoc.prototype.reencodeImg = function(img,q) {
    var canvas = document.createElement('canvas')
    canvas.id = "delme"
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    var ctx = canvas.getContext("2d")
    ctx.drawImage(img,0,0)
    var retimg = canvas.toDataURL('image/jpeg',q)
    canvas.remove()
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
      this.document.addImage(this.reencodeImg(this.canvobjs[c].img,setup["quality"]), (pw-w)/2, (ph-h)/2, w, h )
    }
    ctrl.update(100,setup.i18n.ready)
  }

  $(document).ready(function () {
    if (config['i18n'] !== undefined){
      if (typeof config['i18n'] == 'string' || config['i18n'] instanceof String){
        config.i18n = i18n[config.i18n];
      } else {
        for (i in setup.i18n) {
          config.i18n[i] = config.i18n[i] == null ? setup.i18n[i] : config.i18n[i];
        }
      }
    }
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

}

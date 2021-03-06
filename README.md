# iiif2pdf

This small Javascript widget implements client side rendering of PDFs from arbitrary IIIF sources. All it needs is a URL to a manifest file and the URI (@id) of a Sequence, Range or Canvas.

This widget uses [jsPDF](https://github.com/MrRio/jsPDF) and [jQuery](https://jquery.com/).

![Widget Screenshot](images/widget.png)

Check out the [demo](http://htmlpreview.github.io/?https://github.com/leanderseige/iiif2pdf/blob/master/demo.html), paste two URIs (manifest + sequence, range or canvas) and create arbitrary PDFs 

## ToDos

* use page orientation and format
* crawl hierarchical ranges
* select start / end Canvases inside a Sequence
* estimate filesize in realtime as user changes configuration

<?php

/*
 * This small program generates PDF files from IIIF sources on the fly.
 *
 * (c) Leander Seige, 2018, leander@seige.name
 *
 * GNU General Public License 3
 *
 */

class iiifPDF {
    public $uri;
    public $data;

    public function __construct($data) {
        $this->uri = $data['@id'];
        $this->data = $data;
    }
}

class iiifRange extends iiifPDF {

    public function getCanvases() {
        $retval = array();
        foreach($this->data['canvases'] as $c) {
            $retval[]=$c;
        }
        return $retval;
    }

}

class iiifManifest {
    public $uri;
    public $data;

    public function __construct($uri) {
        $this->uri = $uri;
        $this->data = json_decode(file_get_contents($uri),true,1024);
    }

    public function getSubset($uri,$local_data) {
        if($local_data==null) $local_data=$this->data; 
        $retval = false;
        foreach($local_data as $e) {
            if(is_array($e)) {
                if(isset($e["@id"])) {
                    if($e["@id"] == $uri) {
                        return $e;
                    }
                }
                $retval = $this->getSubset($uri,$e);
                if($retval!=false) return $retval;
            }
        }
        return $retval;
    }   
}

class iiifCanvas {
    public $uri;
    public $data;

    public function __construct($data) {
        $this->uri = $data["@id"];
        $this->data = $data;
    }

    public function getService() {
        return $this->data['images'][0]['resource']['service']['@id'];
    }
}

class docPDF {
    public $in_files;

    public function __construct() {
        $this->in_files = array();
    }

    public function getSslPage($url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_REFERER, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        $result = curl_exec($ch);
        curl_close($ch);
        return $result;
    }

    public function addFile($url) {
        $temp_file = sys_get_temp_dir()."/".md5($url).".jpg";
        $in_url = $url."/full/full/0/default.jpg";
        $temp_data = $this->getSslPage($in_url);
        file_put_contents($temp_file,$temp_data); 
        $this->in_files[] = $temp_file;
    }

}

function getgetvar($key) {
    if(isset($_GET[$key])) {
        if(filter_var($_GET[$key], FILTER_VALIDATE_URL)) {
            return $_GET[$key];
        }
    }
    return false;
}

$m = getgetvar('manifest');
$u = getgetvar('uri');

if($m === false) die("no manifest");
if($u === false) die("no uri");

$manifest = new iiifManifest($m);

$range = $manifest->getSubset($u,null);

$range = new iiifRange($manifest->getSubset($u,null));

$canvases = array();

foreach($range->getCanvases() as $c) {
    $co = new iiifCanvas($manifest->getSubset($c,null));
    $canvases[] = $co;
}

$pdf = new docPDF();

foreach($canvases as $c) {
    $pdf->addFile($c->getService());
}

$pdf = new Imagick($pdf->in_files);
$pdf->setImageFormat('pdf');
$pdf->writeImages('/tmp/combined.pdf', true); 

header('Content-type: application/pdf');
header('Content-Disposition: attachment; filename="test.pdf"');
readfile('/tmp/combined.pdf');

?>

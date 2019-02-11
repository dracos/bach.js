window.is_safari = ( typeof window.webkitAudioContext === "function" );

bachStart = function() {
  document.getElementById('output').innerHTML = "";
  document.getElementById('stop').style.display = 'block';
  bach.start()
};

bachStop = function() {
    bach.stop();
    document.getElementById('stop').style.display = 'none';
};

bachLoad = function(file) {
    bachStop();
    var oput = document.getElementById('output');
    oput.style.height = oput.offsetHeight + 'px';
    fetch(file).then(function(res) {
        res.text().then(function(text) {
            data = text.split("\n");
            bach.process(data);
            if ( window.is_safari ) {
              oput.innerHTML = '<li id="play">Ready<br /><a href="javascript:bachStart();">PLAY</a></li>'
            } else {
              bachStart();
            }
        });
    });
};

bachStop = function() {
    bach.stop();
    document.getElementById('stop').style.display = 'none';
};

bachLoad = function(file) {
    bachStop();
    var oput = document.getElementById('output');
    oput.innerHTML = '';
    oput.style.height = oput.offsetHeight + 'px';
    document.getElementById('stop').style.display = 'block';
    fetch(file).then(function(res) {
        res.text().then(function(text) {
            data = text.split("\n");
            bach.process(data);
        });
    });
};

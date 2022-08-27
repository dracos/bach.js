bachStop = function() {
    bach.stop();
    document.getElementById('stop').style.display = 'none';
};

bachLoad = function(e) {
    e.preventDefault();
    bachStop();
    var oput = document.getElementById('output');
    oput.innerHTML = '';
    oput.style.height = oput.offsetHeight + 'px';
    document.getElementById('stop').style.display = 'block';
    data = this.dataset.data.split("\n");
    bach.play(data);
};

document.querySelectorAll('#examples a').forEach(function(a) {
    var file = 'examples/' + a.innerText;
    fetch(file).then(function(res) {
        res.text().then(function(text) {
            a.dataset.data = text;
        });
    });
    a.addEventListener('click', bachLoad);
});



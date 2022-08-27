import { stop, play } from './bach.js';

var stopElt = document.getElementById('stop');

var bachStop = function(e) {
    e.preventDefault();
    stop();
    stopElt.style.display = 'none';
};

document.getElementById('stop').addEventListener('click', bachStop);

var bachLoad = function(e) {
    e.preventDefault();
    bachStop(e);
    var oput = document.getElementById('output');
    oput.innerHTML = '';
    oput.style.height = oput.offsetHeight + 'px';
    stopElt.style.display = 'block';
    var data = this.dataset.data.split("\n");
    play(data);
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



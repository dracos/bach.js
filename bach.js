(function(){

var keys = [
    [ 'E', 'F', 'G', 'A', 'Bb', 'C#', 'D' ], // Dm
    [ 'E', 'F#', 'G', 'A', 'B', 'C#', 'D' ],
    [ 'E', 'F#', 'G', 'A', 'B', 'C', 'D#' ], // Em
    [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D#' ],
    [ 'E', 'F', 'G', 'Ab', 'Bb', 'C', 'Db' ], // Fm
    [ 'E', 'F', 'G', 'A', 'Bb', 'C', 'D' ],
    [ 'Eb', 'F#', 'G', 'A', 'Bb', 'C', 'D' ], // Gm
    [ 'E', 'F#', 'G', 'A', 'B', 'C', 'D' ],
    [ 'E', 'F', 'G#', 'A', 'B', 'C', 'D' ], // Am
    [ 'E', 'F#', 'G#', 'A', 'B', 'C#', 'D' ],
    [ 'E', 'F#', 'G', 'A#', 'B', 'C#', 'D' ], // Bm
    [ 'Eb', 'F', 'G', 'A', 'Bb', 'C', 'D' ], // Bb
    [ 'Eb', 'F', 'G', 'Ab', 'B', 'C', 'D' ], // Cm
    [ 'E', 'F', 'G', 'A', 'B', 'C', 'D' ],
];

var lengths = {
    48: 'dottedMinim',
    32: 'minim',
    24: 'dottedCrotchet',
    16: 'crotchet',
    12: 'dottedQuaver',
    8: 'quaver',
    4: 'semiquaver',
}

var i; // Current note count
var mod; // Current modulation count
var notes; // Number of notes
var modsL; // Number of modulations
var mods, key, major; // Modulations
var sop, alt, ten, bas, chord, length; // Notes
var messages; // Things spotted about the chords
var player; // The web player

window.bach = bach = {};

bach.stop = function() {
    player && player.stop();
};

bach.play = function play(data) {
    var conductor = new BandJS(null, 'european');
    conductor.setTempo(60);
    var soprano = conductor.createInstrument('triangle'),
        alto = conductor.createInstrument('triangle'),
        tenor = conductor.createInstrument('triangle'),
        bass = conductor.createInstrument('triangle');

    i = 0;
    version = data[i++];

    mods = [], key = [], major = [];
    sop = [], alt = [], ten = [], bas = [], chord = [], length = [];

    load_data();

    var comments = {};
    conductor.events.subscribe('bufferNotes', function(data) {
        if (data.note.bach_messages) {
            comments[data.note.bach_step] = [data.note.startTime, data.note.bach_messages];
        }
    });
    conductor.events.subscribe('updateTotalPlayTime', function(data) {
        var keys = Object.keys(comments);
        keys.sort((a, b) => a - b);
        while (keys.length && comments[keys[0]][0] < data.currentPlayTime) {
            var oput = document.getElementById('output');
            oput.innerHTML += '<li>' + (parseInt(keys[0])+1) + ': ' + (comments[keys[0]][1]);
            oput.scrollTop = oput.scrollHeight; // - oput.clientHeight;
            delete comments[keys[0]];
            keys.shift();
        }
    });

    mod = 0;

    for (i=0; i<notes; i++) {
        messages = [];
        examine_chord();
        note(sop, soprano, messages);
        note(alt, alto, messages);
        note(ten, tenor, messages);
        note(bas, bass, messages);
    }

    player = conductor.finish();
    player.play();
};

/* Processes for comments, but does not do any playing, just returns them */
bach.process = function process(data) {
    i = 0;
    version = data[i++];
    mods = [], key = [], major = [];
    sop = [], alt = [], ten = [], bas = [], chord = [], length = [];
    mod = 0;
    load_data();
    var comments = {};
    for (i=0; i<notes; i++) {
        messages = [];
        examine_chord();
        if (messages.length) {
            comments[i] = messages;
        }
        if (major[mod] == 0 && i == notes-1) {
            let third = (key[mod]+2) % 7;
            if ((sop[i] % 7 == third) || (alt[i] % 7 == third) || (ten[i] % 7 == third) || (bas[i] % 7 == third)) {
                messages = messages || []; messages.push('Tierce de Picardie');
            }
        }
    }
    return comments;
}

function load_data() {
    if (version == 3) {
        load_version_three();
    } else if (version == 2) {
        load_version_two();
    }
    for (var j=0; j<notes; j++) {
        var line = data[i++];
        sop.push(line.charCodeAt(0) - 64);
        alt.push(line.charCodeAt(1) - 64);
        ten.push(line.charCodeAt(2) - 64);
        bas.push(line.charCodeAt(3) - 64);
        chord.push(line.charCodeAt(4) - 64);
    }
    for (var j=0; j<notes; j++) {
        length.push(parseInt(data[i++]));
    }
}

function examine_chord() {
    if (mod < modsL && i+1 == mods[mod+1]) {
        mod += 1;
        messages.push('Modulating to new key');
    }
    real = real_chord(i);
    var sa = 0, st = 0, sb = 0, at = 0, ab = 0, tb = 0;

    switch (roman(i)) {
        case "Ic":
            if (i < notes-1 && chord[i] == 1 && next_chord() != 5 && next_chord() != 9)
                messages.push("Chord Ic must immediately be followed by V");
            break;
        case "II":
            if (major[mod] == 0) messages.push("Chord II must be IIb in a minor key");
            break;
        case "III": case "IIIb":
            if (major[mod] == 0) messages.push("Avoid chord III in the minor key");
            break;
        case "V": case "V7":
            if (i < notes-1 && next_roman() == "IV") messages.push("V->IV not allowed");
            break;
        case "Vb": case "V7b":
            if (i < notes-1 && next_roman() == 'IV') messages.push("Vb->IV not allowed");
            break;
        case "Vc": case "V7c":
            if (i > 0 && i < notes-1 && (chord[i] == 5 || chord[i] == 9) && (last_chord() != 1 || next_chord() != 1))
                messages.push("Chord Vc must come between chords I and Ib");
            break;
        case "V7d":
            if (i < notes-1 && (chord[i] == 5 || chord[i] == 9) && next_roman() != "Ib")
                messages.push("Chord V7d must be followed by Ib");
            break;
        case "VII":
             messages.push("Chord VII must be VIIb as it is diminished");
            break;
        case "IIc": case "IIIc": case "IVc": case "VIc": case "VIIc":
            messages.push("There is no such chord as " + roman(i));
            break;
    }

    check_spacing();
    check_major3rd();
    if (real == 3 || real == 7 || real == 13) check_leading();
    if (i > 0) check_crossing();
    check_overlap();
    if (i < notes-1) {
        check_lead_step();
        if (chord[i] == 9 || (chord[i] == 10 && chord[i-1] == 9)) check_7th_step();
        sa = check_consec(sop[i], alt[i], sop[i+1], alt[i+1], 1, "SA")
        st = check_consec(sop[i], ten[i], sop[i+1], ten[i+1], 1, "ST")
        sb = check_consec(sop[i], bas[i], sop[i+1], bas[i+1], 1, "SB")
        at = check_consec(alt[i], ten[i], alt[i+1], ten[i+1], 1, "AT")
        ab = check_consec(alt[i], bas[i], alt[i+1], bas[i+1], 1, "AB")
        tb = check_consec(ten[i], bas[i], ten[i+1], bas[i+1], 1, "TB")
    }
    if (i < notes-2 && (chord[i+1] == 12 || chord[i+1] == 10)) {
        if (sa == 0) check_consec(sop[i], alt[i], sop[i+2], alt[i+2], 2, "SA without unessential", sa)
        if (st == 0) check_consec(sop[i], ten[i], sop[i+2], ten[i+2], 2, "ST without unessential", st)
        if (sb == 0) check_consec(sop[i], bas[i], sop[i+2], bas[i+2], 2, "SB without unessential", sb)
        if (at == 0) check_consec(alt[i], ten[i], alt[i+2], ten[i+2], 2, "AT without unessential", at)
        if (ab == 0) check_consec(alt[i], bas[i], alt[i+2], bas[i+2], 2, "AB without unessential", ab)
        if (tb == 0) check_consec(ten[i], bas[i], ten[i+2], bas[i+2], 2, "TB without unessential", tb)
    }

    if (chord[i] == 10) check_unaccented();
    if (chord[i] == 11) check_accented();
    if (chord[i] == 12) check_suspension();
}

function real_chord(c) {
    if (chord[c] == 10) return chord[c-1];
    if (chord[c] == 11 || chord[c] == 12) return chord[c+1];
    return chord[c];
}

function check_spacing() {
    if (sop[i] > 7 + alt[i]) messages.push("Spacing between soprano and alto");
    if (alt[i] > 7 + ten[i]) messages.push("Spacing between alto and tenor");
}

function check_major3rd() {
    var s;
    if (major[mod] == 1) {
        if (real == 1 || real == 4 || real == 5 || real == 9) {
            switch (real) {
                case 1: third = (key[mod] + 2) % 7; break;
                case 4: third = (key[mod] + 5) % 7; break;
                case 5: case 9: third = (key[mod] + 6) % 7; break;
            }
            var thirds = 0;
            if (sop[i] % 7 == third) thirds++;
            if (alt[i] % 7 == third) thirds++;
            if (ten[i] % 7 == third) thirds++;
            if (bas[i] % 7 == third) thirds++;
            if (thirds > 1) {
                var s = "Doubling major third"
                if (real_chord(i) == 6) s += " - Chord VI";
                messages.push(s);
            }
        }
    } else {
        if (real == 5 || real == 9 || real == 6) {
            switch (real) {
                case 6: third = key[mod]; break;
                case 5: case 9: third = (key[mod] + 6) % 7; break;
            }
            var thirds = 0;
            if (sop[i] % 7 == third) thirds++;
            if (alt[i] % 7 == third) thirds++;
            if (ten[i] % 7 == third) thirds++;
            if (bas[i] % 7 == third) thirds++;
            if (thirds > 1) {
                s = "Doubling major third"
                if (real_chord(i) == 6) s += " - Chord VI";
                messages.push(s);
            }
        }
    }
}

function check_leading() {
    var lead = (key[mod] + 6) % 7;
    var leads = 0;
    if (sop[i] % 7 == lead) leads += 1;
    if (alt[i] % 7 == lead) leads += 1;
    if (ten[i] % 7 == lead) leads += 1;
    if (bas[i] % 7 == lead) leads += 1;
    if (leads > 1) messages.push("Doubling leading note");
}

function check_crossing() {
    if (alt[i] > sop[i-1]) messages.push("Alto crossing soprano")
    if (ten[i] > alt[i-1]) messages.push("Tenor crossing alto")
    if (bas[i] > ten[i-1]) messages.push("Bass crossing tenor")
}

function check_overlap() {
    if (alt[i] > sop[i]) messages.push("Alto higher than soprano")
    if (ten[i] > alt[i]) messages.push("Tenor higher than alto")
    if (bas[i] > ten[i]) messages.push("Bass higher than tenor")
}

function check_lead_step() {
    var l = (key[mod] + 6) % 7;
    if (chord[i+1] == 10 || chord[i] == 11 || chord[i] == 12 || chord[i+1] == chord[i]) return;
    if (sop[i] % 7 == l && sop[nn()] % 7 != key[mod]) messages.push("Leading note should move to tonic");
    if (alt[i] % 7 == l && alt[nn()] % 7 != key[mod]) messages.push("Leading note should move to tonic");
    if (ten[i] % 7 == l && ten[nn()] % 7 != key[mod]) messages.push("Leading note should move to tonic");
    if (bas[i] % 7 == l && bas[nn()] % 7 != key[mod]) messages.push("Leading note should move to tonic");
}

function check_7th_step() {
    var th = (key[mod] + 3) % 7;
    var rs = (key[mod] + 2) % 7;
    if (sop[i] % 7 == th && sop[nn()] % 7 != rs) messages.push("7th must resolve by step");
    if (alt[i] % 7 == th && alt[nn()] % 7 != rs) messages.push("7th must resolve by step");
    if (ten[i] % 7 == th && ten[nn()] % 7 != rs) messages.push("7th must resolve by step");
    if (bas[i] % 7 == th && bas[nn()] % 7 != rs) messages.push("7th must resolve by step");
}

function check_consec(h1, l1, h2, l2, p, s) {
    var f1 = (h1 - l1) % 7 + 1;
    var f2 = (h2 - l2) % 7 + 1;
    if (f1 == 5 && f2 == 5 && h1 != h2) {
        var l = (key[mod] + 6) % 7;
        var ll1 = l1 % 7;
        var ll2 = l2 % 7;
        var hh1 = h1 % 7;
        var hh2 = h2 % 7;
        if (major[mod] == 0 && (ll1 == l || ll2 == l || hh1 == l || hh2 == l)) return;
        if (real_chord(i) == 9 && ll1 == l) return;
        if (real_chord(i+p) == 9 && ll2 == l) return;
        if (real_chord(i) == 5 && ll1 == l) return;
        if (real_chord(i+p) == 5 && ll2 == l) return;
        if (real_chord(i) == 7 || real_chord(i+p) == 7) return;
        if (major[mod] == 0 && (real_chord(i) == 2 || real_chord(i+p) == 2)) return;
        messages.push("Consecutive 5th (" + s + ")");
        return 1;
    }
    if (f1 == 1 && f2 == 1 && h1 != h2) {
        if (h1 == l1) messages.push("Consecutive union (" + s + ")");
        else messages.push("Consecutive octave (" + s + ")");
        return 1;
    }
    return 0;
}

function check_unaccented() {
    if (sop[i-1] != sop[i]) checkPA(sop[i-1], sop[i], sop[i+1])
    if (alt[i-1] != alt[i]) checkPA(alt[i-1], alt[i], alt[i+1])
    if (ten[i-1] != ten[i]) checkPA(ten[i-1], ten[i], ten[i+1])
    if (bas[i-1] != bas[i]) checkPA(bas[i-1], bas[i], bas[i+1])
}

function check_accented() {
    if (sop[i+1] != sop[i]) checkPA(sop[i-1], sop[i], sop[i+1])
    if (alt[i+1] != alt[i]) checkPA(alt[i-1], alt[i], alt[i+1])
    if (ten[i+1] != ten[i]) checkPA(ten[i-1], ten[i], ten[i+1])
    if (bas[i+1] != bas[i]) checkPA(bas[i-1], bas[i], bas[i+1])
}

function checkPA(bef, cur, aft) {
    if (bef == cur+1 && aft == cur-1) messages.push("Downwards passing note");
    else if (bef == cur-1 && aft == cur+1) messages.push("Upwards passing note");
    else if (bef == cur+1 && aft == cur+1) messages.push("Lower auxiliary note")
    else if (bef == cur-1 && aft == cur-1) messages.push("Upper auxiliary note")
    else if ((bef == cur+1 || bef == cur-1) && aft == cur) messages.push("Anticipation")
    else messages.push("Illegal passing/auxiliary note");
}

function check_suspension() {
    if (sop[i+1] != sop[i]) check_sus(sop[i-1], sop[i], sop[i+1])
    if (alt[i+1] != alt[i]) check_sus(alt[i-1], alt[i], alt[i+1])
    if (ten[i+1] != ten[i]) check_sus(ten[i-1], ten[i], ten[i+1])
    if (bas[i+1] != bas[i]) check_sus(bas[i-1], bas[i], bas[i+1])
}

function check_sus(bef, cur, aft) {
    var a, b, c, af, s;
    if (real_chord(i+1) == 9) a = key[mod] + 4;
    else a = key[mod] + real_chord(i+1) - 1;
    a = a % 7;
    b = (a + 2) % 7;
    c = (a + 4) % 7;
    af = aft % 7;
    if (bef == cur && cur == aft - 1 && af == a) s = "Suspended leading note";
    else if (bef == cur && cur == aft + 1 && af == a) s = "Suspended 9th";
    else if (bef == cur && af == b) s = "Suspended 4th";
    else if (bef == cur && af == c) s = "Suspended 6th";
    if (bef == cur && s) {
        if (sop[i] % 7 == af || alt[i] % 7 == af || ten[i] % 7 == af || bas[i] % 7 == af) s += " - Note of resolution and suspension sounded at same time";
        messages.push(s);
    } else {
        messages.push("Illegal suspension");
    }
}

function roman(n) {
    var s, a, b;
    switch (chord[n]) {
        case 1: s = "I"; a = 2; b = 4; break;
        case 2: s = "II"; a = 3; b = 5; break;
        case 3: s = "III"; a = 4; b = 6; break;
        case 4: s = "IV"; a = 5; b = 0; break;
        case 5: s = "V"; a = 6; b = 1; break;
        case 6: s = "VI"; a = 0; b = 2; break;
        case 7: s = "VII"; a = 1; b = 3; break;
        case 9:
            s = "V7"; a = 6; b = 1;
            if (bas[n] % 7 == (key[mod] + 3) % 7) s += 'd';
            break;
        case 10: s = roman(n-1); a = 7; break;
        case 11:
        case 12:
            s = roman(n+1); a = 7; break;
        case 13:
            s = "VII7"; a = 1; b = 3;
            if (bas[n] % 7 == (key[mod] + 5) % 7) s += 'd';
            break;
    }

    if (a < 7 && bas[n] % 7 == (key[mod] + a) % 7) s += 'b';
    if (a < 7 && bas[n] % 7 == (key[mod] + b) % 7) s += 'c';
    if (s[0] > 'a' && s[0] < 'e') s = '';
    return s;
}

function last_chord() {
    var c = chord[i-1];
    if (c == 11 || c == 12) return real_chord(i-2);
    else return real_chord(i-1);
}
function next_chord() {
    if (chord[i+1] == 10) return real_chord(i+2);
    else return real_chord(i+1);
}
function next_roman() {
    if (chord[i+1] == 10) return roman(i+2);
    else return roman(i+1);
}
function nn() {
    if (chord[i+1] == 12 || chord[i+1] == 10) return i+2;
    else return i+1;
}

function note(part, voice, messages) {
    var to = part[i];
    var l = key[mod] * 2 + major[mod];
    var t = to % 7;
    var r = Math.floor(to / 7);
    if (t == 0) { t = 7; r -= 1; }
    var p = keys[l][t-1];
    if (major[mod] == 0 && i == notes-1 && to % 7 == (key[mod]+2) % 7) {
        if (p[1] == 'b') p = p[0];
        else p+= '#';
        messages = messages || []; messages.push('Tierce de Picardie');
    }
    if (p[0] == 'C' || p[0] == 'D') p += 4 + r;
    else p += 3 + r;

    if (to == part[i-1] && chord[i] == 10) {
        return;
    }
    if (to == part[i-1] && (chord[i-1] == 11 || chord[i-1] == 12)) {
        return;
    }

    var lll = length[i];
    if (to == part[i+1] && chord[i+1] == 10) {
        lll += length[i+1];
    }
    if (to == part[i+1] && (chord[i] == 11 || chord[i] == 12)) {
        lll += length[i+1];
        // Worry about 12 ? 10
        if (to == part[i+2] && chord[i+2] == 10) {
            lll += length[i+2];
        }
        // Sigh, BBC BASIC version was easier here, in that you just said 'Play a note on this channel until it changes', not having to work out stop times...
        var nexti = i + 1;
        while (to == part[nexti+1] && (chord[nexti] == 11 || chord[nexti] == 12)) {
            lll += length[nexti+1];
            nexti++;
        }
    }
    voice.note(lengths[lll], p, lll >= 20 ? 0 : 1);
    if (messages.length) {
        voice.notes[voice.notes.length-1].bach_step = i;
        voice.notes[voice.notes.length-1].bach_messages = messages;
    }
}

function load_version_two() {
    notes = data[i++];
    modsL = 1;
    key[0] = parseInt(data[i++]);
    major[0] = parseInt(data[i++]);
}

function load_version_three() {
    notes = data[i++];
    modsL = data[i++];
    for (var j=0; j<modsL; j++) {
        mods.push(parseInt(data[i++]));
        key.push(parseInt(data[i++]));
        major.push(parseInt(data[i++]));
    }
}

})();

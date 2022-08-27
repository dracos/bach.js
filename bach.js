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

class Bach {
    notes; // Number of notes
    modsL; // Number of modulations

    // Modulations
    mods = [];
    key = [];
    major = [];

    // Notes
    sop = [];
    alt = [];
    ten = [];
    bas = [];
    chord = [];
    length = [];

    // Progress
    mod = 0; // Current modulation
    i = 0; // Current note

    constructor(data) {
        var i = 0;
        var version = data[i++];
        if (version == 3) {
            this.notes = data[i++];
            this.modsL = data[i++];
            for (var j=0; j<this.modsL; j++) {
                this.mods.push(parseInt(data[i++]));
                this.key.push(parseInt(data[i++]));
                this.major.push(parseInt(data[i++]));
            }
        } else if (version == 2) {
            this.notes = data[i++];
            this.modsL = 1;
            this.key[0] = parseInt(data[i++]);
            this.major[0] = parseInt(data[i++]);
        }
        for (var j=0; j<this.notes; j++) {
            var line = data[i++];
            this.sop.push(line.charCodeAt(0) - 64);
            this.alt.push(line.charCodeAt(1) - 64);
            this.ten.push(line.charCodeAt(2) - 64);
            this.bas.push(line.charCodeAt(3) - 64);
            this.chord.push(line.charCodeAt(4) - 64);
        }
        for (var j=0; j<this.notes; j++) {
            this.length.push(parseInt(data[i++]));
        }
    }

    examine_chord(i) {
        var messages = this.messages = [];
        this.i = i;
        if (this.mod < this.modsL && i+1 == this.mods[this.mod+1]) {
            this.mod += 1;
            messages.push('Modulating to new key');
        }
        var real = this.real_chord(i);
        var sa = 0, st = 0, sb = 0, at = 0, ab = 0, tb = 0;

        switch (this.roman(i)) {
            case "Ic":
                if (i < this.notes-1 && this.current_chord == 1 && this.next_real_chord != 5 && this.next_real_chord != 9)
                    messages.push("Chord Ic must immediately be followed by V");
                break;
            case "II":
                if (this.current_major == 0) messages.push("Chord II must be IIb in a minor key");
                break;
            case "III": case "IIIb":
                if (this.current_major == 0) messages.push("Avoid chord III in the minor key");
                break;
            case "V": case "V7":
                if (i < this.notes-1 && this.next_roman == "IV") messages.push("V->IV not allowed");
                break;
            case "Vb": case "V7b":
                if (i < this.notes-1 && this.next_roman == 'IV') messages.push("Vb->IV not allowed");
                break;
            case "Vc": case "V7c":
                if (i > 0 && i < this.notes-1 && (this.current_chord == 5 || this.current_chord == 9) && (this.last_real_chord != 1 || this.next_real_chord != 1))
                    messages.push("Chord Vc must come between chords I and Ib");
                break;
            case "V7d":
                if (i < this.notes-1 && (this.current_chord == 5 || this.current_chord == 9) && this.next_roman != "Ib")
                    messages.push("Chord V7d must be followed by Ib");
                break;
            case "VII":
                 messages.push("Chord VII must be VIIb as it is diminished");
                break;
            case "IIc": case "IIIc": case "IVc": case "VIc": case "VIIc":
                messages.push("There is no such chord as " + this.roman(i));
                break;
        }

        this.check_spacing();
        this.check_major3rd(real);
        if (real == 3 || real == 7 || real == 13) this.check_leading();
        if (i > 0) this.check_crossing();
        this.check_overlap();
        if (i < this.notes-1) {
            this.check_lead_step();
            if (this.current_chord == 9 || (this.current_chord == 10 && this.last_chord == 9)) this.check_7th_step();
            sa = this.check_consec('sop', 'alt', 1, "SA");
            st = this.check_consec('sop', 'ten', 1, "ST");
            sb = this.check_consec('sop', 'bas', 1, "SB");
            at = this.check_consec('alt', 'ten', 1, "AT");
            ab = this.check_consec('alt', 'bas', 1, "AB");
            tb = this.check_consec('ten', 'bas', 1, "TB");
        }
        if (i < this.notes-2 && (this.next_chord == 12 || this.next_chord == 10)) {
            if (sa == 0) this.check_consec('sop', 'alt', 2, "SA without unessential");
            if (st == 0) this.check_consec('sop', 'ten', 2, "ST without unessential");
            if (sb == 0) this.check_consec('sop', 'bas', 2, "SB without unessential");
            if (at == 0) this.check_consec('alt', 'ten', 2, "AT without unessential");
            if (ab == 0) this.check_consec('alt', 'bas', 2, "AB without unessential");
            if (tb == 0) this.check_consec('ten', 'bas', 2, "TB without unessential");
        }

        if (this.current_chord == 10) this.check_unaccented();
        if (this.current_chord == 11) this.check_accented();
        if (this.current_chord == 12) this.check_suspension();
        return messages;
    }

    get current_key() { return this.key[this.mod]; }
    get current_major() { return this.major[this.mod]; }

    note(part) {
        return this[part][this.i];
    }

    real_chord(c) {
        if (this.chord[c] == 10) return this.chord[c-1];
        if (this.chord[c] == 11 || this.chord[c] == 12) return this.chord[c+1];
        return this.chord[c];
    }

    roman(n) {
        var s, a, b;
        switch (this.chord[n]) {
            case 1: s = "I"; a = 2; b = 4; break;
            case 2: s = "II"; a = 3; b = 5; break;
            case 3: s = "III"; a = 4; b = 6; break;
            case 4: s = "IV"; a = 5; b = 0; break;
            case 5: s = "V"; a = 6; b = 1; break;
            case 6: s = "VI"; a = 0; b = 2; break;
            case 7: s = "VII"; a = 1; b = 3; break;
            case 9:
                s = "V7"; a = 6; b = 1;
                if (this.bas[n] % 7 == (this.current_key + 3) % 7) s += 'd';
                break;
            case 10: s = this.roman(n-1); a = 7; break;
            case 11:
            case 12:
                s = this.roman(n+1); a = 7; break;
            case 13:
                s = "VII7"; a = 1; b = 3;
                if (this.bas[n] % 7 == (this.current_key + 5) % 7) s += 'd';
                break;
        }

        if (a < 7 && this.bas[n] % 7 == (this.current_key + a) % 7) s += 'b';
        if (a < 7 && this.bas[n] % 7 == (this.current_key + b) % 7) s += 'c';
        if (s[0] > 'a' && s[0] < 'e') s = '';
        return s;
    }

    check_spacing() {
        if (this.note('sop') > 7 + this.note('alt')) this.messages.push("Spacing between soprano and alto");
        if (this.note('alt') > 7 + this.note('ten')) this.messages.push("Spacing between alto and tenor");
    }

    check_major3rd(real) {
        var third;
        if (this.current_major == 1) {
            if (real == 1 || real == 4 || real == 5 || real == 9) {
                switch (real) {
                    case 1: third = (this.current_key + 2) % 7; break;
                    case 4: third = (this.current_key + 5) % 7; break;
                    case 5: case 9: third = (this.current_key + 6) % 7; break;
                }
            }
        } else {
            if (real == 5 || real == 9 || real == 6) {
                switch (real) {
                    case 6: third = this.current_key; break;
                    case 5: case 9: third = (this.current_key + 6) % 7; break;
                }
            }
        }
        if (third) {
            var thirds = 0;
            ['sop','alt','ten','bas'].forEach(part => {
                if (this.note(part) % 7 == third) thirds++;
            });
            if (thirds > 1) {
                var s = "Doubling major third"
                if (this.real_chord(this.i) == 6) s += " - Chord VI";
                this.messages.push(s);
            }
        }
    }

    check_leading() {
        var lead = (this.current_key + 6) % 7;
        var leads = 0;
        ['sop','alt','ten','bas'].forEach(part => {
            if (this.note(part) % 7 == lead) leads += 1;
        });
        if (leads > 1) this.messages.push("Doubling leading note");
    }

    check_crossing() {
        if (this.note('alt') > this.sop[this.i-1]) this.messages.push("Alto crossing soprano")
        if (this.note('ten') > this.alt[this.i-1]) this.messages.push("Tenor crossing alto")
        if (this.note('bas') > this.ten[this.i-1]) this.messages.push("Bass crossing tenor")
    }

    check_overlap() {
        if (this.note('alt') > this.note('sop')) this.messages.push("Alto higher than soprano")
        if (this.note('ten') > this.note('alt')) this.messages.push("Tenor higher than alto")
        if (this.note('bas') > this.note('ten')) this.messages.push("Bass higher than tenor")
    }

    check_lead_step() {
        var l = (this.current_key + 6) % 7;
        if (this.next_chord == 10 || this.current_chord == 11 || this.current_chord == 12 || this.next_chord == this.current_chord) return;
        ['sop','alt','ten','bas'].forEach(part => {
            if (this.note(part) % 7 == l && this.nn(part) % 7 != this.current_key) this.messages.push("Leading note should move to tonic");
        });
    }

    check_7th_step() {
        var th = (this.current_key + 3) % 7;
        var rs = (this.current_key + 2) % 7;
        ['sop','alt','ten','bas'].forEach(part => {
            if (this.note(part) % 7 == th && this.nn(part) % 7 != rs) this.messages.push("7th must resolve by step");
        });
    }

    check_consec(high, low, p, s) {
        var h1 = this.note(high),
            l1 = this.note(low),
            h2 = this[high][this.i+p],
            l2 = this[low][this.i+p];
        var f1 = (h1 - l1) % 7 + 1;
        var f2 = (h2 - l2) % 7 + 1;
        if (f1 == 5 && f2 == 5 && h1 != h2) {
            var l = (this.current_key + 6) % 7;
            var ll1 = l1 % 7;
            var ll2 = l2 % 7;
            var hh1 = h1 % 7;
            var hh2 = h2 % 7;
            if (this.current_major == 0 && (ll1 == l || ll2 == l || hh1 == l || hh2 == l)) return;
            if (this.real_chord(this.i) == 9 && ll1 == l) return;
            if (this.real_chord(this.i+p) == 9 && ll2 == l) return;
            if (this.real_chord(this.i) == 5 && ll1 == l) return;
            if (this.real_chord(this.i+p) == 5 && ll2 == l) return;
            if (this.real_chord(this.i) == 7 || this.real_chord(this.i+p) == 7) return;
            if (this.current_major == 0 && (this.real_chord(this.i) == 2 || this.real_chord(this.i+p) == 2)) return;
            this.messages.push("Consecutive 5th (" + s + ")");
            return 1;
        }
        if (f1 == 1 && f2 == 1 && h1 != h2) {
            if (h1 == l1) this.messages.push("Consecutive union (" + s + ")");
            else this.messages.push("Consecutive octave (" + s + ")");
            return 1;
        }
        return 0;
    }

    check_unaccented() {
        ['sop','alt','ten','bas'].forEach(part => {
            if (this[part][this.i-1] != this.note(part)) this.checkPA(part);
        });
    }

    check_accented() {
        ['sop','alt','ten','bas'].forEach(part => {
            if (this[part][this.i+1] != this.note(part)) this.checkPA(part);
        });
    }

    checkPA(part) {
        var bef = this[part][this.i-1],
            cur = this.note(part),
            aft = this[part][this.i+1];
        if (bef == cur+1 && aft == cur-1) this.messages.push("Downwards passing note");
        else if (bef == cur-1 && aft == cur+1) this.messages.push("Upwards passing note");
        else if (bef == cur+1 && aft == cur+1) this.messages.push("Lower auxiliary note")
        else if (bef == cur-1 && aft == cur-1) this.messages.push("Upper auxiliary note")
        else if ((bef == cur+1 || bef == cur-1) && aft == cur) this.messages.push("Anticipation")
        else this.messages.push("Illegal passing/auxiliary note");
    }

    check_suspension() {
        ['sop','alt','ten','bas'].forEach(part => {
            this.check_sus(part);
        });
    }

    check_sus(part) {
        var bef = this[part][this.i-1],
            cur = this.note(part),
            aft = this[part][this.i+1];
        if (aft == cur) {
            return;
        }
        var a, b, c, af, s;
        if (this.real_chord(this.i+1) == 9) a = this.current_key + 4;
        else a = this.current_key + this.real_chord(this.i+1) - 1;
        a = a % 7;
        b = (a + 2) % 7;
        c = (a + 4) % 7;
        af = aft % 7;
        if (bef == cur && cur == aft - 1 && af == a) s = "Suspended leading note";
        else if (bef == cur && cur == aft + 1 && af == a) s = "Suspended 9th";
        else if (bef == cur && af == b) s = "Suspended 4th";
        else if (bef == cur && af == c) s = "Suspended 6th";
        if (bef == cur && s) {
            if (this.note('sop') % 7 == af || this.note('alt') % 7 == af || this.note('ten') % 7 == af || this.note('bas') % 7 == af) s += " - Note of resolution and suspension sounded at same time";
            this.messages.push(s);
        } else {
            this.messages.push("Illegal suspension");
        }
    }

    get current_chord() { return this.chord[this.i]; }
    get next_chord() { return this.chord[this.i+1]; }
    get last_chord() { return this.chord[this.i-1]; }

    get last_real_chord() {
        var c = this.last_chord;
        if (c == 11 || c == 12) return this.real_chord(this.i-2);
        else return this.real_chord(this.i-1);
    }
    get next_real_chord() {
        if (this.next_chord == 10) return this.real_chord(this.i+2);
        else return this.real_chord(this.i+1);
    }
    get next_roman() {
        if (this.next_chord == 10) return this.roman(this.i+2);
        else return this.roman(this.i+1);
    }
    nn(part) {
        if (this.next_chord == 12 || this.next_chord == 10) return this[part][this.i+2];
        else return this[part][this.i+1];
    }

    // For adding a note to the BandJS
    add_note(part, voice, messages) {
        var to = part[this.i];
        var l = this.current_key * 2 + this.current_major;
        var t = to % 7;
        var r = Math.floor(to / 7);
        if (t == 0) { t = 7; r -= 1; }
        var p = keys[l][t-1];
        if (this.current_major == 0 && this.i == this.notes-1 && to % 7 == (this.current_key+2) % 7) {
            if (p[1] == 'b') p = p[0];
            else p+= '#';
            this.messages = this.messages || []; this.messages.push('Tierce de Picardie');
        }
        if (p[0] == 'C' || p[0] == 'D') p += 4 + r;
        else p += 3 + r;

        if (to == part[this.i-1] && this.current_chord == 10) {
            return;
        }
        if (to == part[this.i-1] && (this.last_chord == 11 || this.last_chord == 12)) {
            return;
        }

        var lll = this.length[this.i];
        if (to == part[this.i+1] && this.next_chord == 10) {
            lll += this.length[this.i+1];
        }
        if (to == part[this.i+1] && (this.current_chord == 11 || this.current_chord == 12)) {
            lll += this.length[this.i+1];
            // Worry about 12 ? 10
            if (to == part[this.i+2] && this.chord[this.i+2] == 10) {
                lll += this.length[this.i+2];
            }
            // Sigh, BBC BASIC version was easier here, in that you just said 'Play a note on this channel until it changes', not having to work out stop times...
            var nexti = this.i + 1;
            while (to == part[nexti+1] && (this.chord[nexti] == 11 || this.chord[nexti] == 12)) {
                lll += this.length[nexti+1];
                nexti++;
            }
        }
        voice.note(lengths[lll], p, lll >= 20 ? 0 : 1);
        if (messages.length) {
            voice.notes[voice.notes.length-1].bach_step = this.i;
            voice.notes[voice.notes.length-1].bach_messages = messages;
        }
    }

}

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

    var bbb = new Bach(data);

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

    for (var i=0; i<bbb.notes; i++) {
        var messages = bbb.examine_chord(i);
        bbb.add_note(bbb.sop, soprano, messages);
        bbb.add_note(bbb.alt, alto, messages);
        bbb.add_note(bbb.ten, tenor, messages);
        bbb.add_note(bbb.bas, bass, messages);
    }

    player = conductor.finish();
    player.play();
};

/* Processes for comments, but does not do any playing, just returns them */
bach.process = function process(data) {
    var bbb = new Bach(data);
    var comments = {};
    for (var i=0; i<bbb.notes; i++) {
        var messages = bbb.examine_chord(i);
        if (bbb.current_major == 0 && i == bbb.notes-1) {
            var third = (bbb.current_key+2) % 7;
            if ((bbb.sop[i] % 7 == third) || (bbb.alt[i] % 7 == third) || (bbb.ten[i] % 7 == third) || (bbb.bas[i] % 7 == third)) {
                messages = messages || []; messages.push('Tierce de Picardie');
            }
        }
        if (messages.length) {
            comments[i] = messages;
        }
    }
    return comments;
}

})();

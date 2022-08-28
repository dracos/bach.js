# bach.js

* `bach.process(data)` – data is an array of lines, see below for file format. Scans for comments and returns them.
* `bach.play(data)` – data is an array of lines, see below for file format. Scans and also plays the music.
* `bach.stop()` – stops playback if playing.

Below is the original help extracted from the StrongHelp file, updated with more information.

---

A program to help all you A-level Music students out there – I know there must
be a few...

Harmony will check through your harmony for you, spotting mistakes you have
made. I must stress that in the A-level Music exam, you will not have this
program to check your work for you, so you must be able to do it yourself. But
until then, it sure does speed up the homework!

## Features

As of version 3 (4/3/98), Harmony will find :

* Spacing
* 3rd or root missed out
* Doubling of major 3rd
* Doubling of the leading note
* Crossing
* Overlapping
* Consecutive 5th's, octaves and unison
* V -> IV, and Vb -> IV (both not allowed)
* Diminished triads in root position (must be first inversion)
* Illegal chords (such as IVc)
* The use of chord III in a minor key (strongly discouraged)
* Ic not coming immediately before V
* Vc not coming inbetween I and Ib
* V7d not followed by Ib
* Dominant 7th not falling by step.
* Leading note not rising to tonic (although it doesn't /have/ to)
* Passing and auxiliary notes & suspensions, and their legality.

It can cope with modulations.

It will also play your tune for you, letting you hear any technically-right, but aurally-hideous bits!

## Structure of Music file

This is very complicated to write by hand, but is quite easy to alter once
already created – e.g. to move a note up by two tones, change P to R.

When replaying your tune, Harmony plays all notes of equal length. If you want
to hear what it really sounds like, you can add a list of lengths (in
twentieths of a second) to the end of your Music file, after it has been
created (see example files 3b and 3c).

Line 1 is the version number (2 or 3). Version 2 is only in one key, version 3 can handle modulations.

Line 2 is the number of notes.

If the file is version 2, that is then followed by:

* Line 3: Key (0=D, 1=E, 2=F, 3=G, 4=A, 5=B, 6=C)
* Line 4: Major (1 for yes, 0 for no)

If it is version 3, that is followed by:

* Line 3: the number of keys the piece is in
* That many groups of three lines, each consisting of:
    * Which note the piece modulates on (numbered from 1)
    * Key (0=D, 1=E, 2=F, 3=G, 4=A, 5=B, 6=C)
    * Major (1 for yes, 0 for no)

...followed by 5 letters per line, one line for each note. First four letters
are the notes (SATB), the fifth letter is the chord.

### Notes

```
A - E B - F C - G D - A E - B F - C        G - D
H - E I - F J - G K - A L - B M - Middle C N - D
O - E P - F Q - G R - A S - B T - C        U - D
V - E W - F X - G Y - A Z - B [ - C        \ - D
] - E
```

### Chords

```
A - I B - II C - III D - IV E - V F - VI G - VII
I - V7
J - Unaccented passing/auxiliary note
K - Accented passing/auxiliary note
L - Suspension
```

## History

Changes from...

...version 2 to version 3

Can now cope with modulations into new keys (the heartache conveyed by so few words!)

...version 1.5 to version 2

* Harmony now plays your tune back to you!
* Recognition of suspensions added
* Unessential menu added to choose passing notes, auxiliary notes, or suspensions. You now enter normal notes with Select, and bring up the menu with Adjust.

...version 1 to version 1.5

Can now use *passing* and *auxiliary* notes - Adjust for unaccented, Menu for accented, Select for normal.

## Origin of program

A reading from the Book of Sighs, chapter XVII.

1. And it did pass that much harmony homework was burdened upon the shoulders
   of an astute, but sorely put-upon A-level student named Matthew Somerville.

2. And verily he did toil at his task, but at every turn was impeded by the
   wily consecutive 5th, of which at least one did slip through his careful
   probing.

3. Thus, the weekend before the coming of the January 1998 A-level Maths module
   exams, he did sit at his computer, and brought his mind to bear on a new
   task - to design a program to check his wretched harmony for him.

4. The path was rocky, and full of hardships and food breaks, but finally,
   after much work (which would have been better spent revising) he had
   finished.

5. And he looked upon his product, and saw that it was good.

6. Except for the cumbersome entry system.

7. And the knowledge that on Monday, Mr. Reaks would impart more of his
   universally complicated harmony “rules”, and he would have to alter
   his masterpiece.

8. And - But Matthew did look upon his clock, and espying the time, did resign
   himself to another week of college, and headed off to bed.

Here ends the reading from the Book of Sighs.

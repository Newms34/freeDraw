var app = angular.module("freeTunes", []);
var socket = io();

app.controller("tuneController", function($scope, $window) {
    $scope.un = Math.floor(Math.random() * 99999999).toString(32);
    $scope.noting = false;
    $scope.noteAddLen = 0;
    $scope.noteNames = [];
    $scope.numPlayers = 0;
    $scope.waveTypes = ['triangle', 'sine', 'square', 'sawtooth']
    $scope.tuneType = 'triangle';
    $scope.tempo = 20;
    $scope.noteObjs = [];
    $scope.currNoteStart;
    $scope.oscs = []; //array of oscillators;
    $scope.audioCont = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);
    if ($scope.audioCont) {
        $scope.context = new $scope.audioCont();
        $scope.gainNode = $scope.context.createGain ? $scope.context.createGain() : $scope.context.createGainNode();
        $scope.gainNode.gain.value = 0.2; //vol!
        $scope.gainNode.connect($scope.context.destination);
    } else {
        alert('Your browser doesn\'t support webaudio. Sorry!');
    }
    $scope.currNoteColTarg;
    $scope.freqs = [130.813, 146.832, 164.814, 174.614, 195.998, 220, 246.942, 261.626, 293.665, 329.628, 349.228, 391.995, 440, 493.883, 523.251, 587.33, 659.255, 698.456, 783.991, 880, 987.767]
    $scope.noteCols = ['Do', 'Re', 'Mi', 'Fa', 'So', 'La', 'Ti', 'Do', 'Re', 'Mi', 'Fa', 'So', 'La', 'Ti', 'Do', 'Re', 'Mi', 'Fa', 'So', 'La', 'Ti'];
    $(document).ready(function() {
        $scope.allCols = $('.noteCol');
        for (var i = 0; i < $scope.allCols.length; i++) {
            $scope.allCols[i].onmousemove = function(e) {
                var vertPos = (Math.floor(e.offsetY / 10)) * 10;
                if (!$scope.noting) {
                    $(this).children('.noteCursTracker').css({ 'transform': 'translateZ(2px) translateY(' + vertPos + 'px)', 'height': '15px' });
                } else if ($scope.currNoteColTarg == e.target.id) {
                    //if we're on the same column
                    var totalHeight = vertPos - parseInt($scope.currNoteStart);
                    totalHeight > 0 ? totalHeight = totalHeight : totalHeight = 0;
                    $(this).children('.noteCursTracker').css({ 'transform': 'translateZ(2px) translateY(' + $scope.currNoteStart + 'px)', 'height': +totalHeight + 'px' });
                }
            };
            $scope.allCols[i].onmouseout = function(e) {
                //when we remove the mouse, send the tracker back up to the 'base' position
                if (!$scope.noting) {
                    $(this).children('.noteCursTracker').css('transform', 'translateZ(2px) translateY(0px)')
                }
            }
            $scope.allCols[i].onclick = function(e) {
                /*situations:
                1) nothing selected: click a column
                2) colA selected: click colA
                3) colA selected: click colB
                */
                console.log($scope.noting, e.target.id, $scope.currNoteColTarg)
                if (!$scope.noting || (e.target.id == $scope.currNoteColTarg)) {
                    $scope.noting = !$scope.noting;
                }
                if ($scope.noting) {
                    //just clicked to START a note.
                    if (!$scope.currNoteColTarg || $scope.currNoteColTarg == null) {
                        $scope.currNoteStart = (Math.floor(e.offsetY / 10)) * 10;
                        $scope.currNoteColTarg = e.target.id;
                    }
                } else {
                    //just clicked to STOP a note.
                    if ($scope.currNoteColTarg == e.target.id) {
                        //don't do anything if we're active and we clicked another col
                        var vertPos = (Math.floor(e.offsetY / 10)) * 10;
                        var noteIn = { sn: $scope.currNoteStart, en: vertPos, targ: $scope.currNoteColTarg };
                        socket.emit('noteSrv', noteIn);
                        $scope.currNoteColTarg = null;
                    }
                }
            }
            newOsc = $scope.context.createOscillator();
            newOsc.frequency.value = $scope.freqs[i];
            newOsc.type = $scope.tuneType;
            newOsc.start ? newOsc.start(0) : newOsc.noteOn(0);
            $scope.oscs.push(newOsc);
        }
        socket.emit('getInitTune', { usr: $scope.un });
        socket.on('getTuneStart', function(getTuneUsr) {
            if (getTuneUsr.usr == $scope.un) {
                console.log('This user, ', $scope.un, ' requested by ', getTuneUsr)
                    //if this user is the one we're requesting from
                    //send the desiring user and the canvas data
                socket.emit('usrGiveTune', {
                    data: $scope.noteObjs,
                    wants: getTuneUsr.wants
                })
            }
        });
        socket.on('userDC', function(marvel) {
            if ($scope.un == marvel.dcName) {
                bootbox.confirm('It looks like you&rsquo;ve lost your connection! Refresh page?', function(resp) {
                    if (resp) {
                        window.location.reload(true);
                    }
                })
            }
        })
        socket.on('sendInitTune', function(initTuneData) {
            if (initTuneData.wants == $scope.un) {
                //this is the user that asked for the data
                //need to run makeNote on data!
                for (var i = 0; i < initTuneData.data.length; i++) {
                    $scope.makeNote(initTuneData.data[i].start,initTuneData.data[i].end,initTuneData.data[i].col);
                }
            }
        })
        socket.on('noteCli', function(noteData) {
            //got a note from backend! Oh boy! It's like christmas in.. whatever month it is!
            $scope.makeNote(noteData.sn, noteData.en, noteData.targ);
        })
        $scope.testTune = function(e) {
            e.stopPropagation();
            var tn = parseInt($(e.target).parent()[0].id.slice(7));
            if (!$scope.oscs[tn].isBoopin) {
                $scope.oscs[tn].isBoopin = true;
                $scope.oscs[tn].connect($scope.gainNode);
                //$scope.oscs[tn].start ? $scope.oscs[tn].start(0) : $scope.oscs[tn].noteOn(0);
                var t = setTimeout(function() {
                    $scope.oscs[tn].disconnect();
                    $scope.oscs[tn].isBoopin = false;
                }, 300);
            }
        }
        console.log('Oscillators:', $scope.oscs)
        $scope.makeNote = function(ns, ne, t) {
            if (ne < ns) {
                //if our start is greater than our end, just cancel
                return false;
            }
            var newNote = document.createElement('div');
            newNote.className = 'noteBlock';
            newNote.style.top = ns + 'px';
            newNote.style.width = (50 / $scope.noteCols.length) + '%';
            newNote.style.height = (ne - ns) + 'px';
            var theId = 'sgNote' + $scope.noteObjs.length;
            newNote.id = theId;
            $scope.noteNames.push(theId);
            $scope.noteObjs.push({
                col: t,
                start: ns,
                end: ne
            })
            newNote.onmousemove = function(e) {
                e.stopPropagation();
            };
            newNote.onclick = function(e) {
                e.stopPropagation();
                socket.emit('noteRemSrv', { note: e.target.id });
            };
            $('#' + t).append(newNote);
            //now see if we need to lengthen the bars
            if ($(document).height() - ne < 20) {
                //within 20 eunuchs of the bottom
                for (var n = 0; n < $scope.noteCols.length; n++) {
                    var oldHeight = parseInt($('#noteCol' + n).css('height'));
                    $('#noteCol' + n).css('height', (oldHeight + 50) + 'px');
                }
            }
            $scope.$digest();
        }
        socket.on('noteRemCli', function(nrDat) {
            //mmm, nrds
            $scope.delNote(nrDat.note);
        })
        $scope.delNote = function(t) {
            var pos = $scope.noteNames.indexOf(t);
            $scope.noteNames.splice(pos, 1);
            $scope.noteObjs.splice(pos, 1);
            $('#' + t).remove();
            $scope.$digest();
        };
        $scope.player = function(arr) {
            //tabulate each note's list of start and stop times.
            //then set up a timer that runs from t=0 to the greatest note end time, and at each 'tick', see if note status should be on or off.
            //this is going to be (somewhat!) decoupled from the song creation UI, since I want people to be able to play saved songs here.
            var noteTimesArr = [],
                maxLen = 0,
                noteT = 0;
            for (var i = 0; i < $scope.noteCols.length; i++) {
                noteTimesArr.push({ starts: [], ends: [] })
            }
            for (i = 0; i < arr.length; i++) {
                var whichNote = parseInt(arr[i].col.slice(7));
                noteTimesArr[whichNote].starts.push(arr[i].start);
                noteTimesArr[whichNote].ends.push(arr[i].end);
                if (arr[i].end > maxLen) {
                    maxLen = arr[i].end;
                }
            }
            console.log(noteTimesArr);
            var t = setInterval(function() {
                for (var q = 0; q < noteTimesArr.length; q++) {
                    if (!$scope.oscs[q].isBoopin && noteTimesArr[q].starts.indexOf(noteT) != -1) {
                        //note is not currently started, and we've got a start at this time;
                        $scope.oscs[q].connect($scope.gainNode);
                        $scope.oscs[q].isBoopin = true;
                    } else if ($scope.oscs[q].isBoopin && noteTimesArr[q].ends.indexOf(noteT) != -1) {
                        $scope.oscs[q].disconnect();
                        $scope.oscs[q].isBoopin = false;
                    }
                }
                //finally, increment counter and see if we're at end.
                noteT += 5;
                if (noteT >= maxLen) {
                    for (var x = 0; x < $scope.oscs.length; x++) {
                        //kill all notes!
                        $scope.oscs[x].disconnect();
                        $scope.oscs[x].isBoopin = false;
                    }
                    clearInterval(t)
                }
            }, parseInt(1000 / $scope.tempo));
        }
        socket.on('updateUserNum', function(numbs) {
            console.log('num:', numbs)
            $scope.numPlayers = numbs.num;
            $scope.$digest();
        })
        $scope.getPlayers = function() {
            if ($scope.numPlayers < 2) {
                return 'by yourself!';
            } else if ($scope.numPlayers < 3) {
                return 'with 1 other player!'
            } else {
                return 'with ' + ($scope.numPlayers - 1) + ' other players!'
            }
        }
    })
    $scope.explText = '<h3>FreeTunes</h3><h4>The Collaborative Music Initiative</h4><hr/><b>About:</b><br/>FreeTunes is a collaborative music app, where you&rsquo;re making music with anonymous other users.<ul><li>You don&rsquo;t know who you&rsquo;re making music with!</li><li>I don&rsquo;t save the music!</li><li>Seriously. I don&rsquo;t. Everything&rsquo;s running off a <a href="https://www.raspberrypi.org/products/model-b-plus/" target="_blank">Raspberry Pi B+</a> server, so I dont even have the ROOM to save your stuff!</li></ul><hr/><b>FAQ:</b><br/><div class="faqQ">How does this work?</div><div class="faqA">In short, magic. In slightly longer, I&rsquo;m using socket.io and HTML5&rsquo;s Audio API to transmit your note "commands" thru the server and to other users.</div><div class="faqQ">Really. You can be honest. Do you save anything?</div><div class="faqA">For the last time, no. And it&rsquo;s not just a question of me wanting to keep you safe: I literally cannot save stuff to my server, since there&rsquo;s not enough room!</div><div class="faqQ">But I really like this tune! Can&rsquo;t I keep it?</div><div class="faqA">Right now, no. Sorry! But I <i>am</i> working on a way for you to be able to save and play back tunes you&rsquo;ve made!</div><div class="faqQ">Can I PLEASE start with a pre-made song?</div><div class="faqA">Sorry, no. That&rsquo;s kinda against the spirit of this app. Unlike the drawing portion of this app, there actually is no way (that I know of!) to &rsquo;hack&rsquo; a tune into the app.</div>';
    $scope.expl = function() {
        bootbox.alert($scope.explText)
    };
});
/*
TO DO:
write stuff echoing draw mode to get initial 'state' for a user logging into an in-progress piece
*/

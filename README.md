#FreeDraw
##The Collaborative Drawing and Music Initiative
----
[Click here to play!](71.230.199.98:9264)
----
##Contents

 - [What Is FreeDraw](#what-is-freedraw)
 - [Usage](#usage)
 - [Behind the Scenes](#behind-the-scenes)
 - [Author](#author)
 - [License](#license)

##What is FreeDraw?
FreeDraw and its sister, FreeTunes, are collaborative drawing apps with a twist: nothing's saved and you're completely anonymous! Each picture (or song) only remains active as long as participants are currently playing. Otherwise, you start with a blank canvas!

----
##Usage 
###FreeDraw
Click and drag on the canvas to draw. Change the color or transparency by clicking the appropriate boxes. 

###FreeTunes
The vertical columns represent notes, with each note labeled up top. To place a note:
 1. Click on the column (pitch) where you want to place a note. The vertical position of your click is the START time.
 2. Click on the same column where you want the note to end. The end of the grey box that appears is that note's END time.

Keep making notes until you're happy with your song! Feel free to use the controls on the right to adjust the tone, volume, and tempo!

----
##Behind the Scenes
FreeDraw and FreeTunes run on a Raspberry Pi B+ model microcomputer, running Rasbian as its OS. The server itself is a NodeJS server, running express and AngularJS (1.x) as its front-end framework. Communication between the client(s) and server is accomplished via socket.io. Finally, the audio is produced via the browser-native Web Audio API. Sorry, users of older browsers!

----
##Author
This app was thought up, designed, and written by [yours truly](https://github.com/Newms34/) . Feel free to [visit me](https://www.linkedin.com/in/newms34) on LinkedIn too!

----
##License
This app is released to the public. I don't own some of the pictures used as background images, but feel free to use whatever else you want. This app doesn't even really have a license. It's got like a learner's permit or something.

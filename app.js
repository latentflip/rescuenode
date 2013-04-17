var $ = require('NodObjC')
var Bacon = require('baconjs')

$.framework('foundation')
$.framework('carbon')
$.framework('AppKit')

var pool = $.NSAutoreleasePool('alloc')('init')


var getPos = function() {
  event = $.CGEventCreate(null)
  loc = $.CGEventGetLocation(event)
  //$.CFRelease(event)
  return loc.x + ',' + loc.y;
};

function pressingButton() {
  for(var i=0; i<128; i++) {
    if ($.CGEventSourceKeyState($.kCGEventSourceStateCombinedSessionState,i)) {
      return true;
    }
  }
}

var buttonPress = new Bacon.Bus()

setInterval(function() {
  if (pressingButton()) {
    buttonPress.push(true);
  }
}, 100);

var keyboardActivity = buttonPress
                        .map('keyboard')

var mouseActivity = Bacon.fromPoll(100, function() {
                       return new Bacon.Next(getPos())
                     })
                     .skipDuplicates()
                     .map('mouse')
                     .skip(1)

var combined = keyboardActivity.merge(mouseActivity);

var active = combined.map(true)
var inActive = active.debounce(30000).map(false)

var activity = active.merge(inActive)
                     .skipDuplicates()
                     .toProperty(false)
activity.log()


var fs = require('fs')
var out = fs.createWriteStream('foo.csv', {flags: 'a'})
activity.onValue(function(val) {
  var time = new Date().valueOf();
  out.write(time.toString() + ", " + val.toString() + "\n");
});

process.on( 'SIGINT', function() {
  console.log( "\ngracefully shutting down from  SIGINT (Crtl-C)" )
  out.end()
  process.exit()
})

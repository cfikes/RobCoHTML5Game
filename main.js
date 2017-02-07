 
//GLOBAL VARIABLE DATABASE
var vaultDoorStatus = "Locked";
var hvacMode = "Heat";
var hvacFanStatus = "On";
var hvacFilterStatus = "Outside";
var waterFilterStatus = "Functioning";
 
 
//Initialize local storage
//Light Status
if ( !localStorage.lightStatus ) {
	localStorage.lightStatus = "ON";
}


	
 
(function() {

  var $output;
  var _inited = false;
  var _locked = false;
  var _buffer = [];
  var _obuffer = [];
  var _ibuffer = [];
  var _cwd = "/";
  var _prompt = function() { return _cwd + " $ "; };
  var _history = [];
  var _hindex = -1;
  var _lhindex = -1;

  var _filetree = {
    'documents': {type: 'dir', files: {
      'example1': {type: 'file', mime: 'text/plain', content: "This is just an example file"},
      'example2': {type: 'file', mime: 'text/plain', content: "This is just an example file. What did you think it was?"},
      'example3': {type: 'file', mime: 'text/plain', content: "This is just an example file. I'm super cereal!"},
      'example4': {type: 'file', mime: 'text/plain', content: "This is just an example file. Such wow!"},
      'specialCommands': {type: 'file', mime: 'text/plain', content: "RobCo likes to hide commands from the user, some of these can be quite useful."}
    }},
    'storage':   {type: 'dir', files: {
    }},
    'INSTRUCTIONS': {type: 'file', mime: 'text/plain', content: "Maintain peace and order at all cost."},
    'README': {type: 'file', mime: 'text/plain', content: ""}
  };

  var _commands = {

    sound: function(volume, duration, freq) {
      if ( !window.webkitAudioContext ) {
        return ['Your browser does not support his feature :('];
      }

      volume = ((volume || '').replace(/[^0-9]/g, '') << 0) || 100;
      duration = ((duration || '').replace(/[^0-9]/g, '') << 0) || 1;
      freq = ((freq || '').replace(/[^0-9]/g, '') << 0) || 1000;

      var context = new webkitAudioContext();
      var osc = context.createOscillator();
      var vol = context.createGainNode();

      vol.gain.value = volume/100;
      osc.frequency.value = freq;
      osc.connect(vol);
      vol.connect(context.destination);
      osc.start(context.currentTime);

      setTimeout(function() {
        osc.stop();
        osc = null;
        context = null;
        vol = null;
      }, duration*1000);

      return ([
        'Volume:    ' + volume,
        'Duration:  ' + duration,
        'Frequenzy: ' + freq
      ]).join("\n");
    },

    ls: function(dir) {
      dir = parsepath((dir || _cwd));

      var out = [];
      var iter = getiter(dir);

      var p;
      var tree = (iter && iter.type == 'dir') ? iter.files : _filetree;
      var count = 0;
      var total = 0;

      for ( var i in tree ) {
        if ( tree.hasOwnProperty(i) ) {
          p = tree[i];
          if ( p.type == 'dir' ) {
            out.push(format('{0} {1} {2}', padRight('<'+i+'>', 20), padRight(p.type, 20), '0'));
          } else {
            out.push(format('{0} {1} {2}', padRight(i, 20), padRight(p.mime, 20), p.content.length));
            total += p.content.length;
          }
          count++;
        }
      }

      out.push(format("\n{0} file(s) in total, {1} byte(s)", count, total));

      return out.join("\n");
    },

    cd: function(dir) {
      if ( !dir ) {
        return (["You need to supply argument: dir"]).join("\n");
      }

      var dirname = parsepath(dir);
      var iter = getiter(dirname);
      if ( dirname == '/' || (iter && iter.type == 'dir')) {
        _cwd = dirname;
        return (['Entered: ' + dirname]).join("\n");
      }

      return (["Path not found: " + dirname]).join("\n");
    },

    cat: function(file) {
      if ( !file ) {
        return (["You need to supply argument: filename"]).join("\n");
      }

      var filename = parsepath(file);
      var iter = getiter(filename);
      if ( !iter ) {
        return (["File not found: " + filename]).join("\n");
      }

      return iter.content;
    },

    cwd: function() {
      return (['Current directory: ' + _cwd]).join("\n");
    },

    clear: function() {
      return false;
    },

    contact: function(key) {
      key = key || '';
      var out = [];

      switch ( key.toLowerCase() ) {
        case 'email' :
          window.open('mailto:andersevenrud@gmail.com');
          break;
        case 'github' :
          window.open('https://github.com/andersevenrud/');
          break;
        case 'linkedin' :
          window.open('http://www.linkedin.com/in/andersevenrud');
          break;
        case 'youtube' :
          window.open('https://www.youtube.com/user/andersevenrud');
          break;
        case 'worpress' :
          window.open('http://anderse.wordpress.com/');
          break;
        case 'twitter' :
          window.open('https://twitter.com/#!/andersevenrud');
          break;
        case 'google+' :
          window.open('https://profiles.google.com/101576798387217383063?rel=author');
          break;

        default :
          if ( key.length ) {
            out = ['Invalid key: ' + key];
          } else {
            out = [
              "Contact information:\n",
              'Name:      Anders Evenrud',
              'Email:     andersevenrud@gmail.com',
              'Github:    https://github.com/andersevenrud/',
              'LinkedIn:  http://www.linkedin.com/in/andersevenrud',
              'YouTube:   https://www.youtube.com/user/andersevenrud',
              'Wordpress: http://anderse.wordpress.com/',
              'Twitter:   https://twitter.com/#!/andersevenrud',
              'Google+:   https://profiles.google.com/101576798387217383063?rel=author'
            ];
          }
          break;
      }

      return out.join("\n");
    },
 
	hardware: function(key,action) {
      key = key || '';
	  action = action || '';
      var out = [];
	  
	  switch ( key.toLowerCase() ) {
		  case 'lights' :
			switch ( action.toLowerCase() ) {
				case 'off' :
					localStorage.lightStatus = "OFF";
					out = ['All lights powered off.'];
					break;
				case 'on' :
					localStorage.lightStatus = 'ON';
					out = ['All lights powered on.'];
					break;
				case 'status' :
					out = ['Lights are currently ' + localStorage.lightStatus + '.'];
					break;
				default:
				if (action.length ) {
					out = ['Invalid Action: ' + action];
				} else {
					out = [
						'off:      Turns off all lights',
						'on:       Turns on all lights',
						'status:   Displays light status'
					];
				}			
				break;
			}
			break;
			
			case 'status' :
				out = [
				'Lighting:     ' + localStorage.lightStatus + '',
				'HVAC Mode:    ' + hvacMode + '',
				'HVAC Fan:     ' + hvacFanStatus + '',
				'HVAC Source:  ' + hvacFilterStatus + '',
				'Water Filter: ' + waterFilterStatus + ''
				];
			break;
			
		  default :
          if ( key.length ) {
            out = ['Invalid Key: ' + key];
          } else {
            out = [
              "Documented Actions:\n",
              'Lights:    On and Off',
              'HVAC:      Heating and Cooling',
              'Staus:     View all status'
            ];
          }
          break;
      }

      return out.join("\n");
    },
		  
	
	map: function(floor) {
      floor = floor || '';
      var out = [];
	
	switch ( floor.toLowerCase() ) {
		case "1" :
			out = [
			'VAULT MAP  VERSION 2077-13B  OVERVIEW LEVEL 1',
			'-----------------------------------------------------------------',
			'*****************************************************************',
			'**-------------------------------------------------------------**',
			'**|         |         D         D         D         D         |**',
			'**|         |  RR 01  D         D         D         D         |**',
			'**|         |         D         D         D         D         |**',
			'**| STORE A |---------|         |         |         |         |**',
			'**|         |         D         |  SEC 01 |         |  ISSUE  |**',
			'**|         |  RR 02  D         |         |         |         |**',
			'**|         |         D         |         |         |         |**',
			'**|---DDD---|---------|         |---------|         |---DDD---|**',
			'**|                   |         |                   |         |**',
			'**|                   |         |                   |---DDD---|**',
			'**|                   D         |                   |         |**',
			'**|   DINING AREA     D         |   HOLDING AREA    |   LOCK  |**',
			'**|                   D         |                   |   DOWN  |**',
			'**|                   |         |                   |         |**',
			'**|                   |         |                   |         |**',
			'**|                   |         |                   |   EXIT  |**',
			'*---------------------|--SSSSS--|----------------------******--**',
			'**********************|SSSSSSSSS|********************************',
			'**********************|SSSSSSSSS|********************************'
			];
			break;
		
		case "2" :
			out = [
			'VAULT MAP  VERSION 2077-13B  OVERVIEW LEVEL 1',
			'-----------------------------------------------------------------',
			'*****************************************************************',
			'**-------------------------------------------------------------**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|               MECHANICAL MAINTENANCE AREA 01              |**',
			'**|                                                           |**',
			'**|                 CLEARANCE REQUIRED TO VIEW                |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                                                           |**',
			'**|                   |---DDD---|                             |**',
			'*---------------------|--SSSSS--|------------------------------**',
			'**********************|SSSSSSSSS|********************************',
			'**********************|SSSSSSSSS|********************************'
			];
			break;
			
		default :
          if ( floor.length ) {
            out = ['Invalid Floor: ' + floor];
          } else {
            out = [
			'Enter floor number or name to show',
			'the current map.'
			];
		  }
		  break;
	  }

      return out.join("\n");
    },
	
	reboot: function() {
		setTimeout(function(){
		location.reload();
		}, 5000);
		
	  out = [ 'LOGGING OUT USERS AND REBOOTING' ];	
	  return out.join("\n");
	},
	
	dbpurge : function () {
	  localStorage.clear();
	  out = [ 'localStorage is cleared, please reboot.' ];	
	  return out.join("\n");
	},
	
	
	
	helphidden: function() {
      var out = [
        'reboot                                       Restarts the system',
        'dbpurge                                      Clears localStorage',
		'dbview                                       Returns all localStorage'
      ];

      return out.join("\n");
    },
	
	
	print : function() {
		print("TESTING 1 2 3 4");
	},
		
    help: function() {
      var out = [
        'help                                         This command',
        'clear                                        Clears the screen',
		'hardware <item> <action>                     Vault baseline operations',
        'map <floor>                                  Displays map of requested floor',
		'ls                                           List current (or given) directory contents',
        'cd <dir>                                     Enter directory',
        'cat <filename>                               Show file contents',
        'sound [<volume 0-100>, <duration>, <freq>]   Generate a sound (WebKit only)',
        ''
      ];

      return out.join("\n");
    }

  };

  /////////////////////////////////////////////////////////////////
  // UTILS
  /////////////////////////////////////////////////////////////////

  function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', selectionEnd);
      range.moveStart('character', selectionStart);
      range.select();
    }
  }

  function format(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;

    var sprintf = function (match, number) {
      return number in args ? args[number] : match;
    };

    return format.replace(sprintfRegex, sprintf);
  }


  function padRight(str, l, c) {
    return str+Array(l-str.length+1).join(c||" ")
  }

  function padCenter(str, width, padding) {
    var _repeat = function(s, num) {
      for( var i = 0, buf = ""; i < num; i++ ) buf += s;
      return buf;
    };

    padding = (padding || ' ').substr( 0, 1 );
    if ( str.length < width ) {
      var len     = width - str.length;
      var remain  = ( len % 2 == 0 ) ? "" : padding;
      var pads    = _repeat(padding, parseInt(len / 2));
      return pads + str + pads + remain;
    }

    return str;
  }

  function parsepath(p) {
    var dir = (p.match(/^\//) ? p : (_cwd  + '/' + p)).replace(/\/+/g, '/');
    return realpath(dir) || '/';
  }

  function getiter(path) {
    var parts = (path.replace(/^\//, '') || '/').split("/");
    var iter = null;

    var last = _filetree;
    while ( parts.length ) {
      var i = parts.shift();
      if ( !last[i] ) break;

      if ( !parts.length ) {
        iter = last[i];
      } else {
        last = last[i].type == 'dir' ? last[i].files : {};
      }
    }

    return iter;
  }

  function realpath(path) {
    var parts = path.split(/\//);
    var path = [];
    for ( var i in parts ) {
      if ( parts.hasOwnProperty(i) ) {
        if ( parts[i] == '.' ) {
          continue;
        }

        if ( parts[i] == '..' ) {
          if ( path.length ) {
            path.pop();
          }
        } else {
          path.push(parts[i]);
        }
      }
    }

    return path.join('/');
  }

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  /////////////////////////////////////////////////////////////////
  // SHELL
  /////////////////////////////////////////////////////////////////

  (function animloop(){
    requestAnimFrame(animloop);

    if ( _obuffer.length ) {
      $output.value += _obuffer.shift();
      _locked = true;

      update();
    } else {
      if ( _ibuffer.length ) {
        $output.value += _ibuffer.shift();

        update();
      }

      _locked = false;
      _inited = true;
    }
  })();

  function print(input, lp) {
    update();
    _obuffer = _obuffer.concat(lp ? [input] : input.split(''));
  }

  function update() {
    $output.focus();
    var l = $output.value.length;
    setSelectionRange($output, l, l);
    $output.scrollTop = $output.scrollHeight;
  }

  function clear() {
    $output.value = '';
    _ibuffer = [];
    _obuffer = [];
    print("");
  }

  function command(cmd) {
    print("\n");
    if ( cmd.length ) {
      var a = cmd.split(' ');
      var c = a.shift();
      if ( c in _commands ) {
        var result = _commands[c].apply(_commands, a);
        if ( result === false ) {
          clear();
        } else {
          print(result || "\n", true);
        }
      } else {
        print("Unknown command: " + c);
      }

      _history.push(cmd);
    }
    print("\n\n" + _prompt());

    _hindex = -1;
  }

  function nextHistory() {
    if ( !_history.length ) return;

    var insert;
    if ( _hindex == -1 ) {
      _hindex  = _history.length - 1;
      _lhindex = -1;
      insert   = _history[_hindex];
    } else {
      if ( _hindex > 1 ) {
        _lhindex = _hindex;
        _hindex--;
        insert = _history[_hindex];
      }
    }

    if ( insert ) {
      if ( _lhindex != -1 ) {
        var txt = _history[_lhindex];
        $output.value = $output.value.substr(0, $output.value.length - txt.length);
        update();
      }
      _buffer = insert.split('');
      _ibuffer = insert.split('');
    }
  }

  window.onload = function() {
    $output = document.getElementById("output");
    $output.contentEditable = true;
    $output.spellcheck = false;
    $output.value = '';

    $output.onkeydown = function(ev) {
      var k = ev.which || ev.keyCode;
      var cancel = false;

      if ( !_inited ) {
        cancel = true;
      } else {
        if ( k == 9 ) {
          cancel = true;
        } else if ( k == 38 ) {
          nextHistory();
          cancel = true;
        } else if ( k == 40 ) {
          cancel = true;
        } else if ( k == 37 || k == 39 ) {
          cancel = true;
        }
      }

      if ( cancel ) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      }

      if ( k == 8 ) {
        if ( _buffer.length ) {
          _buffer.pop();
        } else {
          ev.preventDefault();
          return false;
        }
      }

      return true;
    };

    $output.onkeypress = function(ev) {
      ev.preventDefault();
      if ( !_inited ) {
        return false;
      }

      var k = ev.which || ev.keyCode;
      if ( k == 13 ) {
        var cmd = _buffer.join('').replace(/\s+/, ' ');
        _buffer = [];
        command(cmd);
      } else {
        if ( !_locked ) {
          var kc = String.fromCharCode(k);
          _buffer.push(kc);
          _ibuffer.push(kc);
        }
      }

      return true;
    };

    $output.onfocus = function() {
      update();
    };

    $output.onblur = function() {
      update();
    };

    window.onfocus = function() {
      update();
    };

	
	print("ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM\n", true);
	print("COPYRIGHT 2075-2077 ROBCO INDUSTRIES\n\n", true);
	print("---------------------------------------------\n");
	print(" ____            __       ____              \n",true);
	print("/\\  _`\\         /\\ \\     /\\  _`\\            \n",true);
	print("\\ \\ \\X\\ \\    ___\\ \\ \\____\\ \\ \\/\\_\\    ___   \n",true);
	print(" \\ \\ ,  /   / __`\\ \\ '__`\\\\ \\ \\/_/_  / __`\\ \n",true);
	print("  \\ \\ \\\\ \\ /\\ \\X\\ \\ \\ \\X\\ \\\\ \\ \\X\\ \\/\\ \\X\\ \\\n",true);
	print("   \\ \\_\\ \\_\\ \\____/\\ \\_,__/ \\ \\____/\\ \\____/\n",true);
	print("    \\/_/\\/ /\\/___/  \\/___/   \\/___/  \\/___/ \n\n",true);
	print("---------------------------------------------");
	print("\n",true);
	print("VAULT OPERATIONS\n",true);

    print("\n\n", true);
    print("Type 'help' for a list of available commands.\n", true);
    print("\n\n" + _prompt());

  };

})();
